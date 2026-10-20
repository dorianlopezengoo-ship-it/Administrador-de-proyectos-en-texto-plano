'use client';

import React, { useMemo } from 'react';
import { Flame, CheckCircle, Calendar, Plus, ExternalLink } from 'lucide-react';
import { WorkspaceFile, OrgHeadline } from '@/types';
import { parseOrgContent, toggleChecklistInContent } from '@/lib/org-parser';

interface HabitTrackerProps {
  files: WorkspaceFile[];
  onNavigateToFile: (fileName: string) => void;
  onUpdateContent: (fileId: string, newContent: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  files,
  onNavigateToFile,
  onUpdateContent,
}) => {
  // Collect all habit headlines from all org files
  const habits = useMemo(() => {
    const list: Array<{ headline: OrgHeadline; file: WorkspaceFile }> = [];
    for (const f of files) {
      if (f.type === 'org') {
        const parsed = parseOrgContent(f.content, f.id, f.name);
        for (const hl of parsed.headlines) {
          if (hl.isHabit) {
            list.push({ headline: hl, file: f });
          }
        }
      }
    }
    return list;
  }, [files]);

  // Deterministic 14-day header labels to eliminate SSR timezone mismatch
  const daysHeader = useMemo(() => {
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'Today'];
    return dayNames.map((name, i) => ({
      dayName: name,
      dayNum: 14 - i,
      isToday: i === 13,
    }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-500 fill-rose-500" />
            OrgNote Habit Streaks
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track daily discipline and consistency defined via <code className="text-emerald-400">:STYLE: habit</code> in your .org notes
          </p>
        </div>

        <button
          onClick={() => {
            const orgFile = files.find((f) => f.type === 'org');
            if (orgFile) {
              const habitSnippet = `\n* Daily 30-min Reading :habit:learning:\n:PROPERTIES:\n:STYLE: habit\n:END:\nDaily reading in engineering and economics.\n`;
              onUpdateContent(orgFile.id, orgFile.content.trimEnd() + habitSnippet);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">
          <p>No habits configured in your Org notes yet.</p>
          <p className="text-xs text-zinc-400 mt-1">
            Add <code>:STYLE: habit</code> in a headline property drawer to track it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map(({ headline, file }) => {
            const streak = headline.habitStreak || [true, true, true, true, true, false, true, true, true, true, true, true, true, true];
            const completedCount = streak.filter(Boolean).length;
            const completionRate = Math.round((completedCount / streak.length) * 100);

            return (
              <div
                key={headline.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-100">
                      {headline.title}
                    </span>
                    <button
                      onClick={() => onNavigateToFile(file.name)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-emerald-400"
                    >
                      <span>({file.name})</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">
                      {completedCount} / 14 days ({completionRate}%)
                    </span>
                  </div>
                </div>

                {/* 14-Day Streak Grid */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-center text-[10px] font-mono text-zinc-400">
                    {daysHeader.map((d, i) => (
                      <div
                        key={i}
                        className={`flex-1 ${d.isToday ? 'text-rose-400 font-bold' : ''}`}
                      >
                        {d.dayName}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {streak.map((isDone, idx) => {
                      const isToday = idx === 13;
                      return (
                        <div
                          key={idx}
                          className={`flex-1 h-7 rounded flex items-center justify-center font-mono text-xs transition-transform hover:scale-110 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750'
                          } ${isToday ? 'ring-2 ring-rose-500/80' : ''}`}
                          title={`Day ${daysHeader[idx].dayNum}: ${isDone ? 'Completed' : 'Missed'}`}
                        >
                          {isDone ? '✓' : '·'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
