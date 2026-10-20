'use client';

import React, { useState } from 'react';
import {
  Settings,
  FileText,
  DollarSign,
  Workflow,
  Sliders,
  Check,
  RotateCcw,
  X,
  Code,
  Tag,
  Clock,
  Sparkles,
  Scale,
  FolderOpen,
} from 'lucide-react';
import { AppSettings, OrgTaskStatus } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/settings';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenManagePages?: () => void;
  onOpenManageAccounts?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  isOpen,
  onClose,
  onOpenManagePages,
  onOpenManageAccounts,
}) => {
  const [activeTab, setActiveTab] = useState<'org' | 'bean' | 'workflow'>('org');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    const confirmed = window.confirm('Reset all Org-Mode and Beancount settings to standard default syntax?');
    if (!confirmed) return;
    setFormData(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Methodology & Syntax Settings
              </h3>
              <p className="text-[11px] text-zinc-400">
                Configure templates, keywords, accounts, and full creation syntax
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-5 pt-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('org')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'org'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Org-Mode Syntax & Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bean')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'bean'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Beancount & Accounting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'workflow'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Workflow className="h-3.5 w-3.5" />
            <span>Cross-Platform Workflow</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB 1: Org-Mode Methodology */}
          {activeTab === 'org' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Author Name (#+AUTHOR:)
                  </label>
                  <input
                    type="text"
                    value={formData.org.authorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        org: { ...formData.org, authorName: e.target.value },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Default Startup Folding (#+STARTUP:)
                  </label>
                  <select
                    value={formData.org.defaultStartupFold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        org: {
                          ...formData.org,
                          defaultStartupFold: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="content">content (headlines + sub-headlines visible)</option>
                    <option value="overview">overview (top-level headlines only)</option>
                    <option value="folded">folded (collapsed by default)</option>
                    <option value="showall">showall (fully expanded)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Default Task Priority
                  </label>
                  <select
                    value={formData.org.defaultPriority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        org: {
                          ...formData.org,
                          defaultPriority: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A">[#A] High Priority</option>
                    <option value="B">[#B] Medium Priority</option>
                    <option value="C">[#C] Low Priority</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Habit Repeat Default (:REPEAT:)
                  </label>
                  <input
                    type="text"
                    value={formData.org.habitRepeatDefault}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        org: { ...formData.org, habitRepeatDefault: e.target.value },
                      })
                    }
                    placeholder=".+1d"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* TODO Keywords and Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    TODO Sequence Keywords (Cycle)
                  </label>
                  <input
                    type="text"
                    value={formData.org.defaultTodoSequence.join(', ')}
                    onChange={(e) => {
                      const splitted = e.target.value
                        .split(',')
                        .map((s) => s.trim().toUpperCase())
                        .filter(Boolean) as OrgTaskStatus[];
                      if (splitted.length > 0) {
                        setFormData({
                          ...formData,
                          org: { ...formData.org, defaultTodoSequence: splitted },
                        });
                      }
                    }}
                    placeholder="TODO, DOING, WAIT, DONE, CANCELLED"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.org.defaultTodoSequence.map((status, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300"
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Default Note Tags (#+TAGS:)
                  </label>
                  <input
                    type="text"
                    value={formData.org.defaultTags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map((s) => s.trim().replace(/^:+|:+$/g, ''))
                        .filter(Boolean);
                      setFormData({
                        ...formData,
                        org: { ...formData.org, defaultTags: tags },
                      });
                    }}
                    placeholder="focus, project, finance"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-400">Comma-separated tags for new notes</span>
                </div>
              </div>

              {/* Auto close checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.org.autoCloseTimestamp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      org: { ...formData.org, autoCloseTimestamp: e.target.checked },
                    })
                  }
                  className="rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-0"
                />
                <span className="text-zinc-300">
                  Automatically insert <code>CLOSED: [YYYY-MM-DD]</code> timestamp when marking tasks as DONE
                </span>
              </label>

              {/* Template Editors */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-300">
                    New Note Template Syntax (.org)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Full Org-Mode Header & Sections
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {['{{TITLE}}', '{{AUTHOR}}', '{{DATE}}', '{{STARTUP}}', '{{TAGS}}', '{{ID}}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          org: { ...formData.org, noteTemplate: formData.org.noteTemplate + '\n' + v },
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-[10px] font-mono transition-colors"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.org.noteTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      org: { ...formData.org, noteTemplate: e.target.value },
                    })
                  }
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-300">
                    New Task Template Syntax
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Task status, priority, schedule & checklists
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {['{{STATUS}}', '{{PRIORITY}}', '{{TITLE}}', '{{TAGS}}', '{{SCHEDULED}}', '{{BODY}}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          org: { ...formData.org, taskTemplate: formData.org.taskTemplate + ' ' + v },
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-[10px] font-mono transition-colors"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.org.taskTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      org: { ...formData.org, taskTemplate: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Beancount & Plain-Text Accounting */}
          {activeTab === 'bean' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Operating Currency (Commodity)
                  </label>
                  <select
                    value={formData.bean.operatingCurrency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bean: { ...formData.bean, operatingCurrency: e.target.value },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">USD ($ United States Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                    <option value="CAD">CAD ($ Canadian Dollar)</option>
                    <option value="JPY">JPY (¥ Japanese Yen)</option>
                    <option value="CHF">CHF (Swiss Franc)</option>
                    <option value="AUD">AUD ($ Australian Dollar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Default Transaction Flag
                  </label>
                  <select
                    value={formData.bean.defaultFlag}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bean: { ...formData.bean, defaultFlag: e.target.value as '*' | '!' },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="*">* Cleared / Verified</option>
                    <option value="!">! Pending / Unreconciled</option>
                  </select>
                </div>
              </div>

              {/* Default Accounts Setup */}
              <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-3.5 space-y-2.5">
                <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                  Default Accounts Conventions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-0.5 text-[11px]">Default Asset Account</label>
                    <input
                      type="text"
                      value={formData.bean.defaultAssetAccount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bean: { ...formData.bean, defaultAssetAccount: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 font-mono text-[11px] text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-0.5 text-[11px]">Default Liability Account</label>
                    <input
                      type="text"
                      value={formData.bean.defaultLiabilityAccount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bean: { ...formData.bean, defaultLiabilityAccount: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 font-mono text-[11px] text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-0.5 text-[11px]">Default Expense Account</label>
                    <input
                      type="text"
                      value={formData.bean.defaultExpenseAccount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bean: { ...formData.bean, defaultExpenseAccount: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 font-mono text-[11px] text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-0.5 text-[11px]">Default Income Account</label>
                    <input
                      type="text"
                      value={formData.bean.defaultIncomeAccount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bean: { ...formData.bean, defaultIncomeAccount: e.target.value },
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 font-mono text-[11px] text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Inventory Booking Method
                  </label>
                  <select
                    value={formData.bean.bookingMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bean: { ...formData.bean, bookingMethod: e.target.value as any },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FIFO">FIFO (First-In First-Out)</option>
                    <option value="LIFO">LIFO (Last-In First-Out)</option>
                    <option value="AVERAGE">AVERAGE Cost Basis</option>
                    <option value="STRICT">STRICT Matching</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Org-Note Link Directive Syntax
                  </label>
                  <select
                    value={formData.bean.linkSyntax}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bean: { ...formData.bean, linkSyntax: e.target.value as 'note' | 'document' },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="note">note: [[Note Title]] (OrgNote Style)</option>
                    <option value="document">document: [[Note Title]] (BeanHub Style)</option>
                  </select>
                </div>
              </div>

              {/* Ledger template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-300">
                    New Ledger File Template (.bean)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Directives, commodities, and open accounts
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {['{{TITLE}}', '{{CURRENCY}}', '{{BOOKING_METHOD}}', '{{DATE}}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          bean: { ...formData.bean, ledgerTemplate: formData.bean.ledgerTemplate + '\n' + v },
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-[10px] font-mono transition-colors"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.bean.ledgerTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bean: { ...formData.bean, ledgerTemplate: e.target.value },
                    })
                  }
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Transaction template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-300">
                    New Transaction Entry Template (.bean)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Double-entry posting formatting
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    '{{DATE}}',
                    '{{FLAG}}',
                    '{{PAYEE}}',
                    '{{NARRATION}}',
                    '{{TAGS}}',
                    '{{NOTE_LINK}}',
                    '{{FROM_ACCOUNT}}',
                    '{{TO_ACCOUNT}}',
                    '{{CREDIT_AMOUNT}}',
                    '{{DEBIT_AMOUNT}}',
                    '{{CURRENCY}}',
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          bean: { ...formData.bean, txTemplate: formData.bean.txTemplate + ' ' + v },
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-indigo-300 text-[10px] font-mono transition-colors"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.bean.txTemplate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bean: { ...formData.bean, txTemplate: e.target.value },
                    })
                  }
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Auto balance residual posting */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.bean.autoBalanceResidual}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bean: { ...formData.bean, autoBalanceResidual: e.target.checked },
                    })
                  }
                  className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-0"
                />
                <span className="text-zinc-300">
                  Automatically calculate and balance residual amounts for postings without explicit figures
                </span>
              </label>
            </div>
          )}

          {/* TAB 3: Workflow & Cross-Platform */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              {/* Quick Hub Launchers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onOpenManagePages && (
                  <div
                    onClick={() => {
                      onClose();
                      onOpenManagePages();
                    }}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-zinc-200 text-xs">Pages & Documents Hub</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Create, duplicate, rename across wiki-links, or remove vault pages.
                    </p>
                  </div>
                )}

                {onOpenManageAccounts && (
                  <div
                    onClick={() => {
                      onClose();
                      onOpenManageAccounts();
                    }}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-zinc-200 text-xs">Chart of Accounts Manager</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Open, close, rename accounts across ledgers, and assert balances.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Default View on Startup
                </label>
                <select
                  value={formData.workflow.defaultView}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workflow: { ...formData.workflow, defaultView: e.target.value as any },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="notes">Org Notes Visual Editor</option>
                  <option value="ledger">BeanHub Double-Entry Ledger</option>
                  <option value="kanban">Kanban Board (Task Management)</option>
                  <option value="calendar">Monthly & Weekly Calendar</option>
                  <option value="agenda">Unified Agenda & Timeline</option>
                  <option value="balance-sheet">Financial Balance Sheet</option>
                  <option value="reports">Cash Flow & Charts</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.workflow.embedBeancountMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workflow: { ...formData.workflow, embedBeancountMode: e.target.checked },
                      })
                    }
                    className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0"
                  />
                  <span className="text-zinc-300">
                    Parse embedded <code>#+BEGIN_SRC beancount</code> blocks in Org notes directly into statements
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.workflow.autoDetectOverdue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workflow: { ...formData.workflow, autoDetectOverdue: e.target.checked },
                      })
                    }
                    className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0"
                  />
                  <span className="text-zinc-300">
                    Highlight overdue deadlines and pending unreconciled transactions with visual warning pills
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                {isSavedNotice ? <Check className="h-4 w-4" /> : null}
                <span>{isSavedNotice ? 'Saved!' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
