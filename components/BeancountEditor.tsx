'use client';

import React, { useState, useMemo } from 'react';
import {
  Code,
  List,
  Search,
  Plus,
  Filter,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RefreshCw,
} from 'lucide-react';
import { WorkspaceFile, BeancountTransaction } from '@/types';
import { parseBeancountContent, formatTransactionBeancount } from '@/lib/beancount-parser';

interface BeancountEditorProps {
  file: WorkspaceFile;
  onUpdateContent: (fileId: string, newContent: string) => void;
  onNavigateToFile: (fileName: string) => void;
  allFiles: WorkspaceFile[];
}

export const BeancountEditor: React.FC<BeancountEditorProps> = ({
  file,
  onUpdateContent,
  onNavigateToFile,
  allFiles,
}) => {
  const [viewMode, setViewMode] = useState<'journal' | 'source'>('journal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedFlag, setSelectedFlag] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Parse ledger
  const parsed = useMemo(() => {
    return parseBeancountContent(file.content, file.id, file.name);
  }, [file.content, file.id, file.name]);

  // Unique accounts from transactions
  const accountsList = useMemo(() => {
    const set = new Set<string>();
    for (const tx of parsed.transactions) {
      for (const p of tx.postings) {
        set.add(p.account);
      }
    }
    return Array.from(set).sort();
  }, [parsed.transactions]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return parsed.transactions.filter((tx) => {
      // Search
      const matchSearch =
        !searchQuery ||
        tx.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.noteLink && tx.noteLink.toLowerCase().includes(searchQuery.toLowerCase()));

      // Account filter
      const matchAccount =
        selectedAccount === 'ALL' ||
        tx.postings.some((p) => p.account.startsWith(selectedAccount));

      // Flag filter
      const matchFlag =
        selectedFlag === 'ALL' || tx.flag === selectedFlag;

      return matchSearch && matchAccount && matchFlag;
    });
  }, [parsed.transactions, searchQuery, selectedAccount, selectedFlag]);

  // Form state for adding new transaction
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txFlag, setTxFlag] = useState<'*' | '!'>('*');
  const [txPayee, setTxPayee] = useState('');
  const [txNarration, setTxNarration] = useState('');
  const [txTags, setTxTags] = useState('');
  const [txNoteLink, setTxNoteLink] = useState('');
  const [postings, setPostings] = useState<Array<{ account: string; amount: string; currency: string }>>([
    { account: 'Liabilities:CreditCard:Chase', amount: '-45.00', currency: 'USD' },
    { account: 'Expenses:Food:Dining', amount: '45.00', currency: 'USD' },
  ]);

  const handleAddPosting = () => {
    setPostings((prev) => [...prev, { account: 'Expenses:Office:Software', amount: '', currency: 'USD' }]);
  };

  const handleRemovePosting = (index: number) => {
    setPostings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePosting = (index: number, field: 'account' | 'amount' | 'currency', val: string) => {
    setPostings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Auto balance residual amount
  const handleAutoBalance = () => {
    let sum = 0;
    for (let i = 0; i < postings.length - 1; i++) {
      const amt = parseFloat(postings[i].amount) || 0;
      sum += amt;
    }
    const residual = -Math.round(sum * 100) / 100;
    setPostings((prev) => {
      const copy = [...prev];
      copy[copy.length - 1].amount = residual.toFixed(2);
      return copy;
    });
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txNarration && !txPayee) return;

    const formattedPostings = postings.map((p) => ({
      account: p.account.trim(),
      amount: p.amount ? parseFloat(p.amount) : undefined,
      currency: p.currency.trim() || 'USD',
    }));

    const tagsArray = txTags
      .split(/\s+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);

    const formattedTxString = formatTransactionBeancount({
      date: txDate,
      flag: txFlag,
      payee: txPayee.trim(),
      narration: txNarration.trim(),
      tags: tagsArray,
      noteLink: txNoteLink.trim() || undefined,
      postings: formattedPostings,
    });

    // Append to file
    const newContent = file.content.trimEnd() + '\n\n' + formattedTxString;
    onUpdateContent(file.id, newContent);
    setShowAddModal(false);

    // Reset form
    setTxPayee('');
    setTxNarration('');
    setTxTags('');
    setTxNoteLink('');
  };

  const imbalancedCount = parsed.transactions.filter((t) => !t.isBalanced).length;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-indigo-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            {file.name}
          </span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            ({parsed.transactions.length} transactions, {accountsList.length} accounts)
          </span>

          {imbalancedCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
              <AlertTriangle className="h-3 w-3 text-rose-400" />
              {imbalancedCount} imbalanced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
              <CheckCircle className="h-3 w-3 text-emerald-400" />
              Books Balanced
            </span>
          )}
        </div>

        {/* View Toggle & New Tx Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Transaction</span>
          </button>

          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('journal')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'journal'
                  ? 'bg-zinc-800 text-indigo-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Interactive Journal Mode"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Journal</span>
            </button>
            <button
              onClick={() => setViewMode('source')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'source'
                  ? 'bg-zinc-800 text-indigo-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Plain-text Beancount Code"
            >
              <Code className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Source</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'journal' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-5xl mx-auto w-full">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search payee, narration, #tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Account Filter */}
              <div>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Accounts ({accountsList.length})</option>
                  <option value="Assets">Assets (Checking, Savings, Investments)</option>
                  <option value="Liabilities">Liabilities (Credit Cards, Loans)</option>
                  <option value="Income">Income (Consulting, SaaS, Sales)</option>
                  <option value="Expenses">Expenses (Office, Food, Housing)</option>
                  {accountsList.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flag filter */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedFlag}
                  onChange={(e) => setSelectedFlag(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses (* & !)</option>
                  <option value="*">* Cleared Transactions</option>
                  <option value="!">! Pending / Unreconciled</option>
                </select>

                {(searchQuery || selectedAccount !== 'ALL' || selectedFlag !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedAccount('ALL');
                      setSelectedFlag('ALL');
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-lg text-xs"
                    title="Reset filters"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Transactions List */}
            {filteredTxs.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                <p>No transactions match your current search/filters.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
                >
                  Create New Transaction
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className={`rounded-xl border p-3.5 transition-all bg-zinc-900/40 hover:bg-zinc-900/80 ${
                      !tx.isBalanced
                        ? 'border-rose-800/80 bg-rose-950/10'
                        : 'border-zinc-800/90'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-300">
                          {tx.date}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            tx.flag === '*'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {tx.flag === '*' ? 'CLEARED (*)' : 'PENDING (!)'}
                        </span>

                        {tx.payee && (
                          <span className="text-xs font-semibold text-zinc-100">
                            {tx.payee}
                          </span>
                        )}

                        <span className="text-xs text-zinc-300">
                          {tx.narration}
                        </span>
                      </div>

                      {/* Right Tags & Org Note Link */}
                      <div className="flex items-center gap-1.5">
                        {tx.noteLink && (
                          <button
                            onClick={() => onNavigateToFile(tx.noteLink!)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-800 transition-colors cursor-pointer"
                            title={`Jump to note: ${tx.noteLink}`}
                          >
                            <FileText className="h-3 w-3 text-emerald-400" />
                            <span>[[{tx.noteLink}]]</span>
                          </button>
                        )}

                        {tx.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded"
                          >
                            #{tag}
                          </span>
                        ))}

                        {!tx.isBalanced && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700">
                            Imbalance: {tx.imbalanceAmount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Postings Table */}
                    <div className="mt-2 space-y-1">
                      {tx.postings.map((p, pIdx) => {
                        const isCredit = (p.amount || 0) < 0;
                        const isDebit = (p.amount || 0) > 0;

                        return (
                          <div
                            key={pIdx}
                            className="flex items-center justify-between text-xs font-mono py-0.5 px-1 rounded hover:bg-zinc-800/40"
                          >
                            <span className="text-zinc-300 truncate mr-2">
                              {p.account}
                            </span>
                            <span
                              className={`tabular-nums font-semibold shrink-0 ${
                                isCredit
                                  ? 'text-rose-400'
                                  : isDebit
                                  ? 'text-emerald-400'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {p.amount !== undefined ? (
                                <>
                                  {p.amount > 0 ? '+' : ''}
                                  {p.amount.toFixed(2)} {p.currency || 'USD'}
                                </>
                              ) : (
                                <span className="text-zinc-400 italic">auto-balance</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Beancount Source Code View */
          <div className="flex-1 flex flex-col h-full bg-zinc-950">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/80 text-[11px] text-zinc-400 font-mono">
              <span>Plain-text Beancount format. Directives: open, close, balance, price, transaction</span>
              <button
                onClick={() => {
                  const sampleTx = `\n${new Date().toISOString().slice(0, 10)} * "Vendor" "Description" #tag\n  Assets:Bank:Checking        -50.00 USD\n  Expenses:Office:Software     50.00 USD\n`;
                  onUpdateContent(file.id, file.content.trimEnd() + sampleTx);
                }}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded"
              >
                + Insert Sample Tx
              </button>
            </div>
            <textarea
              value={file.content}
              onChange={(e) => onUpdateContent(file.id, e.target.value)}
              placeholder="Beancount plain-text ledger..."
              spellCheck={false}
              className="flex-1 w-full bg-zinc-950 text-zinc-200 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0"
            />
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-400" />
                Record Double-Entry Transaction
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Status Flag</label>
                  <select
                    value={txFlag}
                    onChange={(e) => setTxFlag(e.target.value as '*' | '!')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="*">* Cleared</option>
                    <option value="!">! Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple Store"
                    value={txPayee}
                    onChange={(e) => setTxPayee(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Narration / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. New testing hardware for mobile app"
                  value={txNarration}
                  onChange={(e) => setTxNarration(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Tags (#hardware #tax)</label>
                  <input
                    type="text"
                    placeholder="#hardware #client"
                    value={txTags}
                    onChange={(e) => setTxTags(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Link to Org Note (Optional)</label>
                  <select
                    value={txNoteLink}
                    onChange={(e) => setTxNoteLink(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    {allFiles
                      .filter((f) => f.type === 'org')
                      .map((f) => (
                        <option key={f.name} value={f.name}>
                          [[{f.name}]]
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Postings */}
              <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/60 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 font-medium">
                  <span>Double-Entry Postings (Must Balance = 0)</span>
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Auto-Balance Remainder
                  </button>
                </div>

                {postings.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Account (e.g. Assets:Bank:Checking)"
                      value={p.account}
                      onChange={(e) => handleUpdatePosting(idx, 'account', e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-750 rounded p-1.5 font-mono text-zinc-100"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount (-50.00)"
                      value={p.amount}
                      onChange={(e) => handleUpdatePosting(idx, 'amount', e.target.value)}
                      className="w-24 bg-zinc-900 border border-zinc-750 rounded p-1.5 font-mono text-zinc-100 text-right"
                    />
                    <input
                      type="text"
                      value={p.currency}
                      onChange={(e) => handleUpdatePosting(idx, 'currency', e.target.value)}
                      className="w-14 bg-zinc-900 border border-zinc-750 rounded p-1.5 font-mono text-zinc-100 text-center"
                    />
                    {postings.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePosting(idx)}
                        className="text-zinc-400 hover:text-rose-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPosting}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 mt-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Split / Account Posting</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Save to {file.name}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
