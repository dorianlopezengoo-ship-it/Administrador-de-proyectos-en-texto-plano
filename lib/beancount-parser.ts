import {
  BeancountTransaction,
  BeancountPosting,
  BeancountBalanceAssertion,
  BeancountAccount,
} from '@/types';

export interface ParsedBeancountLedger {
  transactions: BeancountTransaction[];
  balanceAssertions: BeancountBalanceAssertion[];
  accounts: Record<string, BeancountAccount>;
  openAccounts: Set<string>;
  commodities: Set<string>;
  currencies: string[];
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyStats: Array<{
    month: string; // YYYY-MM
    income: number;
    expenses: number;
    net: number;
  }>;
  categoryExpenses: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export function parseBeancountContent(
  content: string,
  fileId: string = 'ledger',
  fileName: string = 'main.bean'
): ParsedBeancountLedger {
  const lines = content.split('\n');
  const transactions: BeancountTransaction[] = [];
  const balanceAssertions: BeancountBalanceAssertion[] = [];
  const openAccounts = new Set<string>();
  const commodities = new Set<string>(['USD', 'EUR', 'GBP']);
  
  // Flat account balances
  const balances: Record<string, number> = {};
  const currencies: Set<string> = new Set(['USD']);

  let currentTx: Partial<BeancountTransaction> | null = null;
  let currentPostings: BeancountPosting[] = [];
  let txRawLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Ignore comments and empty lines outside transactions
    if (!trimmed || trimmed.startsWith(';')) {
      if (currentTx && !trimmed) {
        // End of transaction block
        finalizeTx();
      }
      continue;
    }

    // Directives
    // Open directive: 2026-01-01 open Assets:Bank:Checking USD
    const openMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+open\s+([A-Za-z0-9:]+)(?:\s+([A-Z]{3,5}))?/);
    if (openMatch) {
      finalizeTx();
      openAccounts.add(openMatch[2]);
      if (openMatch[3]) commodities.add(openMatch[3]);
      continue;
    }

