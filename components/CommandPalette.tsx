'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  CheckSquare,
  Cloud,
  Download,
  Plus,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { WorkspaceFile, ActiveAppView } from '@/types';
import { parseOrgContent } from '@/lib/org-parser';
import { parseBeancountContent } from '@/lib/beancount-parser';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: WorkspaceFile[];
  onSelectFile: (fileId: string) => void;
  setActiveView: (view: ActiveAppView) => void;
  onOpenQuickCapture: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenManagePages?: () => void;
  onOpenManageAccounts?: () => void;
  onDownloadZip: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  setActiveView,
  onOpenQuickCapture,
  onOpenSync,
  onOpenSettings,
  onOpenManagePages,
  onOpenManageAccounts,
  onDownloadZip,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on Escape or global hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable items
  const items = useMemo(() => {
    const result: Array<{
      id: string;
      title: string;
      subtitle: string;
      icon: any;
      action: () => void;
    }> = [];

    // Views
    const views: Array<{ name: string; view: ActiveAppView; icon: any }> = [
      { name: 'View Org Notes Workspace', view: 'notes', icon: FileText },
      { name: 'View BeanHub Accounting Ledger', view: 'ledger', icon: DollarSign },
      { name: 'View Kanban Board (Tasks)', view: 'kanban', icon: Calendar },
      { name: 'View Monthly & Weekly Calendar', view: 'calendar', icon: Calendar },
      { name: 'View Unified Agenda Timeline', view: 'agenda', icon: Calendar },
      { name: 'View Balance Sheet', view: 'balance-sheet', icon: BookOpen },
      { name: 'View Income Statement (P&L)', view: 'income-statement', icon: BarChart3 },
      { name: 'View Trial Balance (Verification)', view: 'trial-balance', icon: BookOpen },
      { name: 'View Cash Flow & Charts', view: 'reports', icon: BarChart3 },
      { name: 'View Habit Streaks', view: 'habits', icon: CheckSquare },
      { name: 'View Google Drive Sync & Storage Hub', view: 'sync', icon: Cloud },
    ];

    for (const v of views) {
      result.push({
        id: `view-${v.view}`,
        title: v.name,
        subtitle: 'Application View',
        icon: v.icon,
        action: () => {
          setActiveView(v.view);
          onClose();
        },
      });
    }

    result.push({
      id: 'action-settings',
      title: 'Open Methodology & Syntax Settings',
      subtitle: 'Templates, default accounts, todo sequence',
      icon: BookOpen,
      action: () => {
        onOpenSettings();
        onClose();
      },
    });

    if (onOpenManagePages) {
      result.push({
        id: 'action-manage-pages',
        title: 'Pages & Documents Hub (Manage Pages)',
        subtitle: 'Create from templates, rename wiki-links, duplicate',
        icon: FileText,
        action: () => {
          onOpenManagePages();
          onClose();
        },
      });
    }

    if (onOpenManageAccounts) {
      result.push({
        id: 'action-manage-accounts',
        title: 'Chart of Accounts Manager (Manage Accounts)',
        subtitle: 'Open accounts, close directives, assert balances',
        icon: DollarSign,
        action: () => {
          onOpenManageAccounts();
          onClose();
        },
      });
    }

    // Actions
    result.push({
      id: 'action-capture',
      title: 'Quick Capture Note or Transaction',
      subtitle: 'Shortcut (+)',
      icon: Plus,
      action: () => {
        onOpenQuickCapture();
        onClose();
      },
    });

    result.push({
      id: 'action-export',
      title: 'Download Workspace Backup (.zip)',
      subtitle: 'Export all .org and .bean files',
      icon: Download,
      action: () => {
        onDownloadZip();
        onClose();
      },
    });

    // Files
    for (const f of files) {
      result.push({
        id: `file-${f.id}`,
        title: f.name,
        subtitle: f.type === 'org' ? 'Org-mode note file' : 'Beancount plain-text ledger',
        icon: f.type === 'org' ? FileText : DollarSign,
        action: () => {
          onSelectFile(f.id);
          setActiveView(f.type === 'org' ? 'notes' : 'ledger');
          onClose();
        },
      });
    }

    return result;
  }, [files, onSelectFile, setActiveView, onOpenQuickCapture, onOpenSettings, onOpenManagePages, onOpenManageAccounts, onDownloadZip, onClose]);

  // Filter items by query
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [items, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <Search className="h-4 w-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, file name, or jump to view..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-850 px-1.5 py-0.5 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-zinc-400">
              No matching commands or files found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      : 'text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                    {item.subtitle}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Navigate with mouse or click</span>
          <span>OrgBean Unified Search</span>
        </div>
      </div>
    </div>
  );
};
