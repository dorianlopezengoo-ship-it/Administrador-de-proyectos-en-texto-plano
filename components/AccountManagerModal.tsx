'use client';

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Check,
  FolderTree,
  Scale,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { WorkspaceFile, AppSettings } from '@/types';
import { parseBeancountContent } from '@/lib/beancount-parser';
import {
  openAccountInFile,
  closeAccountInFile,
  assertAccountBalanceInFile,
  renameAccountAcrossFiles,
} from '@/lib/account-manager';

interface AccountManagerModalProps {
  files: WorkspaceFile[];
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFiles: (newFiles: WorkspaceFile[]) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  files,
  settings,
  isOpen,
  onClose,
  onUpdateFiles,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOpenAccountForm, setShowOpenAccountForm] = useState(false);

  // Open account state
  const [newAccType, setNewAccType] = useState<'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses'>('Assets');
  const [newAccSubName, setNewAccSubName] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState(settings.bean.operatingCurrency || 'USD');
  const [newAccDate, setNewAccDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAccOpeningBal, setNewAccOpeningBal] = useState('');
  const beanFiles = files.filter((f) => f.type === 'bean');
  const [targetFileId, setTargetFileId] = useState(beanFiles[0]?.id || '');

  // Assert balance modal state
  const [assertModal, setAssertModal] = useState<{
    isOpen: boolean;
    accountName: string;
    currency: string;
    currentBalance: number;
  }>({
    isOpen: false,
    accountName: '',
    currency: 'USD',
    currentBalance: 0,
  });
  const [assertAmount, setAssertAmount] = useState('');
  const [assertDate, setAssertDate] = useState(new Date().toISOString().slice(0, 10));

  // Rename account state
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    oldName: string;
    newName: string;
  }>({
    isOpen: false,
    oldName: '',
    newName: '',
  });

  // Parse all accounts across all bean files
  const accountsData = useMemo(() => {
    let combined = '';
    for (const f of files) {
      if (f.type === 'bean') {
        combined += '\n' + f.content;
      }
    }
    const parsed = parseBeancountContent(combined, 'all', 'combined');

    // Extract all distinct accounts from transactions, open directives, and assertions
    const allNames = new Set<string>();
    parsed.openAccounts.forEach((a) => allNames.add(a));
    for (const tx of parsed.transactions) {
      for (const p of tx.postings) allNames.add(p.account);
    }
    for (const b of parsed.balanceAssertions) allNames.add(b.account);

    const list = Array.from(allNames).map((accName) => {
      const parts = accName.split(':');
      const rootType = parts[0] as 'Assets' | 'Liabilities' | 'Equity' | 'Income' | 'Expenses';
      const isOpen = parsed.openAccounts.has(accName) || parsed.openAccounts.size === 0;

      // Find balance
      let currentBal = 0;
      let txCount = 0;
      for (const tx of parsed.transactions) {
        for (const p of tx.postings) {
          if (p.account === accName) {
            txCount++;
            if (p.amount !== undefined) currentBal += p.amount;
          }
        }
      }

      return {
        name: accName,
        type: rootType,
        isOpen,
        balance: Math.round(currentBal * 100) / 100,
        txCount,
      };
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [files]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accountsData.filter((acc) => {
      if (selectedType !== 'ALL' && acc.type !== selectedType) return false;
      if (searchQuery) {
        return acc.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [accountsData, selectedType, searchQuery]);

  // Create new account handler
  const handleOpenAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccSubName.trim() || !targetFileId) return;

    const file = files.find((f) => f.id === targetFileId);
    if (!file) return;

    const updatedContent = openAccountInFile(file.content, {
      type: newAccType,
      subAccount: newAccSubName.trim(),
      currency: newAccCurrency,
      openDate: newAccDate,
      openingBalance: newAccOpeningBal ? parseFloat(newAccOpeningBal) : undefined,
      targetFileId,
    });

    const updatedFiles = files.map((f) =>
      f.id === file.id ? { ...f, content: updatedContent, updatedAt: Date.now() } : f
    );

    onUpdateFiles(updatedFiles);
    setNewAccSubName('');
    setNewAccOpeningBal('');
    setShowOpenAccountForm(false);
  };

  // Close account handler
  const handleCloseAccount = (accountName: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const confirmed = window.confirm(
      `Append 'close' directive for "${accountName}" on ${today}? This archives the account according to Beancount syntax.`
    );
    if (!confirmed) return;

    const primaryBean = files.find((f) => f.type === 'bean');
    if (!primaryBean) return;

    const updatedContent = closeAccountInFile(primaryBean.content, accountName, today);
    const updatedFiles = files.map((f) =>
      f.id === primaryBean.id ? { ...f, content: updatedContent, updatedAt: Date.now() } : f
    );
    onUpdateFiles(updatedFiles);
  };

  // Assert balance handler
  const handleSaveAssertion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assertAmount) return;

    const primaryBean = files.find((f) => f.type === 'bean');
    if (!primaryBean) return;

    const updatedContent = assertAccountBalanceInFile(
      primaryBean.content,
      assertModal.accountName,
      parseFloat(assertAmount),
      assertModal.currency,
      assertDate
    );

    const updatedFiles = files.map((f) =>
      f.id === primaryBean.id ? { ...f, content: updatedContent, updatedAt: Date.now() } : f
    );

    onUpdateFiles(updatedFiles);
    setAssertModal({ isOpen: false, accountName: '', currency: 'USD', currentBalance: 0 });
    setAssertAmount('');
  };

  // Rename account handler
  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModal.newName.trim() || renameModal.newName === renameModal.oldName) return;

    const updatedFiles = renameAccountAcrossFiles(
      files,
      renameModal.oldName,
      renameModal.newName.trim()
    );

    onUpdateFiles(updatedFiles);
    setRenameModal({ isOpen: false, oldName: '', newName: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Chart of Accounts Manager
              </h3>
              <p className="text-[11px] text-zinc-400">
                Create, close, assert balances, and manage Beancount accounts hierarchy
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Controls: Search, Type Tabs, and Open Account Button */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-56 bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Account Type Filters */}
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              {['ALL', 'Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2 py-1 rounded-md transition-colors text-[11px] font-medium ${
                    selectedType === t
                      ? 'bg-zinc-800 text-indigo-300 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Open Account Button */}
          <button
            onClick={() => setShowOpenAccountForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Open Account Directive</span>
          </button>
        </div>

        {/* Accounts List Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              No accounts match the current filters.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const typeColor =
                acc.type === 'Assets'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : acc.type === 'Liabilities'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : acc.type === 'Income'
                  ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                  : acc.type === 'Expenses'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';

              return (
                <div
                  key={acc.name}
                  className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${typeColor}`}
                    >
                      {acc.type}
                    </span>

                    <div className="min-w-0">
                      <span className="font-mono font-semibold text-zinc-100 truncate block">
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {acc.txCount} transactions logged
                      </span>
                    </div>
                  </div>

                  {/* Balance & Actions */}
                  <div className="flex items-center gap-3 font-mono">
                    <div className="text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          acc.balance < 0
                            ? 'text-rose-400'
                            : acc.balance > 0
                            ? 'text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {acc.balance < 0 ? '-' : ''}$
                        {Math.abs(acc.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[10px] text-zinc-400 block">Balance</span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
                      {/* Assert Balance Button */}
                      <button
                        onClick={() => {
                          setAssertModal({
                            isOpen: true,
                            accountName: acc.name,
                            currency: 'USD',
                            currentBalance: acc.balance,
                          });
                          setAssertAmount(acc.balance.toFixed(2));
                        }}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1"
                        title="Add balance assertion directive"
                      >
                        <Scale className="h-3 w-3 text-teal-400" />
                        <span>Assert</span>
                      </button>

                      {/* Rename Account Button */}
                      <button
                        onClick={() =>
                          setRenameModal({
                            isOpen: true,
                            oldName: acc.name,
                            newName: acc.name,
                          })
                        }
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300"
                        title="Rename account across all files"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Close Account Button */}
                      <button
                        onClick={() => handleCloseAccount(acc.name)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                        title="Close / archive this account"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Open Account Modal Form */}
      {showOpenAccountForm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                Open Account Directive (Beancount)
              </h4>
              <button
                onClick={() => setShowOpenAccountForm(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleOpenAccount} className="space-y-3">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Account Category / Root</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="Assets">Assets (Checking, Savings, Crypto, Equipment)</option>
                  <option value="Liabilities">Liabilities (Credit Cards, Loans, Mortgages)</option>
                  <option value="Equity">Equity (Capital, Retained Earnings)</option>
                  <option value="Income">Income (Consulting, Sales, Dividends)</option>
                  <option value="Expenses">Expenses (Cloud, Hardware, Food, Rent)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Sub-Account Name (colon-separated)
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-zinc-400">{newAccType}:</span>
                  <input
                    type="text"
                    placeholder="Bank:Checking:HighYield"
                    value={newAccSubName}
                    onChange={(e) => setNewAccSubName(e.target.value)}
                    required
                    autoFocus
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Commodity / Currency</label>
                  <input
                    type="text"
                    value={newAccCurrency}
                    onChange={(e) => setNewAccCurrency(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Opening Date</label>
                  <input
                    type="date"
                    value={newAccDate}
                    onChange={(e) => setNewAccDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Initial Opening Balance (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1500.00 (balanced with Equity:Opening-Balances)"
                  value={newAccOpeningBal}
                  onChange={(e) => setNewAccOpeningBal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Write Directive To File</label>
                <select
                  value={targetFileId}
                  onChange={(e) => setTargetFileId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  {beanFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowOpenAccountForm(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Append Open Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assert Balance Dialog */}
      {assertModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-3.5 text-xs">
            <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <Scale className="h-4 w-4 text-teal-400" />
              Assert Balance Directive
            </h4>
            <p className="text-zinc-400">
              Asserting a balance verifies that the bank statement matches your plain-text ledger on this date.
            </p>

            <form onSubmit={handleSaveAssertion} className="space-y-3">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Account</label>
                <span className="font-mono text-zinc-200 bg-zinc-950 p-2 rounded-lg block border border-zinc-800">
                  {assertModal.accountName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Asserted Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={assertAmount}
                    onChange={(e) => setAssertAmount(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-right focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">As of Date</label>
                  <input
                    type="date"
                    value={assertDate}
                    onChange={(e) => setAssertDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssertModal({ isOpen: false, accountName: '', currency: 'USD', currentBalance: 0 })}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
                >
                  Write Balance Assertion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Account Dialog */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-3.5 text-xs">
            <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-indigo-400" />
              Rename Account Across Vault
            </h4>
            <p className="text-zinc-400">
              This will refactor all occurrences of <code className="text-zinc-200">{renameModal.oldName}</code> in all ledger files and transactions.
            </p>

            <form onSubmit={handleSaveRename} className="space-y-3">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">New Account Name</label>
                <input
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) =>
                    setRenameModal((prev) => ({ ...prev, newName: e.target.value }))
                  }
                  required
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModal({ isOpen: false, oldName: '', newName: '' })}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Refactor & Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