    // Balance directive: 2026-10-18 balance Assets:Bank:Checking 4500.00 USD
    const balanceMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+balance\s+([A-Za-z0-9:]+)\s+(-?\d+(?:\.\d+)?)\s+([A-Z]{3,5})/);
    if (balanceMatch) {
      finalizeTx();
      balanceAssertions.push({
        date: balanceMatch[1],
        account: balanceMatch[2],
        amount: parseFloat(balanceMatch[3]),
        currency: balanceMatch[4],
      });
      continue;
    }

    // Price directive: 2026-10-18 price BTC 65000.00 USD
    const priceMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+price\s+([A-Z0-9]+)\s+(-?\d+(?:\.\d+)?)\s+([A-Z]{3,5})/);
    if (priceMatch) {
      finalizeTx();
      commodities.add(priceMatch[2]);
      commodities.add(priceMatch[4]);
      continue;
    }

    // Transaction header: 2026-10-18 * "Payee" "Narration" or 2026-10-18 ! "Narration"
    const txHeaderMatch = line.match(/^(\d{4}-\d{2}-\d{2})\s+([*!])\s+(.*)$/);
    if (txHeaderMatch) {
      finalizeTx();

      const date = txHeaderMatch[1];
      const flag = txHeaderMatch[2] as '*' | '!';
      let rest = txHeaderMatch[3].trim();

      let payee = '';
      let narration = '';
      const tags: string[] = [];
      const links: string[] = [];

      // Extract tags #tag and links ^link
      rest = rest.replace(/#([a-zA-Z0-9_-]+)/g, (_, t) => {
        tags.push(t);
        return '';
      });
      rest = rest.replace(/\^([a-zA-Z0-9_-]+)/g, (_, l) => {
        links.push(l);
        return '';
      });

      // Extract quoted strings
      const quoteMatches = rest.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
      if (quoteMatches && quoteMatches.length >= 2) {
        payee = quoteMatches[0].replace(/^"|"$/g, '');
        narration = quoteMatches[1].replace(/^"|"$/g, '');
      } else if (quoteMatches && quoteMatches.length === 1) {
        narration = quoteMatches[0].replace(/^"|"$/g, '');
      } else {
        narration = rest.trim();
      }

      // Check note link: note: [[Note Name]] or document: [[Note Name]]
      let noteLink: string | undefined;
      const noteMatch = line.match(/(?:document|note):\s*\[\[([^\]]+)\]\]/i);
      if (noteMatch) {
        noteLink = noteMatch[1];
      }

      currentTx = {
        id: `${fileId}-tx-${i}`,
        fileId,
        fileName,
        lineNumber: i + 1,
        date,
        flag,
        payee,
        narration,
        tags,
        links,
        noteLink,
      };
      currentPostings = [];
      txRawLines = [line];
      continue;
    }

    // Inside transaction: indented posting line
    if (currentTx && /^\s+/.test(line)) {
      txRawLines.push(line);

      // Check for inline note metadata comment or link
      const inlineNoteMatch = trimmed.match(/(?:document|note):\s*\[\[([^\]]+)\]\]/i);
      if (inlineNoteMatch && !currentTx.noteLink) {
        currentTx.noteLink = inlineNoteMatch[1];
      }

      // Posting line: Account [Amount Currency]
      // e.g. Assets:Bank:Checking  -45.50 USD
      const postingMatch = trimmed.match(/^([A-Za-z0-9:]+)(?:\s+(-?\d+(?:\.\d+)?)\s+([A-Z]{3,5}))?/);
      if (postingMatch) {
        const account = postingMatch[1];
        const amountStr = postingMatch[2];
        const currency = postingMatch[3] || 'USD';

        let amount: number | undefined;
        if (amountStr !== undefined) {
          amount = parseFloat(amountStr);
        }

        currentPostings.push({
          account,
          amount,
          currency,
        });

        if (currency) currencies.add(currency);
      }
      continue;
    }

    // Any other unindented line terminates previous transaction
    finalizeTx();
  }

  finalizeTx();

  function finalizeTx() {
    if (!currentTx) return;

    // Check balances & balance the transaction if one posting omitted amount
    let sum = 0;
    let missingIndex = -1;

    for (let idx = 0; idx < currentPostings.length; idx++) {
      const p = currentPostings[idx];
      if (p.amount !== undefined) {
        sum += p.amount;
      } else {
        if (missingIndex === -1) {
          missingIndex = idx;
        }
      }
    }

    if (missingIndex !== -1) {
      // Auto-balance the omitted posting
      currentPostings[missingIndex].amount = -Math.round(sum * 100) / 100;
      sum = 0;
    }

    const roundedSum = Math.round(sum * 100) / 100;
    const isBalanced = Math.abs(roundedSum) < 0.001;

    // Accumulate to account balances
    for (const p of currentPostings) {
      if (p.amount !== undefined) {
        balances[p.account] = (balances[p.account] || 0) + p.amount;
      }
    }

    transactions.push({
      id: currentTx.id || `tx-${transactions.length}`,
      fileId: currentTx.fileId || fileId,
      fileName: currentTx.fileName || fileName,
      lineNumber: currentTx.lineNumber || 0,
      date: currentTx.date || '2026-01-01',
      flag: currentTx.flag || '*',
      payee: currentTx.payee || '',
      narration: currentTx.narration || '',
      tags: currentTx.tags || [],
      links: currentTx.links || [],
      postings: currentPostings,
      isBalanced,
      imbalanceAmount: isBalanced ? 0 : roundedSum,
      rawText: txRawLines.join('\n'),
      noteLink: currentTx.noteLink,
    });

    currentTx = null;
    currentPostings = [];
    txRawLines = [];
  }

  // Build hierarchical account tree
  const accounts: Record<string, BeancountAccount> = {};

  // Standard root accounts
  const rootTypes: Array<'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses'> = [
    'Assets',
    'Liabilities',
    'Equity',
    'Income',
    'Expenses',
  ];

  for (const root of rootTypes) {
    accounts[root] = {
      name: root,
      type: root,
      currency: 'USD',
      balance: 0,
      children: {},
      transactionCount: 0,
    };
  }

  // Populate all accounts
  const allAccountNames = Array.from(new Set([...Object.keys(balances), ...Array.from(openAccounts)]));

  for (const accName of allAccountNames) {
    const parts = accName.split(':');
    const rootType = parts[0] as 'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses';
    if (!accounts[rootType]) continue;

    let current = accounts[rootType];
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          type: rootType,
          currency: 'USD',
          balance: 0,
          children: {},
          transactionCount: 0,
        };
      }
      current = current.children[part];
    }
    current.balance = balances[accName] || 0;
  }

  // Helper to roll up child balances
  function rollUp(node: BeancountAccount): number {
    let sum = node.balance;
    for (const child of Object.values(node.children)) {
      sum += rollUp(child);
    }
    node.balance = sum;
    return sum;
  }

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const root of rootTypes) {
    const total = rollUp(accounts[root]);
    if (root === 'Assets') totalAssets = total;
    if (root === 'Liabilities') totalLiabilities = Math.abs(total);
    if (root === 'Equity') totalEquity = total;
    if (root === 'Income') totalIncome = Math.abs(total);
    if (root === 'Expenses') totalExpenses = total;
  }

  const netWorth = totalAssets - totalLiabilities;

  // Monthly stats calculation
  const monthMap: Record<string, { income: number; expenses: number }> = {};

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!monthMap[month]) {
      monthMap[month] = { income: 0, expenses: 0 };
    }

    for (const p of tx.postings) {
      if (p.amount !== undefined) {
        if (p.account.startsWith('Income')) {
          monthMap[month].income += Math.abs(p.amount);
        } else if (p.account.startsWith('Expenses')) {
          monthMap[month].expenses += p.amount;
        }
      }
    }
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const monthlyStats = sortedMonths.map((m) => ({
    month: m,
    income: Math.round(monthMap[m].income),
    expenses: Math.round(monthMap[m].expenses),
    net: Math.round(monthMap[m].income - monthMap[m].expenses),
  }));

  // Expense categories breakdown
  const categoryMap: Record<string, number> = {};
  for (const [acc, bal] of Object.entries(balances)) {
    if (acc.startsWith('Expenses:') && bal > 0) {
      const parts = acc.split(':');
      const cat = parts.length > 1 ? parts[1] : 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + bal;
    }
  }

  const catEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const catTotal = catEntries.reduce((s, [, v]) => s + v, 0);

  const categoryExpenses = catEntries.map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
    percentage: catTotal > 0 ? Math.round((amount / catTotal) * 100) : 0,
  }));

  return {
    transactions: transactions.sort((a, b) => b.date.localeCompare(a.date)),
    balanceAssertions,
    accounts,
    openAccounts,
    commodities,
    currencies: Array.from(currencies),
    netWorth: Math.round(netWorth * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    monthlyStats,
    categoryExpenses,
  };
}

