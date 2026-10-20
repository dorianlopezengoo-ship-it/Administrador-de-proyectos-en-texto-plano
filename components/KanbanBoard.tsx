'use client';

import React, { useState, useMemo } from 'react';
import {
  Kanban,
  Plus,
  Clock,
  Calendar,
  Tag,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Square,
} from 'lucide-react';
import { WorkspaceFile, OrgHeadline, OrgTaskStatus, AppSettings } from '@/types';
import { parseOrgContent, toggleStatusInContent, toggleChecklistInContent } from '@/lib/org-parser';
import { renderNewTaskContent } from '@/lib/settings';

interface KanbanBoardProps {
  files: WorkspaceFile[];
  settings: AppSettings;
  onUpdateContent: (fileId: string, newContent: string) => void;
  onNavigateToFile: (fileName: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  files,
  settings,
  onUpdateContent,
  onNavigateToFile,
}) => {
  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showAddModalForStatus, setShowAddModalForStatus] = useState<OrgTaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskFileId, setNewTaskFileId] = useState<string>('');

  const columns: OrgTaskStatus[] = useMemo(() => {
    return (
      settings.org.defaultTodoSequence || [
        'TODO',
        'DOING',
        'WAIT',
        'DONE',
        'CANCELLED',
      ]
    );
  }, [settings.org.defaultTodoSequence]);

  // Collect all task headlines from all .org files
  const allTasks = useMemo(() => {
    const list: Array<{ headline: OrgHeadline; file: WorkspaceFile }> = [];
    for (const f of files) {
      if (f.type === 'org') {
        const parsed = parseOrgContent(f.content, f.id, f.name);
        for (const hl of parsed.headlines) {
          if (hl.status) {
            list.push({ headline: hl, file: f });
          }
        }
      }
    }
    return list;
  }, [files]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(({ headline, file }) => {
      if (selectedFileFilter !== 'ALL' && file.id !== selectedFileFilter) return false;
      if (priorityFilter !== 'ALL' && headline.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = headline.title.toLowerCase().includes(q);
        const matchTags = headline.tags.some((t) => t.toLowerCase().includes(q));
        const matchFile = file.name.toLowerCase().includes(q);
        return matchTitle || matchTags || matchFile;
      }
      return true;
    });
  }, [allTasks, selectedFileFilter, priorityFilter, searchQuery]);

  // Group tasks by status column
  const tasksByStatus = useMemo(() => {
    const map: Record<OrgTaskStatus, Array<{ headline: OrgHeadline; file: WorkspaceFile }>> = {
      TODO: [],
      DOING: [],
      WAIT: [],
      DONE: [],
      CANCELLED: [],
    };

    for (const col of columns) {
      map[col] = [];
    }

    for (const item of filteredTasks) {
      if (item.headline.status && map[item.headline.status]) {
        map[item.headline.status].push(item);
      }
    }

    return map;
  }, [filteredTasks, columns]);

  // Move task to target status
  const handleMoveStatus = (
    headline: OrgHeadline,
    file: WorkspaceFile,
    targetStatus: OrgTaskStatus
  ) => {
    let updated = toggleStatusInContent(file.content, headline.lineStart, targetStatus);

    // If configured to add CLOSED: [date] timestamp when moving to DONE
    if (targetStatus === 'DONE' && settings.org.autoCloseTimestamp) {
      const today = new Date().toISOString().slice(0, 10);
      const lines = updated.split('\n');
      if (!lines[headline.lineStart + 1]?.includes('CLOSED:')) {
        lines.splice(headline.lineStart + 1, 0, `CLOSED: [${today}]`);
        updated = lines.join('\n');
      }
    }

    onUpdateContent(file.id, updated);
  };

  // Add task in specific column
  const handleCreateTaskInColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !showAddModalForStatus) return;

    const targetFile = files.find((f) => f.id === newTaskFileId) || files.find((f) => f.type === 'org');
    if (!targetFile) return;

    const taskText = renderNewTaskContent(settings, newTaskTitle.trim(), {
      status: showAddModalForStatus,
      priority: settings.org.defaultPriority !== 'none' ? settings.org.defaultPriority : undefined,
    });

    onUpdateContent(targetFile.id, targetFile.content.trimEnd() + '\n\n' + taskText);
    setNewTaskTitle('');
    setShowAddModalForStatus(null);
  };

  // Column header color mapping
  const getColHeaderStyle = (status: OrgTaskStatus) => {
    switch (status) {
      case 'TODO':
        return {
          bar: 'bg-amber-500',
          text: 'text-amber-400',
          badge: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
        };
      case 'DOING':
        return {
          bar: 'bg-sky-500',
          text: 'text-sky-400',
          badge: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
        };
      case 'WAIT':
        return {
          bar: 'bg-purple-500',
          text: 'text-purple-400',
          badge: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
        };
      case 'DONE':
        return {
          bar: 'bg-emerald-500',
          text: 'text-emerald-400',
          badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
        };
      case 'CANCELLED':
        return {
          bar: 'bg-zinc-600',
          text: 'text-zinc-400',
          badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        };
      default:
        return {
          bar: 'bg-zinc-500',
          text: 'text-zinc-300',
          badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50 text-xs">
        <div className="flex items-center gap-2">
          <Kanban className="h-4 w-4 text-emerald-400" />
          <h2 className="font-semibold text-zinc-100">Org-Mode Kanban Board</h2>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            ({allTasks.length} active tasks across files)
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-48 bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* File Filter */}
          <select
            value={selectedFileFilter}
            onChange={(e) => setSelectedFileFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Files</option>
            {files
              .filter((f) => f.type === 'org')
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="A">[#A] High</option>
            <option value="B">[#B] Medium</option>
            <option value="C">[#C] Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Horizontal Scrollable Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4">
        {columns.map((status) => {
          const style = getColHeaderStyle(status);
          const columnTasks = tasksByStatus[status] || [];
          const colIdx = columns.indexOf(status);

          return (
            <div
              key={status}
              className="w-72 sm:w-80 shrink-0 flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden max-h-full"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${style.bar}`} />
                  <span className="font-semibold text-xs tracking-wider uppercase text-zinc-200">
                    {status}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${style.badge}`}>
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewTaskFileId(files.find((f) => f.type === 'org')?.id || '');
                    setShowAddModalForStatus(status);
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                  title={`Add task to ${status}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Task Cards Column Body */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {columnTasks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border-2 border-dashed border-zinc-800/60 rounded-xl text-[11px] text-zinc-400">
                    No tasks in {status}
                  </div>
                ) : (
                  columnTasks.map(({ headline, file }) => {
                    const completedChecks = headline.checklists.filter((c) => c.completed).length;
                    const totalChecks = headline.checklists.length;
                    const checkPercent =
                      totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

                    return (
                      <div
                        key={headline.id}
                        className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 hover:shadow-md transition-all space-y-2 group"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs font-semibold text-zinc-100 leading-snug">
                            {headline.title}
                          </span>
                          {headline.priority && (
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                headline.priority === 'A'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : headline.priority === 'B'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              [#{headline.priority}]
                            </span>
                          )}
                        </div>

                        {/* Schedule & Deadline */}
                        {(headline.scheduled || headline.deadline) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                            {headline.scheduled && (
                              <span className="flex items-center gap-1 text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                                <Clock className="h-2.5 w-2.5" />
                                {headline.scheduled}
                              </span>
                            )}
                            {headline.deadline && (
                              <span className="flex items-center gap-1 text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">
                                <Calendar className="h-2.5 w-2.5" />
                                {headline.deadline}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Checklists progress */}
                        {totalChecks > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                              <span>Checklist</span>
                              <span>
                                {completedChecks}/{totalChecks} ({checkPercent}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${checkPercent}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                              />
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {headline.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {headline.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-850"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: File Link & Quick Transition Arrows */}
                        <div className="pt-1.5 border-t border-zinc-850 flex items-center justify-between text-[10px]">
                          <button
                            onClick={() => onNavigateToFile(file.name)}
                            className="text-zinc-400 hover:text-emerald-400 font-mono truncate mr-2"
                            title={`Open ${file.name}`}
                          >
                            [[{file.name}]]
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {colIdx > 0 && (
                              <button
                                onClick={() => handleMoveStatus(headline, file, columns[colIdx - 1])}
                                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                                title={`Move left to ${columns[colIdx - 1]}`}
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            )}

                            {colIdx < columns.length - 1 && (
                              <button
                                onClick={() => handleMoveStatus(headline, file, columns[colIdx + 1])}
                                className="p-1 rounded text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800"
                                title={`Advance to ${columns[colIdx + 1]}`}
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal for Specific Column */}
      {showAddModalForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl text-xs space-y-3.5">
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              Add Task to {showAddModalForStatus}
            </h3>

            <form onSubmit={handleCreateTaskInColumn} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Target Org File</label>
                <select
                  value={newTaskFileId}
                  onChange={(e) => setNewTaskFileId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {files
                    .filter((f) => f.type === 'org')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Task Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Conduct quarterly audit with accountant"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModalForStatus(null)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
