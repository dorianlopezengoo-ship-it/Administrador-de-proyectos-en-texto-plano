import { AppSettings, OrgSettings, BeancountSettings, WorkflowSettings } from '@/types';

const SETTINGS_STORAGE_KEY = 'orgbean_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  org: {
    authorName: 'User',
    defaultTodoSequence: ['TODO', 'DOING', 'WAIT', 'DONE', 'CANCELLED'],
    autoCloseTimestamp: true,
    defaultStartupFold: 'content',
    defaultPriority: 'A',
    defaultTags: ['focus', 'project', 'finance'],
    habitRepeatDefault: '.+1d',
    noteTemplate: `#+TITLE: {{TITLE}}
#+AUTHOR: {{AUTHOR}}
#+DATE: {{DATE}}
#+STARTUP: {{STARTUP}}
#+TAGS: {{TAGS}}

* {{TITLE}} :OVERVIEW:
:PROPERTIES:
:ID: {{ID}}
:CREATED: <{{DATE}}>
:CATEGORY: General
:END:

** Notes & Objectives
- Initial brainstorm and objectives

** Action Items
*** TODO Review project requirements
SCHEDULED: <{{DATE}}>
- [ ] Preliminary assessment
`,
    taskTemplate: `*** {{STATUS}} {{PRIORITY}}{{TITLE}} {{TAGS}}
{{SCHEDULED}}
{{BODY}}`,
  },
  bean: {
    operatingCurrency: 'USD',
    defaultFlag: '*',
    defaultAssetAccount: 'Assets:Bank:Checking',
    defaultLiabilityAccount: 'Liabilities:CreditCard:Chase',
    defaultExpenseAccount: 'Expenses:Office:Software',
    defaultIncomeAccount: 'Income:Consulting',
    bookingMethod: 'FIFO',
    autoBalanceResidual: true,
    linkSyntax: 'note',
    ledgerTemplate: `; ==============================================================================
; Plain-Text Ledger: {{TITLE}}
; Beancount Double-Entry Accounting
; ==============================================================================

option "title" "{{TITLE}}"
option "operating_currency" "{{CURRENCY}}"
option "booking_method" "{{BOOKING_METHOD}}"

; Accounts Hierarchy Declarations
2026-01-01 open Assets:Bank:Checking {{CURRENCY}}
2026-01-01 open Assets:Bank:Savings {{CURRENCY}}
2026-01-01 open Liabilities:CreditCard:Chase {{CURRENCY}}
2026-01-01 open Equity:Opening-Balances {{CURRENCY}}
2026-01-01 open Income:Consulting {{CURRENCY}}
2026-01-01 open Expenses:Office:Hardware {{CURRENCY}}
2026-01-01 open Expenses:Office:Software {{CURRENCY}}

; Initial Balances
{{DATE}} * "Opening Balances" "Initial Capital Setup"
  Assets:Bank:Checking                5000.00 {{CURRENCY}}
  Equity:Opening-Balances            -5000.00 {{CURRENCY}}
`,
    txTemplate: `{{DATE}} {{FLAG}} "{{PAYEE}}" "{{NARRATION}}" {{TAGS}} {{NOTE_LINK}}
  {{FROM_ACCOUNT}}   {{CREDIT_AMOUNT}} {{CURRENCY}}
  {{TO_ACCOUNT}}     {{DEBIT_AMOUNT}} {{CURRENCY}}
`,
  },
  workflow: {
    defaultView: 'notes',
    embedBeancountMode: true,
    autoDetectOverdue: true,
    compactSidebar: false,
  },
};

let cachedSettings: AppSettings = DEFAULT_SETTINGS;
let isSettingsLoaded = false;
const settingsListeners = new Set<() => void>();

export function subscribeSettings(callback: () => void): () => void {
  settingsListeners.add(callback);
  return () => {
    settingsListeners.delete(callback);
  };
}

export function getSettingsSnapshot(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  if (!isSettingsLoaded) {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        cachedSettings = {
          org: { ...DEFAULT_SETTINGS.org, ...(parsed.org || {}) },
          bean: { ...DEFAULT_SETTINGS.bean, ...(parsed.bean || {}) },
          workflow: { ...DEFAULT_SETTINGS.workflow, ...(parsed.workflow || {}) },
        };
      }
    } catch (e) {
      console.warn('Error loading settings from localStorage:', e);
    }
    isSettingsLoaded = true;
  }
  return cachedSettings;
}

