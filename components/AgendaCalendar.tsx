'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Filter,
  ArrowRight,
  Square,
  CheckSquare,
} from 'lucide-react';
import { WorkspaceFile, AgendaItem } from '@/types';
import { parseOrgContent, toggleStatusInContent } from '@/lib/org-parser';
import { parseBeancountContent } from '@/lib/beancount-parser';

interface AgendaCalendarProps {
  files: WorkspaceFile[];
  onNavigateToFile: (fileName: string) => void;
  onUpdateContent: (fileId: string, newContent: string) => void;
}

export const AgendaCalendar: React.FC<AgendaCalendarProps> = ({
  files,
  onNavigateToFile,
  onUpdateContent,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'finance'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Collect all agenda items across Org notes and Beancount ledgers
  const allAgendaItems = useMemo(() => {
    const items: AgendaItem[] = [];

    for (const f of files) {
      if (f.type === 'org') {
        const parsedOrg = parseOrgContent(f.content, f.id, f.name);
        for (const hl of parsedOrg.headlines) {
          // If scheduled or deadline
          if (hl.scheduled || hl.deadline) {
            const rawDate = (hl.scheduled || hl.deadline)!.slice(0, 10);
            const isDone = hl.status === 'DONE' || hl.status === 'CANCELLED';
            const isOverdue = !isDone && rawDate < todayStr;

            items.push({
              id: `agenda-org-${hl.id}`,
              type: 'org_task',
              title: hl.title,
              subtitle: hl.scheduled ? `Scheduled: ${hl.scheduled}` : `Deadline: ${hl.deadline}`,
              date: rawDate,
              time: hl.scheduled?.slice(11),
              priority: hl.priority,
              status: hl.status,
              tags: hl.tags,
              sourceFile: f.name,
              sourceFileId: f.id,
              isOverdue,
              isDone,
            });
          }
        }
      } else if (f.type === 'bean') {
        const parsedBean = parseBeancountContent(f.content, f.id, f.name);
        // Include balance assertions and transactions
        for (const b of parsedBean.balanceAssertions) {
          items.push({
            id: `agenda-bean-bal-${b.account}-${b.date}`,
            type: 'bean_balance',
            title: `Balance Assertion: ${b.account}`,
            subtitle: `Assert balance: $${b.amount} ${b.currency}`,
            date: b.date,
            status: 'CLEARED',
            tags: ['balance-check'],
            sourceFile: f.name,
            sourceFileId: f.id,
            amount: b.amount,
            currency: b.currency,
          });
        }

        // Include recent transactions in agenda timeline
        for (const tx of parsedBean.transactions.slice(0, 15)) {
          items.push({
            id: `agenda-bean-tx-${tx.id}`,
            type: 'bean_tx',
            title: tx.payee ? `${tx.payee} — ${tx.narration}` : tx.narration,
            subtitle: tx.postings.map((p) => `${p.account} (${p.amount})`).join(', '),
            date: tx.date,
            status: tx.flag === '*' ? 'CLEARED' : 'PENDING',
            tags: tx.tags,
            sourceFile: f.name,
            sourceFileId: f.id,
          });
        }
      }
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [files, todayStr]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allAgendaItems.filter((item) => {
      if (filterType === 'tasks' && item.type !== 'org_task') return false;
      if (filterType === 'finance' && (item.type !== 'bean_tx' && item.type !== 'bean_balance')) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.sourceFile.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allAgendaItems, filterType, searchQuery]);

  // Group items by category: Overdue, Today, Tomorrow, This Week, Later
  const grouped = useMemo(() => {
    const overdue: AgendaItem[] = [];
    const today: AgendaItem[] = [];
    const upcoming: AgendaItem[] = [];
    const past: AgendaItem[] = [];

    for (const item of filteredItems) {
      if (item.isOverdue) {
        overdue.push(item);
      } else if (item.date === todayStr) {
        today.push(item);
      } else if (item.date > todayStr) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    }

    return { overdue, today, upcoming, past: past.reverse().slice(0, 10) };
  }, [filteredItems, todayStr]);

  const handleToggleDone = (item: AgendaItem) => {
    if (item.type !== 'org_task') return;
    const file = files.find((f) => f.id === item.sourceFileId);
    if (!file) return;

    // Toggle TODO to DONE in file content
    const parsed = parseOrgContent(file.content, file.id, file.name);
    const hl = parsed.headlines.find((h) => h.title === item.title);
    if (hl) {
      const nextStatus = item.isDone ? 'TODO' : 'DONE';
      const updated = toggleStatusInContent(file.content, hl.lineStart, nextStatus);
      onUpdateContent(file.id, updated);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-purple-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Unified Agenda & Financial Calendar
            </h2>
            <p className="text-[11px] text-zinc-400">
              Scheduled Org tasks, habit reviews, and Beancount balance assertions
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-zinc-800 text-purple-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Items ({allAgendaItems.length})
          </button>
          <button
            onClick={() => setFilterType('tasks')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterType === 'tasks'
                ? 'bg-zinc-800 text-emerald-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Org Tasks Only
          </button>
          <button
            onClick={() => setFilterType('finance')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filterType === 'finance'
                ? 'bg-zinc-800 text-indigo-300 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Financial Ledger Only
          </button>
        </div>
      </div>

      {/* Main Agenda Timeline */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Overdue Section */}
        {grouped.overdue.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Overdue ({grouped.overdue.length})
            </h3>
            <div className="space-y-1.5">
              {grouped.overdue.map((item) => renderAgendaCard(item, onNavigateToFile, handleToggleDone))}
            </div>
          </div>
        )}

        {/* Today Section */}
        <div className="space-y-2">
          <h3
            suppressHydrationWarning
            className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"
          >
            <Clock className="h-4 w-4 text-emerald-400" />
            Today ({todayStr})
          </h3>
          {grouped.today.length === 0 ? (
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 text-xs text-zinc-400 text-center">
              No tasks or transactions scheduled for today.
            </div>
          ) : (
            <div className="space-y-1.5">
              {grouped.today.map((item) => renderAgendaCard(item, onNavigateToFile, handleToggleDone))}
            </div>
          )}
        </div>

        {/* Upcoming Section */}
        {grouped.upcoming.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-purple-400" />
              Upcoming ({grouped.upcoming.length})
            </h3>
            <div className="space-y-1.5">
              {grouped.upcoming.map((item) => renderAgendaCard(item, onNavigateToFile, handleToggleDone))}
            </div>
          </div>
        )}

        {/* Recent Past Activity */}
        {grouped.past.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recent Past Activity
            </h3>
            <div className="space-y-1.5">
              {grouped.past.map((item) => renderAgendaCard(item, onNavigateToFile, handleToggleDone))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function renderAgendaCard(
  item: AgendaItem,
  onNavigateToFile: (fileName: string) => void,
  onToggleDone: (item: AgendaItem) => void
) {
  const isOrg = item.type === 'org_task';

  return (
    <div
      key={item.id}
      className={`group flex items-center justify-between p-3 rounded-xl border transition-colors ${
        item.isOverdue
          ? 'bg-rose-950/20 border-rose-900/60 hover:bg-rose-950/30'
          : item.isDone
          ? 'bg-zinc-900/20 border-zinc-850 opacity-60'
          : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* Checkbox for tasks */}
        {isOrg ? (
          <button
            onClick={() => onToggleDone(item)}
            className="mt-0.5 text-zinc-400 hover:text-emerald-400 cursor-pointer"
          >
            {item.isDone ? (
              <CheckSquare className="h-4 w-4 text-emerald-400" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="mt-0.5 h-4 w-4 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-800 shrink-0">
            <DollarSign className="h-2.5 w-2.5" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium truncate ${
                item.isDone ? 'line-through text-zinc-400' : 'text-zinc-100'
              }`}
            >
              {item.title}
            </span>

            {item.priority && (
              <span className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-zinc-800 text-amber-400">
                [#{item.priority}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-zinc-400">
            <span>{item.date}</span>
            {item.time && <span>• {item.time}</span>}
            {item.subtitle && <span className="truncate hidden sm:inline">• {item.subtitle}</span>}
          </div>
        </div>
      </div>

      {/* Right File Badge */}
      <button
        onClick={() => onNavigateToFile(item.sourceFile)}
        className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 ml-2 shrink-0 transition-colors"
      >
        <span>{item.sourceFile}</span>
        <ArrowRight className="h-3 w-3 text-zinc-400" />
      </button>
    </div>
  );
}
