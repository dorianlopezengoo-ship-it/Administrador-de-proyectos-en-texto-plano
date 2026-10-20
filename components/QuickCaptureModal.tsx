'use client';

import React, { useState } from 'react';
import {
  Plus,
  FileText,
  DollarSign,
  X,
  Calendar,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { WorkspaceFile, OrgTaskStatus, AppSettings } from '@/types';
import { formatTransactionBeancount } from '@/lib/beancount-parser';
import { renderNewTaskContent, renderNewTxContent } from '@/lib/settings';

interface QuickCaptureModalProps {
  files: WorkspaceFile[];
  settings: AppSettings;
  onUpdateContent: (fileId: string, newContent: string) => void;
  isOpen: boolean;
  onClose: () => void;
  preselectedNote?: string;
  preselectedDate?: string;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  files,
  settings,
  onUpdateContent,
  isOpen,
  onClose,
  preselectedNote,
  preselectedDate,
}) => {
  const [activeTab, setActiveTab] = useState<'task' | 'transaction'>(
    preselectedNote ? 'transaction' : 'task'
  );

  const defaultDate = preselectedDate || '2026-10-19';

  // Org Task State
  const orgFiles = files.filter((f) => f.type === 'org');
  const [targetOrgFileId, setTargetOrgFileId] = useState<string>(
    orgFiles[0]?.id || ''
  );
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'A' | 'B' | 'C' | ''>(
    settings.org.defaultPriority !== 'none' ? settings.org.defaultPriority : 'A'
  );
  const [taskStatus, setTaskStatus] = useState<OrgTaskStatus>(
    settings.org.defaultTodoSequence[0] || 'TODO'
  );
  const [taskDate, setTaskDate] = useState(defaultDate);
  const [taskTags, setTaskTags] = useState(settings.org.defaultTags.join(' '));
  const [taskBody, setTaskBody] = useState('');

  // Transaction State
  const beanFiles = files.filter((f) => f.type === 'bean');
  const [targetBeanFileId, setTargetBeanFileId] = useState<string>(
    beanFiles[0]?.id || ''
  );
  const [txDate, setTxDate] = useState(defaultDate);
  const [txPayee, setTxPayee] = useState('');
  const [txNarration, setTxNarration] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txFromAccount, setTxFromAccount] = useState(settings.bean.defaultLiabilityAccount);
  const [txToAccount, setTxToAccount] = useState(settings.bean.defaultExpenseAccount);
  const [txLinkedNote, setTxLinkedNote] = useState(preselectedNote || '');

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !targetOrgFileId) return;

    const file = files.find((f) => f.id === targetOrgFileId);
    if (!file) return;

    const prioStr = taskPriority ? `[#${taskPriority}] ` : '';
    const tagsStr = taskTags ? ` :${taskTags.replace(/\s+/g, ':')}:` : '';
    const schedStr = taskDate ? `\nSCHEDULED: <${taskDate}>` : '';
    const bodyStr = taskBody ? `\n${taskBody}` : '';

    const newSnippet = `\n** ${taskStatus} ${prioStr}${taskTitle.trim()}${tagsStr}${schedStr}${bodyStr}\n`;
    onUpdateContent(file.id, file.content.trimEnd() + newSnippet);

    setTaskTitle('');
    setTaskBody('');
    onClose();
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txNarration.trim() || !txAmount || !targetBeanFileId) return;

    const file = files.find((f) => f.id === targetBeanFileId);
    if (!file) return;

    const amt = parseFloat(txAmount);
    if (isNaN(amt)) return;

    const formattedTx = formatTransactionBeancount({
      date: txDate,
      flag: '*',
      payee: txPayee.trim(),
      narration: txNarration.trim(),
      noteLink: txLinkedNote || undefined,
      postings: [
        { account: txFromAccount, amount: -amt, currency: 'USD' },
        { account: txToAccount, amount: amt, currency: 'USD' },
      ],
    });

    onUpdateContent(file.id, file.content.trimEnd() + '\n\n' + formattedTx);

    setTxPayee('');
    setTxNarration('');
    setTxAmount('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Quick Capture</h3>
              <p className="text-[11px] text-zinc-400">
                Log a task to your Org notes or a plain-text transaction to your ledger
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              activeTab === 'task'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Org Task / Note</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transaction')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              activeTab === 'transaction'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>BeanHub Transaction</span>
          </button>
        </div>

        {/* Tab 1: Org Task Form */}
        {activeTab === 'task' && (
          <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Target Note File</label>
              <select
                value={targetOrgFileId}
                onChange={(e) => setTargetOrgFileId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {orgFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Task Title / Headline</label>
              <input
                type="text"
                placeholder="e.g. Reconcile monthly subscriptions and draft invoices"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as OrgTaskStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="TODO">TODO</option>
                  <option value="DOING">DOING</option>
                  <option value="WAIT">WAIT</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'A' | 'B' | 'C' | '')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="A">[#A] High</option>
                  <option value="B">[#B] Medium</option>
                  <option value="C">[#C] Low</option>
                  <option value="">None</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Tags (separated by space)</label>
              <input
                type="text"
                placeholder="finance tax sprint"
                value={taskTags}
                onChange={(e) => setTaskTags(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Notes / Description (Optional)</label>
              <textarea
                placeholder="Additional context, checklist items (- [ ] item)..."
                value={taskBody}
                onChange={(e) => setTaskBody(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Beancount Transaction Form */}
        {activeTab === 'transaction' && (
          <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Target Ledger File</label>
              <select
                value={targetBeanFileId}
                onChange={(e) => setTargetBeanFileId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {beanFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="59.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-right focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Payee</label>
                <input
                  type="text"
                  placeholder="Google Cloud / Apple / Landlord"
                  value={txPayee}
                  onChange={(e) => setTxPayee(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Narration / Memo</label>
                <input
                  type="text"
                  placeholder="Monthly server infrastructure"
                  value={txNarration}
                  onChange={(e) => setTxNarration(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">From Account (Credit/Paid)</label>
                <input
                  type="text"
                  value={txFromAccount}
                  onChange={(e) => setTxFromAccount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">To Account (Debit/Category)</label>
                <input
                  type="text"
                  value={txToAccount}
                  onChange={(e) => setTxToAccount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Link to Org Note (Cross-Platform Synergy)
              </label>
              <select
                value={txLinkedNote}
                onChange={(e) => setTxLinkedNote(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">None</option>
                {orgFiles.map((f) => (
                  <option key={f.name} value={f.name}>
                    [[{f.name}]]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Save Double-Entry Tx
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
