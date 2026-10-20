import { WorkspaceFile, BeancountAccount } from '@/types';
import { parseBeancountContent } from '@/lib/beancount-parser';

export interface OpenAccountParams {
  type: 'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses';
  subAccount: string; // e.g. "Bank:Checking:HighYield"
  currency: string;
  openDate: string; // YYYY-MM-DD
  openingBalance?: number;
  targetFileId: string;
}

export function openAccountInFile(
  fileContent: string,
  params: OpenAccountParams
): string {
  const fullAccountName = `${params.type}:${params.subAccount.trim().replace(/^:+|:+$/g, '')}`;
  const openDirective = `${params.openDate} open ${fullAccountName} ${params.currency}`;

  let addition = `\n${openDirective}\n`;

  // If opening balance requested, add initial capital transaction
  if (params.openingBalance !== undefined && params.openingBalance !== 0) {
    const isAssetOrExpense = params.type === 'Assets' || params.type === 'Expenses';
    const debitAccount = isAssetOrExpense ? fullAccountName : 'Equity:Opening-Balances';
    const creditAccount = isAssetOrExpense ? 'Equity:Opening-Balances' : fullAccountName;
    const absAmt = Math.abs(params.openingBalance).toFixed(2);

    addition += `\n${params.openDate} * "Opening Balance" "Initial balance for ${fullAccountName}"\n  ${debitAccount.padEnd(32)} ${absAmt.padStart(10)} ${params.currency}\n  ${creditAccount.padEnd(32)} -${absAmt.padStart(9)} ${params.currency}\n`;
  }

  // Insert after existing open directives or at top
  const lines = fileContent.split('\n');
  let lastOpenIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(' open ')) {
      lastOpenIndex = i;
    }
  }

  if (lastOpenIndex !== -1) {
    lines.splice(lastOpenIndex + 1, 0, addition.trim());
    return lines.join('\n');
  }

  return fileContent.trimEnd() + '\n' + addition;
}

export function closeAccountInFile(
  fileContent: string,
  accountName: string,
  closeDate: string
): string {
  const closeDirective = `${closeDate} close ${accountName}`;
  return fileContent.trimEnd() + `\n\n; Account Closed\n${closeDirective}\n`;
}

export function assertAccountBalanceInFile(
  fileContent: string,
  accountName: string,
  amount: number,
  currency: string,
  date: string
): string {
  const balanceDirective = `${date} balance ${accountName} ${amount.toFixed(2)} ${currency}`;
  return fileContent.trimEnd() + `\n\n; Balance Assertion\n${balanceDirective}\n`;
}

export function renameAccountAcrossFiles(
  files: WorkspaceFile[],
  oldAccount: string,
  newAccount: string
): WorkspaceFile[] {
  // Regex to match account with word boundaries or colons
  const escapedOld = oldAccount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const accountRegex = new RegExp(`\\b${escapedOld}\\b`, 'g');

  return files.map((file) => {
    if (file.type === 'bean' || file.content.includes(oldAccount)) {
      const updated = file.content.replace(accountRegex, newAccount);
      if (updated !== file.content) {
        return {
          ...file,
          content: updated,
          updatedAt: Date.now(),
        };
      }
    }
    return file;
  });
}
