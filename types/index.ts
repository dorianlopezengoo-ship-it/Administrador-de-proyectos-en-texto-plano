export type FileType = 'org' | 'bean';

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  type: FileType;
  content: string;
  updatedAt: number;
  driveFileId?: string;
  syncedAt?: number;
}

export type OrgTaskStatus = 'TODO' | 'DOING' | 'WAIT' | 'DONE' | 'CANCELLED';

export interface OrgChecklistItem {
  text: string;
  completed: boolean;
  line: number;
}

export interface OrgHeadline {
  id: string;
  fileId: string;
  fileName: string;
  level: number;
  title: string;
  status?: OrgTaskStatus;
  priority?: 'A' | 'B' | 'C';
  tags: string[];
  scheduled?: string;
  deadline?: string;
  closed?: string;
  properties: Record<string, string>;
  checklists: OrgChecklistItem[];
  body: string;
  lineStart: number;
  lineEnd: number;
  isHabit?: boolean;
  habitStreak?: boolean[]; // last 14 days
}

export interface BeancountPosting {
  account: string;
  amount?: number;
  currency?: string;
  cost?: { amount: number; currency: string };
  price?: { amount: number; currency: string };
  comment?: string;
}

export interface BeancountTransaction {
  id: string;
  fileId: string;
  fileName: string;
  lineNumber: number;
  date: string; // YYYY-MM-DD
  flag: '*' | '!'; // * = cleared, ! = pending
  payee: string;
  narration: string;
  tags: string[];
  links: string[]; // e.g. ^invoice-101, document: [[Note Title]]
  postings: BeancountPosting[];
  isBalanced: boolean;
  imbalanceAmount?: number;
  rawText: string;
  noteLink?: string; // Linked Org Note if any
}

export interface BeancountBalanceAssertion {
  date: string;
  account: string;
  amount: number;
  currency: string;
  isVerified?: boolean;
}

export interface BeancountAccount {
  name: string;
  type: 'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses';
  currency: string;
  balance: number;
  children: Record<string, BeancountAccount>;
  transactionCount: number;
}

export interface AgendaItem {
  id: string;
  type: 'org_task' | 'bean_tx' | 'bean_balance' | 'habit';
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  priority?: 'A' | 'B' | 'C';
  status?: OrgTaskStatus | 'CLEARED' | 'PENDING';
  tags: string[];
  sourceFile: string;
  sourceFileId: string;
  amount?: number;
  currency?: string;
  isOverdue?: boolean;
  isDone?: boolean;
}

export interface DriveSyncFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export interface SyncState {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  folderId: string | null;
  folderName: string;
  lastSyncTime: number | null;
  isSyncing: boolean;
  syncLog: Array<{
    timestamp: number;
    action: string;
    status: 'success' | 'warning' | 'error';
    details: string;
  }>;
}

export interface OrgSettings {
  authorName: string;
  defaultTodoSequence: OrgTaskStatus[];
  autoCloseTimestamp: boolean;
  defaultStartupFold: 'folded' | 'overview' | 'content' | 'showall';
  defaultPriority: 'A' | 'B' | 'C' | 'none';
  defaultTags: string[];
  habitRepeatDefault: string;
  noteTemplate: string;
  taskTemplate: string;
}

export interface BeancountSettings {
  operatingCurrency: string;
  defaultFlag: '*' | '!';
  defaultAssetAccount: string;
  defaultLiabilityAccount: string;
  defaultExpenseAccount: string;
  defaultIncomeAccount: string;
  bookingMethod: 'FIFO' | 'LIFO' | 'AVERAGE' | 'STRICT';
  ledgerTemplate: string;
  txTemplate: string;
  autoBalanceResidual: boolean;
  linkSyntax: 'note' | 'document';
}

export interface WorkflowSettings {
  defaultView: ActiveAppView;
  embedBeancountMode: boolean;
  autoDetectOverdue: boolean;
  compactSidebar: boolean;
}

export interface AppSettings {
  org: OrgSettings;
  bean: BeancountSettings;
  workflow: WorkflowSettings;
}

export type ActiveAppView = 
  | 'notes' 
  | 'ledger' 
  | 'balance-sheet' 
  | 'income-statement' 
  | 'trial-balance' 
  | 'reports' 
  | 'agenda' 
  | 'kanban'
  | 'calendar'
  | 'habits' 
  | 'sync' 
  | 'settings';

