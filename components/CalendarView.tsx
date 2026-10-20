'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { WorkspaceFile, AgendaItem, OrgTaskStatus, AppSettings } from '@/types';
import { parseOrgContent, toggleStatusInContent } from '@/lib/org-parser';
import { parseBeancountContent } from '@/lib/beancount-parser';
import { renderNewTaskContent } from '@/lib/settings';

interface CalendarViewProps {
  files: WorkspaceFile[];
  settings: AppSettings;
  onNavigateToFile: (fileName: string) => void;
  onUpdateContent: (fileId: string, newContent: string) => void;
  onOpenQuickCaptureWithDate?: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  files,
  settings,
  onNavigateToFile,
  onUpdateContent,
  onOpenQuickCaptureWithDate,
}) => {
  // Current view month (Year & Month index 0-11)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 9 = October (0-indexed)
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Collect all events (tasks + transactions + balance assertions)
  const allEvents = useMemo(() => {
    const list: AgendaItem[] = [];

    for (const f of files) {
      if (f.type === 'org') {
        const parsedOrg = parseOrgContent(f.content, f.id, f.name);
        for (const hl of parsedOrg.headlines) {
          if (hl.scheduled || hl.deadline) {
            const rawDate = (hl.scheduled || hl.deadline)!.slice(0, 10);
            list.push({
              id: `cal-org-${hl.id}`,
              type: 'org_task',
              title: hl.title,
              subtitle: hl.scheduled ? `Sched: ${hl.scheduled}` : `Deadline: ${hl.deadline}`,
              date: rawDate,
              priority: hl.priority,
              status: hl.status,
              tags: hl.tags,
              sourceFile: f.name,
              sourceFileId: f.id,
              isDone: hl.status === 'DONE' || hl.status === 'CANCELLED',
            });
          }
        }
      } else if (f.type === 'bean') {
        const parsedBean = parseBeancountContent(f.content, f.id, f.name);
        for (const b of parsedBean.balanceAssertions) {
          list.push({
            id: `cal-bal-${b.account}-${b.date}`,
            type: 'bean_balance',
            title: `Assert: ${b.account}`,
            subtitle: `$${b.amount} ${b.currency}`,
            date: b.date,
            status: 'CLEARED',
            tags: ['balance'],
            sourceFile: f.name,
            sourceFileId: f.id,
            amount: b.amount,
            currency: b.currency,
          });
        }
        for (const tx of parsedBean.transactions) {
          list.push({
            id: `cal-tx-${tx.id}`,
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

    return list;
  }, [files]);

  // Calendar cells generation for currentYear & currentMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday as 0, Sunday as 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      events: AgendaItem[];
    }> = [];

    // Preceding month trailing days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const events = allEvents.filter((e) => e.date === dateStr);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        events,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const events = allEvents.filter((e) => e.date === dateStr);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        events,
      });
    }

    // Following month leading days to complete full 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const events = allEvents.filter((e) => e.date === dateStr);
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        events,
      });
    }

    return cells;
  }, [currentYear, currentMonth, allEvents]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayStr) return [];
    return allEvents.filter((e) => e.date === selectedDayStr);
  }, [allEvents, selectedDayStr]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Calendar Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50 text-xs">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-purple-400" />
          <h2 className="font-semibold text-sm text-zinc-100">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:text-purple-300 text-zinc-400 rounded"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:text-purple-300 text-zinc-400 rounded"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b border-zinc-800/80 bg-zinc-950 text-center text-[11px] font-semibold text-zinc-400 py-1.5 font-mono">
        {weekDays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* Calendar Month Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6 gap-[1px] bg-zinc-850 p-[1px] overflow-y-auto">
        {calendarDays.map((cell, idx) => {
          const isSelected = selectedDayStr === cell.dateStr;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDayStr(cell.dateStr)}
              className={`min-h-[75px] md:min-h-[105px] p-1.5 flex flex-col justify-between transition-colors cursor-pointer ${
                cell.isCurrentMonth ? 'bg-zinc-950' : 'bg-zinc-950/40 text-zinc-400'
              } ${isSelected ? 'ring-2 ring-purple-500 bg-zinc-900/60' : 'hover:bg-zinc-900/50'}`}
            >
              {/* Day Cell Top: Date Number and Quick Add (+) */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span
                  className={`font-semibold ${
                    cell.isCurrentMonth ? 'text-zinc-200' : 'text-zinc-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenQuickCaptureWithDate) {
                      onOpenQuickCaptureWithDate(cell.dateStr);
                    }
                  }}
                  className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-purple-400"
                  title={`Add item on ${cell.dateStr}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Day Events Chips */}
              <div className="flex-1 space-y-1 overflow-hidden my-1">
                {cell.events.slice(0, 3).map((ev) => {
                  const isOrg = ev.type === 'org_task';
                  return (
                    <div
                      key={ev.id}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] font-mono leading-tight flex items-center gap-1 ${
                        isOrg
                          ? ev.isDone
                            ? 'bg-zinc-800 text-zinc-400 line-through'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                      }`}
                      title={`${ev.title} (${ev.sourceFile})`}
                    >
                      {isOrg ? (
                        <FileText className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                      ) : (
                        <DollarSign className="h-2.5 w-2.5 shrink-0 text-indigo-400" />
                      )}
                      <span className="truncate">{ev.title}</span>
                    </div>
                  );
                })}

                {cell.events.length > 3 && (
                  <span className="text-[9px] font-mono text-zinc-400 pl-1">
                    +{cell.events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Inspector Drawer / Modal */}
      {selectedDayStr && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-purple-400" />
            <span className="font-semibold text-zinc-100 font-mono">
              Events for {selectedDayStr}:
            </span>
            <span className="text-zinc-400 text-[11px]">
              ({selectedDayEvents.length} items scheduled)
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl">
            {selectedDayEvents.length === 0 ? (
              <span className="text-zinc-400 italic">No items scheduled on this day.</span>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onNavigateToFile(ev.sourceFile)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-200 cursor-pointer shrink-0 border border-zinc-700"
                >
                  {ev.type === 'org_task' ? (
                    <FileText className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <DollarSign className="h-3 w-3 text-indigo-400" />
                  )}
                  <span className="font-medium truncate max-w-xs">{ev.title}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-zinc-400" />
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenQuickCaptureWithDate && (
              <button
                onClick={() => onOpenQuickCaptureWithDate(selectedDayStr)}
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Schedule Here</span>
              </button>
            )}
            <button
              onClick={() => setSelectedDayStr(null)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
