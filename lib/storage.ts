import { WorkspaceFile } from '@/types';
import JSZip from 'jszip';

const STORAGE_KEY = 'orgbean_workspace_files_v1';

export const INITIAL_FILES: WorkspaceFile[] = [
  {
    id: 'file-org-dashboard',
    name: 'dashboard.org',
    path: '/notes/dashboard.org',
    type: 'org',
    updatedAt: 1760900000000,
    content: `* Master Dashboard & Operating System :FOCUS:
:PROPERTIES:
:ID: org-dash-01
:CATEGORY: Dashboard
:END:

Welcome to *OrgBean* — combining the structured knowledge & task management of *OrgNote* with the double-entry plain-text accounting power of *BeanHub*!

** Today's Priorities & Active Sprints
*** TODO [#A] Review Q4 SaaS Financial Statements :finance:tax:
SCHEDULED: <2026-10-20 Tue 10:00>
DEADLINE: <2026-10-22 Thu 18:00>
- [X] Reconcile Chase checking account against balance assertion
- [ ] Export balance sheet & income statement for accountant
- [ ] Verify linked receipts for hardware purchases in [[projects.org]]

*** DOING [#B] Implement Google Drive cross-platform sync :dev:sync:
SCHEDULED: <2026-10-19 Mon>
We need seamless synchronization of both .org and .bean files between mobile and desktop clients.
- [X] Set up Google Drive API file scopes
- [X] Build offline-first local cache & backup zip exporter
- [ ] Test mobile bottom navigation and touch gestures

*** WAIT Client payment for September Enterprise Consulting :client:revenue:
SCHEDULED: <2026-10-18 Sun>
Expected incoming wire: $4,500.00 USD to Assets:Bank:Checking.
Reference invoice note: [[client-billing.org]]

** Project Alpha Budget & Ledger Embed
Here is an embedded Beancount snippet for this project:

#+BEGIN_SRC beancount
2026-10-19 * "DigitalOcean" "Cloud compute cluster for AI modeling" #server
  Liabilities:CreditCard:Chase         -140.00 USD
  Expenses:Office:Hosting               140.00 USD

2026-10-18 * "Acme Corp" "Software consulting milestone 1" #client
  Assets:Bank:Checking                4500.00 USD
  Income:Consulting                  -4500.00 USD
#+END_SRC

** Daily Habits & Health Tracking
*** Daily Meditation (15 min) :habit:health:
:PROPERTIES:
:STYLE: habit
:END:
Consistency brings clarity.

*** Daily Ledger Reconciliation & Expense Logging :habit:finance:
:PROPERTIES:
:STYLE: habit
:END:
Log every transaction at day's end to ensure balanced books.
`,
  },
  {
    id: 'file-org-projects',
    name: 'projects.org',
    path: '/notes/projects.org',
    type: 'org',
    updatedAt: 1760890000000,
    content: `* Active Projects & Milestones :PROJECTS:

** Project Gemini Integration :AI:dev:
:PROPERTIES:
:BUDGET: 1500 USD
:STATUS: Active
:END:
Integrating generative AI assistance and smart transaction categorization into OrgBean.

*** TODO Benchmark latency on Gemini 3.5 Flash API [#A]
SCHEDULED: <2026-10-21 Wed 14:00>
Ensure real-time suggestions stay sub-300ms for mobile clients.

*** DOING Refactor command palette fuzzy search
- [X] IndexedDB keyword cache
- [ ] Hotkey support for mobile hardware keyboards (Cmd+K)

** Office & Hardware Upgrades :hardware:office:
Purchases tracked in beancount ledger [[main.bean]].

*** DONE Buy 4K high-DPI monitor [#B]
CLOSED: [2026-10-15 Wed 16:30]
Receipt logged in main ledger under:
Expenses:Office:Hardware $599.00 USD
`,
  },
  {
    id: 'file-org-habits',
    name: 'habits.org',
    path: '/notes/habits.org',
    type: 'org',
    updatedAt: 1760880000000,
    content: `* Personal Mastery & Habits :HABITS:

** Morning Deep Work Routine (2 hours) :habit:focus:
:PROPERTIES:
:STYLE: habit
:REPEAT: .+1d
:END:
- [X] No notifications before 10 AM
- [X] Review top 3 Org tasks

** Physical Training & Gym :habit:health:
:PROPERTIES:
:STYLE: habit
:REPEAT: .+1d
:END:
Maintain cardiovascular endurance and strength.

** Plain-Text Ledger Review :habit:finance:
:PROPERTIES:
:STYLE: habit
:REPEAT: .+1d
:END:
Verify all credit card transactions match bank statements.
`,
  },
  {
    id: 'file-bean-main',
    name: 'main.bean',
    path: '/accounting/main.bean',
    type: 'bean',
    updatedAt: 1760870000000,
    content: `; ==============================================================
; OrgBean Primary Plain-Text Ledger
; Standard Beancount Double-Entry Accounting
; ==============================================================

option "title" "Personal & Business Operating Ledger"
option "operating_currency" "USD"

; Account declarations
2020-01-01 open Assets:Bank:Checking USD
2020-01-01 open Assets:Bank:Savings USD
2020-01-01 open Assets:Investments:IndexFunds USD
2020-01-01 open Liabilities:CreditCard:Chase USD
2020-01-01 open Liabilities:CreditCard:Amex USD
2020-01-01 open Equity:Opening-Balances USD
2020-01-01 open Income:Consulting USD
2020-01-01 open Income:SaaS:Subscription USD
2020-01-01 open Expenses:Office:Hardware USD
2020-01-01 open Expenses:Office:Software USD
2020-01-01 open Expenses:Office:Hosting USD
2020-01-01 open Expenses:Food:Groceries USD
2020-01-01 open Expenses:Food:Dining USD
2020-01-01 open Expenses:Housing:Rent USD
2020-01-01 open Expenses:Utilities:Electric USD
2020-01-01 open Expenses:Travel:Flights USD

; Opening balances
2026-01-01 * "Initial Capital" "Opening balances for 2026"
  Assets:Bank:Checking               12500.00 USD
  Assets:Bank:Savings                25000.00 USD
  Assets:Investments:IndexFunds      48000.00 USD
  Liabilities:CreditCard:Chase        -850.00 USD
  Equity:Opening-Balances           -84650.00 USD

; Balance assertions
2026-10-18 balance Assets:Bank:Checking 16210.00 USD
2026-10-18 balance Liabilities:CreditCard:Chase -1439.00 USD
`,
  },
  {
    id: 'file-bean-expenses',
    name: '2026-transactions.bean',
    path: '/accounting/2026-transactions.bean',
    type: 'bean',
    updatedAt: 1760860000000,
    content: `; 2026 Operating Transactions
; Linked with OrgNote knowledge base notes

2026-10-18 * "Apple Store" "New iPad for mobile OrgNote testing" #hardware ^hardware-upgrade note: [[projects.org]]
  Liabilities:CreditCard:Chase        -599.00 USD
  Expenses:Office:Hardware             599.00 USD

2026-10-17 * "Stripe Billing" "Monthly SaaS Subscriptions Revenue" #saas #revenue
  Assets:Bank:Checking                1850.00 USD
  Income:SaaS:Subscription          -1850.00 USD

2026-10-16 * "Whole Foods Market" "Organic groceries for the week" #groceries
  Liabilities:CreditCard:Chase         -94.50 USD
  Expenses:Food:Groceries               94.50 USD

2026-10-15 * "Amazon Web Services" "Production cloud database & backups" #hosting
  Liabilities:CreditCard:Chase         -85.00 USD
  Expenses:Office:Hosting               85.00 USD

2026-10-14 * "Local Cafe" "Client sprint planning coffee" #dining note: [[dashboard.org]]
  Liabilities:CreditCard:Chase         -14.50 USD
  Expenses:Food:Dining                  14.50 USD

2026-10-12 * "GitHub Inc" "GitHub Team & Copilot Seats" #software
  Liabilities:CreditCard:Chase         -42.00 USD
  Expenses:Office:Software              42.00 USD

2026-10-10 * "Landlord Properties" "Monthly office space lease" #rent
  Assets:Bank:Checking               -1500.00 USD
  Expenses:Housing:Rent               1500.00 USD

2026-10-05 * "Vanguard" "Monthly index fund automated investment" #investments
  Assets:Bank:Checking                -500.00 USD
  Assets:Investments:IndexFunds        500.00 USD

2026-10-02 * "Power & Light Co" "Electricity bill for server and office" #utilities
  Assets:Bank:Checking                -120.00 USD
  Expenses:Utilities:Electric          120.00 USD
`,
  },
];