export function getSettingsServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

export function saveSettings(newSettings: AppSettings): void {
  cachedSettings = newSettings;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  }
  settingsListeners.forEach((l) => l());
}

// Template generators based on full methodologies
export function renderNewNoteContent(settings: AppSettings, noteName: string): string {
  const baseTitle = noteName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const dateStr = new Date().toISOString().slice(0, 10);
  const idStr = `note-${Date.now()}`;

  return settings.org.noteTemplate
    .replace(/{{TITLE}}/g, baseTitle)
    .replace(/{{AUTHOR}}/g, settings.org.authorName)
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{STARTUP}}/g, settings.org.defaultStartupFold)
    .replace(/{{TAGS}}/g, settings.org.defaultTags.join(' '))
    .replace(/{{ID}}/g, idStr);
}

export function renderNewLedgerContent(settings: AppSettings, ledgerName: string): string {
  const baseTitle = ledgerName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const dateStr = new Date().toISOString().slice(0, 10);

  return settings.bean.ledgerTemplate
    .replace(/{{TITLE}}/g, baseTitle)
    .replace(/{{CURRENCY}}/g, settings.bean.operatingCurrency)
    .replace(/{{BOOKING_METHOD}}/g, settings.bean.bookingMethod)
    .replace(/{{DATE}}/g, dateStr);
}

export function renderNewTaskContent(
  settings: AppSettings,
  title: string,
  opts?: {
    status?: string;
    priority?: string;
    date?: string;
    tags?: string[];
    body?: string;
  }
): string {
  const status = opts?.status || settings.org.defaultTodoSequence[0] || 'TODO';
  const prio = opts?.priority && opts.priority !== 'none' ? `[#${opts.priority}] ` : '';
  const date = opts?.date || new Date().toISOString().slice(0, 10);
  const scheduled = date ? `SCHEDULED: <${date}>` : '';
  const tagsStr = opts?.tags && opts.tags.length > 0 ? `:${opts.tags.join(':')}:` : '';
  const body = opts?.body ? opts.body : '- [ ] Detail item';

  return settings.org.taskTemplate
    .replace(/{{STATUS}}/g, status)
    .replace(/{{PRIORITY}}/g, prio)
    .replace(/{{TITLE}}/g, title)
    .replace(/{{TAGS}}/g, tagsStr)
    .replace(/{{SCHEDULED}}/g, scheduled)
    .replace(/{{BODY}}/g, body);
}

export function renderNewTxContent(
  settings: AppSettings,
  data: {
    date: string;
    flag?: '*' | '!';
    payee: string;
    narration: string;
    amount: number;
    currency?: string;
    fromAccount?: string;
    toAccount?: string;
    noteLink?: string;
    tags?: string[];
  }
): string {
  const flag = data.flag || settings.bean.defaultFlag;
  const currency = data.currency || settings.bean.operatingCurrency;
  const fromAcc = data.fromAccount || settings.bean.defaultLiabilityAccount;
  const toAcc = data.toAccount || settings.bean.defaultExpenseAccount;
  const tagsStr = data.tags && data.tags.length > 0 ? data.tags.map((t) => `#${t}`).join(' ') : '';
  const noteLinkStr = data.noteLink
    ? `${settings.bean.linkSyntax}: [[${data.noteLink}]]`
    : '';

  const creditAmt = (-Math.abs(data.amount)).toFixed(2);
  const debitAmt = Math.abs(data.amount).toFixed(2);

  return settings.bean.txTemplate
    .replace(/{{DATE}}/g, data.date)
    .replace(/{{FLAG}}/g, flag)
    .replace(/{{PAYEE}}/g, data.payee)
    .replace(/{{NARRATION}}/g, data.narration)
    .replace(/{{TAGS}}/g, tagsStr)
    .replace(/{{NOTE_LINK}}/g, noteLinkStr)
    .replace(/{{FROM_ACCOUNT}}/g, fromAcc.padEnd(30))
    .replace(/{{TO_ACCOUNT}}/g, toAcc.padEnd(30))
    .replace(/{{CREDIT_AMOUNT}}/g, creditAmt.padStart(10))
    .replace(/{{DEBIT_AMOUNT}}/g, debitAmt.padStart(10))
    .replace(/{{CURRENCY}}/g, currency);
}
