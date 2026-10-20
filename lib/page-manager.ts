import { WorkspaceFile, FileType } from '@/types';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  type: FileType;
  defaultExtension: string;
  generateContent: (title: string, author?: string) => string;
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'daily-journal',
    name: 'Daily Journal & Fleeting Note',
    description: 'Capture daily thoughts, morning mindset, quick ideas, and top 3 priorities.',
    type: 'org',
    defaultExtension: '.org',
    generateContent: (title, author = 'User') => {
      const today = new Date().toISOString().slice(0, 10);
      return `#+TITLE: ${title}
#+AUTHOR: ${author}
#+DATE: <${today}>
#+STARTUP: content
#+TAGS: :journal:daily:mindset:

* Daily Review & Brainstorm :JOURNAL:
:PROPERTIES:
:CREATED: <${today}>
:CATEGORY: DailyLog
:END:

** Morning Intentions & Top 3 Focus
*** TODO [#A] Primary Milestone for Today
SCHEDULED: <${today}>
- [ ] Action item 1
- [ ] Action item 2

*** TODO [#B] Secondary Task
SCHEDULED: <${today}>

*** TODO [#C] Personal health or learning
- [ ] Reading or workout

** Notes & Fleeting Thoughts
- What went well today?
- Key lessons and takeaways:

** Embedded Expenses for Today
#+BEGIN_SRC beancount
; Quick expenses logged today
#+END_SRC
`;
    },
  },
  {
    id: 'project-spec',
    name: 'Project Milestones & Budget Spec',
    description: 'Structured roadmap with task checklists, milestones, and embedded beancount budget.',
    type: 'org',
    defaultExtension: '.org',
    generateContent: (title, author = 'User') => {
      const today = new Date().toISOString().slice(0, 10);
      return `#+TITLE: Project: ${title}
#+AUTHOR: ${author}
#+DATE: <${today}>
#+TAGS: :project:roadmap:finance:

* Project Overview: ${title}
:PROPERTIES:
:STATUS: In-Progress
:BUDGET: 3000 USD
:DEADLINE: <${today}>
:END:

** Objectives & Scope
1. Define deliverables
2. Establish architecture & financial limits

** Milestones & Sprints
*** TODO [#A] Phase 1 - Prototype and Architecture
SCHEDULED: <${today}>
- [ ] Setup core modules
- [ ] Initial test coverage

*** TODO [#B] Phase 2 - Production Rollout & Sync

** Financial Ledger & Budget Tracking
#+BEGIN_SRC beancount
; Track expenses allocated directly to this project
#+END_SRC
`;
    },
  },
  {
    id: 'financial-ledger',
    name: 'Dedicated Accounting Ledger',
    description: 'Clean double-entry ledger file ready for transactions and balance assertions.',
    type: 'bean',
    defaultExtension: '.bean',
    generateContent: (title) => {
      const today = new Date().toISOString().slice(0, 10);
      return `; ==============================================================
; Ledger: ${title}
; Plain-Text Accounting Module
; ==============================================================

option "title" "${title}"
option "operating_currency" "USD"

; Declarations
2026-01-01 open Assets:Bank:Checking USD
2026-01-01 open Liabilities:CreditCard:Chase USD
2026-01-01 open Expenses:Office:Software USD

; Transactions
${today} * "Initial Setup" "Account opened"
  Assets:Bank:Checking                1000.00 USD
  Equity:Opening-Balances            -1000.00 USD
`;
    },
  },
  {
    id: 'meeting-minutes',
    name: 'Client Meeting & Consulting Notes',
    description: 'Document discussion points, decisions made, action items, and billable hours.',
    type: 'org',
    defaultExtension: '.org',
    generateContent: (title, author = 'User') => {
      const today = new Date().toISOString().slice(0, 10);
      return `#+TITLE: Meeting: ${title}
#+AUTHOR: ${author}
#+DATE: <${today}>
#+TAGS: :meeting:consulting:client:

* Meeting Summary :MEETING:
:PROPERTIES:
:ATTENDEES: Client Team, ${author}
:DATE: <${today}>
:END:

** Discussion Points
- Key agenda topic 1
- Key agenda topic 2

** Decisions Made
- Confirmed project scope

** Action Items
*** TODO Follow up with signed contract [#A]
SCHEDULED: <${today}>
*** TODO Log billable consulting hours in [[main.bean]] [#B]
`;
    },
  },
];

export function renamePageAcrossVault(
  files: WorkspaceFile[],
  fileId: string,
  newFileName: string
): WorkspaceFile[] {
  const targetFile = files.find((f) => f.id === fileId);
  if (!targetFile) return files;

  const oldFileName = targetFile.name;
  const oldBaseName = oldFileName.replace(/\.[^/.]+$/, '');
  const newBaseName = newFileName.replace(/\.[^/.]+$/, '');

  return files.map((f) => {
    if (f.id === fileId) {
      // Update target file
      const updatedPath = f.path.replace(oldFileName, newFileName);
      return {
        ...f,
        name: newFileName,
        path: updatedPath,
        updatedAt: Date.now(),
      };
    }

    // Refactor references in other files
    let content = f.content;
    const oldLink1 = `[[${oldFileName}]]`;
    const newLink1 = `[[${newFileName}]]`;
    const oldLink2 = `[[${oldBaseName}]]`;
    const newLink2 = `[[${newBaseName}]]`;

    content = content.split(oldLink1).join(newLink1);
    content = content.split(oldLink2).join(newLink2);

    if (content !== f.content) {
      return {
        ...f,
        content,
        updatedAt: Date.now(),
      };
    }

    return f;
  });
}

export function duplicatePageInVault(
  files: WorkspaceFile[],
  fileId: string
): WorkspaceFile[] {
  const file = files.find((f) => f.id === fileId);
  if (!file) return files;

  const ext = file.name.endsWith('.org') ? '.org' : '.bean';
  const base = file.name.replace(/\.[^/.]+$/, '');
  const newName = `${base}-copy-${Date.now().toString().slice(-4)}${ext}`;

  const duplicated: WorkspaceFile = {
    id: `file-copy-${Date.now()}`,
    name: newName,
    path: file.path.replace(file.name, newName),
    type: file.type,
    content: file.content,
    updatedAt: Date.now(),
  };

  return [...files, duplicated];
}
