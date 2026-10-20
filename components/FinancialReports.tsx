'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  BookOpen,
  DollarSign,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { WorkspaceFile, BeancountAccount } from '@/types';
import { parseBeancountContent } from '@/lib/beancount-parser';

interface FinancialReportsProps {
  files: WorkspaceFile[];
  initialTab?: 'balance-sheet' | 'income-statement' | 'trial-balance' | 'charts';
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  files,
  initialTab = 'balance-sheet',
}) => {
  const [activeTab, setActiveTab] = useState<'balance-sheet' | 'income-statement' | 'trial-balance' | 'charts'>(
    initialTab
  );
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Merge and parse all bean files plus embedded beancount blocks from .org files
  const combinedContent = useMemo(() => {
    let raw = '';
    for (const f of files) {
      if (f.type === 'bean') {
        raw += `\n; File: ${f.name}\n` + f.content;
      } else if (f.type === 'org') {
        // Extract embedded beancount blocks
        const matches = f.content.matchAll(/#\+BEGIN_SRC\s+(?:beancount|bean)([\s\S]*?)#\+END_SRC/gi);
        for (const m of matches) {
          raw += `\n; Embedded from Org Note: ${f.name}\n` + m[1];
        }
      }
    }
    return raw;
  }, [files]);

  const parsed = useMemo(() => {
    return parseBeancountContent(combinedContent, 'all', 'workspace-combined');
  }, [combinedContent]);

  const toggleNode = (path: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Helper to render account tree rows
  const renderAccountNode = (
    node: BeancountAccount,
    fullPath: string,
    depth: number = 0
  ) => {
    const hasChildren = Object.keys(node.children).length > 0;
    const isCollapsed = collapsedNodes[fullPath] || false;

    return (
      <div key={fullPath} className="text-xs font-mono">
        <div
          className={`flex items-center justify-between py-1 px-2 rounded hover:bg-zinc-850/60 transition-colors ${
            depth === 0 ? 'font-semibold text-zinc-100 bg-zinc-900/40 mt-2' : 'text-zinc-300'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 20)}px` }}
        >
          <div className="flex items-center gap-1.5 truncate mr-2">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(fullPath)}
                className="p-0.5 text-zinc-400 hover:text-zinc-200"
              >
                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-4.5 inline-block" />
            )}
            <span className="truncate">{node.name}</span>
          </div>

          <span
            className={`tabular-nums font-semibold shrink-0 ${
              node.balance < 0 ? 'text-rose-400' : node.balance > 0 ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            {node.balance < 0 ? '-' : ''}
            ${Math.abs(node.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {hasChildren && !isCollapsed && (
          <div>
            {Object.entries(node.children).map(([childKey, childNode]) =>
              renderAccountNode(childNode, `${fullPath}:${childKey}`, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Trial Balance flat accounts computation
  const trialBalanceAccounts = useMemo(() => {
    const list: Array<{ account: string; debit: number; credit: number; balance: number }> = [];

    function traverse(node: BeancountAccount, path: string) {
      if (Object.keys(node.children).length === 0) {
        if (node.balance !== 0) {
          const debit = node.balance > 0 ? node.balance : 0;
          const credit = node.balance < 0 ? Math.abs(node.balance) : 0;
          list.push({ account: path, debit, credit, balance: node.balance });
        }
      } else {
        for (const [k, v] of Object.entries(node.children)) {
          traverse(v, `${path}:${k}`);
        }
      }
    }

    for (const [root, acc] of Object.entries(parsed.accounts)) {
      traverse(acc, root);
    }

    return list.sort((a, b) => a.account.localeCompare(b.account));
  }, [parsed.accounts]);

  const totalDebits = trialBalanceAccounts.reduce((s, a) => s + a.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((s, a) => s + a.credit, 0);
  const trialDiff = Math.abs(totalDebits - totalCredits);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Statement Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('balance-sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'balance-sheet'
                ? 'bg-zinc-800 text-emerald-300 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Balance Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('income-statement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'income-statement'
                ? 'bg-zinc-800 text-emerald-300 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Income Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('trial-balance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'trial-balance'
                ? 'bg-zinc-800 text-emerald-300 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Trial Balance</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'charts'
                ? 'bg-zinc-800 text-emerald-300 font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Visual Charts</span>
          </button>
        </div>

        {/* Currency & Ledger Badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Operating Currency: <strong className="text-zinc-200">USD</strong></span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Plain-Text Ledger Ready
          </span>
        </div>
      </div>

      {/* Main Tab View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* TAB 1: Balance Sheet */}
        {activeTab === 'balance-sheet' && (
          <div className="space-y-6">
            {/* Net Worth Summary KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-800/40">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Total Assets
                </span>
                <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                  ${parsed.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  Checking, Savings & Investments
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-800/40">
                <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">
                  Total Liabilities
                </span>
                <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                  ${parsed.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  Credit Cards & Short-Term Debt
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-800/40">
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
                  Net Worth (Assets - Liabilities)
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  ${parsed.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  Equity & Retained Capital
                </span>
              </div>
            </div>

            {/* Tree View of Balance Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assets Panel */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Assets
                  </h3>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    ${parsed.totalAssets.toFixed(2)}
                  </span>
                </div>
                {parsed.accounts.Assets ? (
                  renderAccountNode(parsed.accounts.Assets, 'Assets')
                ) : (
                  <p className="text-xs text-zinc-400">No assets open.</p>
                )}
              </div>

              {/* Liabilities & Equity Panel */}
              <div className="space-y-4">
                {/* Liabilities */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      Liabilities
                    </h3>
                    <span className="font-mono font-bold text-xs text-rose-400">
                      ${parsed.totalLiabilities.toFixed(2)}
                    </span>
                  </div>
                  {parsed.accounts.Liabilities ? (
                    renderAccountNode(parsed.accounts.Liabilities, 'Liabilities')
                  ) : (
                    <p className="text-xs text-zinc-400">No liabilities open.</p>
                  )}
                </div>

                {/* Equity */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      Equity
                    </h3>
                    <span className="font-mono font-bold text-xs text-indigo-400">
                      ${parsed.totalEquity.toFixed(2)}
                    </span>
                  </div>
                  {parsed.accounts.Equity ? (
                    renderAccountNode(parsed.accounts.Equity, 'Equity')
                  ) : (
                    <p className="text-xs text-zinc-400">No equity open.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Income Statement (P&L) */}
        {activeTab === 'income-statement' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Total Income / Revenue
                </span>
                <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                  ${parsed.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-zinc-400">SaaS, Consulting, Dividends</span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Total Operating Expenses
                </span>
                <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                  ${parsed.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-zinc-400">Office, Cloud, Food, Travel</span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
                  Net Operating Profit
                </span>
                <p
                  className={`text-2xl font-bold font-mono mt-1 ${
                    parsed.totalIncome >= parsed.totalExpenses ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ${(parsed.totalIncome - parsed.totalExpenses).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <span className="text-[11px] text-zinc-400">
                  Profit Margin:{' '}
                  {parsed.totalIncome > 0
                    ? `${Math.round(((parsed.totalIncome - parsed.totalExpenses) / parsed.totalIncome) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Income Tree */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <h3 className="text-sm font-semibold text-zinc-100">Income Breakdown</h3>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    ${parsed.totalIncome.toFixed(2)}
                  </span>
                </div>
                {parsed.accounts.Income && renderAccountNode(parsed.accounts.Income, 'Income')}
              </div>

              {/* Expenses Tree */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <h3 className="text-sm font-semibold text-zinc-100">Expense Breakdown</h3>
                  <span className="font-mono font-bold text-xs text-amber-400">
                    ${parsed.totalExpenses.toFixed(2)}
                  </span>
                </div>
                {parsed.accounts.Expenses && renderAccountNode(parsed.accounts.Expenses, 'Expenses')}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Trial Balance */}
        {activeTab === 'trial-balance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${trialDiff < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`} />
                  Trial Balance Verification
                </h3>
                <p className="text-xs text-zinc-400">
                  {trialDiff < 0.01
                    ? 'All debits perfectly equal credits. Plain-text double-entry ledger is mathematically verified.'
                    : `Discrepancy detected: ${trialDiff.toFixed(2)} USD imbalance`}
                </p>
              </div>

              <div className="text-right font-mono text-xs">
                <div>Debits: <strong className="text-emerald-400">${totalDebits.toFixed(2)}</strong></div>
                <div>Credits: <strong className="text-rose-400">${totalCredits.toFixed(2)}</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Account Name</th>
                    <th className="py-2.5 px-4 font-medium text-right">Debit ($)</th>
                    <th className="py-2.5 px-4 font-medium text-right">Credit ($)</th>
                    <th className="py-2.5 px-4 font-medium text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {trialBalanceAccounts.map((row) => (
                    <tr key={row.account} className="hover:bg-zinc-850/50">
                      <td className="py-2 px-4 text-zinc-200">{row.account}</td>
                      <td className="py-2 px-4 text-right text-emerald-400">
                        {row.debit > 0 ? row.debit.toFixed(2) : '-'}
                      </td>
                      <td className="py-2 px-4 text-right text-rose-400">
                        {row.credit > 0 ? row.credit.toFixed(2) : '-'}
                      </td>
                      <td className="py-2 px-4 text-right font-semibold text-zinc-300">
                        {row.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-900/90 font-bold text-zinc-100">
                    <td className="py-2.5 px-4">TOTALS</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">
                      ${totalDebits.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-rose-400">
                      ${totalCredits.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-100">
                      ${trialDiff.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Visual Charts */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Category Expenses Distribution */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-3">
                <PieChartIcon className="h-4 w-4 text-amber-400" />
                Expense Breakdown by Category
              </h3>

              {parsed.categoryExpenses.length === 0 ? (
                <p className="text-xs text-zinc-400">No expense records found.</p>
              ) : (
                <div className="space-y-3">
                  {/* Visual stacked horizontal bar */}
                  <div className="h-4 w-full rounded-full bg-zinc-800 flex overflow-hidden">
                    {parsed.categoryExpenses.map((cat, idx) => {
                      const colors = [
                        'bg-emerald-500',
                        'bg-indigo-500',
                        'bg-amber-500',
                        'bg-rose-500',
                        'bg-cyan-500',
                        'bg-purple-500',
                      ];
                      return (
                        <div
                          key={cat.category}
                          style={{ width: `${cat.percentage}%` }}
                          className={`${colors[idx % colors.length]} hover:opacity-90 transition-opacity`}
                          title={`${cat.category}: $${cat.amount} (${cat.percentage}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend list */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {parsed.categoryExpenses.map((cat, idx) => {
                      const colors = [
                        'text-emerald-400',
                        'text-indigo-400',
                        'text-amber-400',
                        'text-rose-400',
                        'text-cyan-400',
                        'text-purple-400',
                      ];
                      return (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono"
                        >
                          <span className={`${colors[idx % colors.length]} font-medium truncate mr-1`}>
                            {cat.category}
                          </span>
                          <span className="text-zinc-300 shrink-0">
                            ${cat.amount.toFixed(2)} ({cat.percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Trend Bars */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                Monthly Cash Flow (Income vs Expenses)
              </h3>

              {parsed.monthlyStats.length === 0 ? (
                <p className="text-xs text-zinc-400">No monthly transaction data available.</p>
              ) : (
                <div className="space-y-4">
                  {parsed.monthlyStats.map((stat) => {
                    const maxVal = Math.max(stat.income, stat.expenses, 1);
                    const incWidth = Math.min(100, Math.round((stat.income / maxVal) * 100));
                    const expWidth = Math.min(100, Math.round((stat.expenses / maxVal) * 100));

                    return (
                      <div key={stat.month} className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-zinc-400">
                          <span className="font-semibold text-zinc-200">{stat.month}</span>
                          <span>
                            Net: <strong className={stat.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              ${stat.net.toLocaleString()}
                            </strong>
                          </span>
                        </div>

                        {/* Income bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] text-zinc-400">Income</span>
                          <div className="flex-1 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${incWidth}%` }}
                              className="bg-emerald-500 h-full rounded-full"
                            />
                          </div>
                          <span className="w-20 text-right text-emerald-400">
                            ${stat.income.toLocaleString()}
                          </span>
                        </div>

                        {/* Expense bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] text-zinc-400">Expense</span>
                          <div className="flex-1 bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${expWidth}%` }}
                              className="bg-amber-500 h-full rounded-full"
                            />
                          </div>
                          <span className="w-20 text-right text-amber-400">
                            ${stat.expenses.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