export function formatTransactionBeancount(tx: {
  date: string;
  flag: string;
  payee: string;
  narration: string;
  tags?: string[];
  links?: string[];
  noteLink?: string;
  postings: Array<{ account: string; amount?: number; currency?: string }>;
}): string {
  const tagsStr = tx.tags && tx.tags.length > 0 ? ' ' + tx.tags.map((t) => `#${t}`).join(' ') : '';
  const linksStr = tx.links && tx.links.length > 0 ? ' ' + tx.links.map((l) => `^${l}`).join(' ') : '';
  const noteStr = tx.noteLink ? ` note: [[${tx.noteLink}]]` : '';

  let header = `${tx.date} ${tx.flag || '*'}`;
  if (tx.payee) {
    header += ` "${tx.payee}" "${tx.narration || ''}"${tagsStr}${linksStr}${noteStr}`;
  } else {
    header += ` "${tx.narration || ''}"${tagsStr}${linksStr}${noteStr}`;
  }

  const postingLines = tx.postings.map((p) => {
    if (p.amount !== undefined) {
      const formattedAmt = p.amount.toFixed(2);
      return `  ${p.account.padEnd(32)} ${formattedAmt.padStart(10)} ${p.currency || 'USD'}`;
    }
    return `  ${p.account}`;
  });

  return `${header}\n${postingLines.join('\n')}\n`;
}