export function loadStoredFiles(): WorkspaceFile[] {
  if (typeof window === 'undefined') return INITIAL_FILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FILES));
      return INITIAL_FILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_FILES;
  } catch (err) {
    console.warn('Error loading files from localStorage:', err);
    return INITIAL_FILES;
  }
}

let memoryFiles: WorkspaceFile[] = INITIAL_FILES;
let isLoadedFromLocalStorage = false;
const storeListeners = new Set<() => void>();

export function subscribeWorkspace(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

export function getWorkspaceSnapshot(): WorkspaceFile[] {
  if (typeof window === 'undefined') return INITIAL_FILES;
  if (!isLoadedFromLocalStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryFiles = parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    isLoadedFromLocalStorage = true;
  }
  return memoryFiles;
}

export function getWorkspaceServerSnapshot(): WorkspaceFile[] {
  return INITIAL_FILES;
}

export function updateWorkspaceStore(newFiles: WorkspaceFile[]): void {
  memoryFiles = newFiles;
  saveStoredFiles(newFiles);
  storeListeners.forEach((l) => l());
}

export function saveStoredFiles(files: WorkspaceFile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('Error saving files to localStorage:', err);
  }
}

export function downloadFile(file: WorkspaceFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportWorkspaceZip(files: WorkspaceFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    // Preserve folder paths (remove leading /)
    const relativePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    zip.file(relativePath, file.content);
  }

  // Also include a README.md explaining the OrgBean structure
  const readme = `# OrgBean Workspace Archive
Exported on: ${new Date().toISOString()}

This archive contains your unified Org-Mode notes (.org) and Beancount plain-text double-entry accounting ledgers (.bean).

## Structure
- \`/notes/*.org\`: Org-mode notes, TODOs, agendas, habits, and embedded beancount blocks.
- \`/accounting/*.bean\`: Plain-text double-entry ledger transactions, accounts hierarchy, and balance assertions.

Compatible with OrgNote, Emacs Org Mode, BeanHub, Fava, and beancount CLI!
`;
  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
