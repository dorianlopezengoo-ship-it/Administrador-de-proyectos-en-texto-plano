'use client';

import React, { useState, useMemo } from 'react';
import {
  Code,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckSquare,
  Square,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import { WorkspaceFile, OrgHeadline, OrgTaskStatus } from '@/types';
import {
  parseOrgContent,
  getNextTaskStatus,
  toggleStatusInContent,
  toggleChecklistInContent,
} from '@/lib/org-parser';

interface OrgNoteEditorProps {
  file: WorkspaceFile;
  onUpdateContent: (fileId: string, newContent: string) => void;
  onNavigateToFile: (fileName: string) => void;
  allFiles: WorkspaceFile[];
  onOpenQuickTxWithNote?: (noteName: string) => void;
}

export const OrgNoteEditor: React.FC<OrgNoteEditorProps> = ({
  file,
  onUpdateContent,
  onNavigateToFile,
  allFiles,
  onOpenQuickTxWithNote,
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'source' | 'split'>('rendered');
  const [collapsedHeadlines, setCollapsedHeadlines] = useState<Record<string, boolean>>({});
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Parse current file content
  const parsed = useMemo(() => {
    return parseOrgContent(file.content, file.id, file.name);
  }, [file.content, file.id, file.name]);

  // Compute backlinks across all other files that reference this note
  const backlinks = useMemo(() => {
    const list: Array<{ fileName: string; fileId: string; type: 'org' | 'bean'; excerpt: string }> = [];
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    for (const f of allFiles) {
      if (f.id === file.id) continue;
      if (
        f.content.includes(`[[${file.name}]]`) ||
        f.content.includes(`[[${baseName}]]`) ||
        f.content.includes(`note: [[${file.name}]]`) ||
        f.content.includes(`note: [[${baseName}]]`)
      ) {
        // Find matching line excerpt
        const lines = f.content.split('\n');
        const line = lines.find(
          (l) => l.includes(file.name) || l.includes(`[[${baseName}]]`)
        );
        list.push({
          fileName: f.name,
          fileId: f.id,
          type: f.type,
          excerpt: line?.trim() || 'Referenced in document',
        });
      }
    }
    return list;
  }, [allFiles, file.id, file.name]);

  const toggleCollapse = (id: string) => {
    setCollapsedHeadlines((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusCycle = (headline: OrgHeadline) => {
    const next = getNextTaskStatus(headline.status);
    const updated = toggleStatusInContent(file.content, headline.lineStart, next);
    onUpdateContent(file.id, updated);
  };

  const handleChecklistToggle = (lineNumber: number) => {
    const updated = toggleChecklistInContent(file.content, lineNumber);
    onUpdateContent(file.id, updated);
  };

  const insertSnippet = (snippet: string) => {
    const newContent = file.content + '\n' + snippet;
    onUpdateContent(file.id, newContent);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Status badge styling
  const getStatusBadge = (status?: OrgTaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      case 'DOING':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30';
      case 'WAIT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30';
      case 'DONE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
      case 'CANCELLED':
        return 'bg-zinc-700/40 text-zinc-400 border-zinc-700 hover:bg-zinc-700/60 line-through';
      default:
        return 'hidden';
    }
  };

  // Priority badge styling
  const getPriorityBadge = (priority?: 'A' | 'B' | 'C') => {
    switch (priority) {
      case 'A':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'B':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'C':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Editor Sub-Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {file.name}
          </span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            ({parsed.headlines.length} headlines, {parsed.embeddedBeancountBlocks.length} ledger blocks)
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setViewMode('rendered')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'rendered'
                ? 'bg-zinc-800 text-emerald-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Visual Org Mode"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Visual</span>
          </button>
          <button
            onClick={() => setViewMode('source')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'source'
                ? 'bg-zinc-800 text-emerald-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Raw Plain-Text Source"
          >
            <Code className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Source</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'split'
                ? 'bg-zinc-800 text-emerald-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Split Side-by-Side"
          >
            <span className="font-mono text-xs">| |</span>
            <span>Split</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Rendered Visual View */}
        {(viewMode === 'rendered' || viewMode === 'split') && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
            {parsed.headlines.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                <p>This Org note is currently empty.</p>
                <button
                  onClick={() =>
                    onUpdateContent(
                      file.id,
                      `* My New Project\n** TODO First task\nSCHEDULED: <2026-10-20>\n- [ ] Action item 1\n`
                    )
                  }
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                >
                  Insert Sample Headline
                </button>
              </div>
            ) : (
              parsed.headlines.map((hl) => {
                const isCollapsed = collapsedHeadlines[hl.id] || false;
                const completedChecks = hl.checklists.filter((c) => c.completed).length;
                const totalChecks = hl.checklists.length;
                const checkPercent =
                  totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

                // Level indentation & font size
                const levelPadding = (hl.level - 1) * 16;
                const levelClasses =
                  hl.level === 1
                    ? 'text-lg font-bold text-zinc-100 border-b border-zinc-800/80 pb-1.5'
                    : hl.level === 2
                    ? 'text-base font-semibold text-zinc-200'
                    : 'text-sm font-medium text-zinc-300';

                return (
                  <div
                    key={hl.id}
                    style={{ paddingLeft: `${levelPadding}px` }}
                    className="group rounded-lg p-2 hover:bg-zinc-900/30 transition-colors"
                  >
                    {/* Headline Header Bar */}
                    <div className="flex items-start gap-2">
                      {/* Collapse toggle */}
                      <button
                        onClick={() => toggleCollapse(hl.id)}
                        className="mt-1 p-0.5 text-zinc-400 hover:text-zinc-200 rounded"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {/* Stars level indicator */}
                      <span className="mt-1 text-xs font-mono text-emerald-500/70 select-none">
                        {'*'.repeat(hl.level)}
                      </span>

                      {/* Status toggle pill */}
                      {hl.status && (
                        <button
                          onClick={() => handleStatusCycle(hl)}
                          className={`mt-0.5 text-xs font-mono font-semibold px-2 py-0.5 rounded border transition-colors ${getStatusBadge(
                            hl.status
                          )}`}
                          title="Click to cycle status: TODO -> DOING -> WAIT -> DONE -> CANCELLED"
                        >
                          {hl.status}
                        </button>
                      )}

                      {/* Add Status button if none */}
                      {!hl.status && (
                        <button
                          onClick={() => handleStatusCycle(hl)}
                          className="mt-0.5 opacity-0 group-hover:opacity-100 text-[10px] font-mono px-1.5 py-0.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded border border-zinc-800 transition-all"
                          title="Add TODO status"
                        >
                          +TODO
                        </button>
                      )}

                      {/* Priority pill */}
                      {hl.priority && (
                        <span
                          className={`mt-0.5 text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(
                            hl.priority
                          )}`}
                        >
                          [#{hl.priority}]
                        </span>
                      )}

                      {/* Headline Title */}
                      <div className="flex-1">
                        <span className={`${levelClasses} leading-tight`}>{hl.title}</span>

                        {/* Checklist progress badge */}
                        {totalChecks > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                            [{completedChecks}/{totalChecks}] {checkPercent}%
                          </span>
                        )}

                        {/* Tags */}
                        {hl.tags.length > 0 && (
                          <div className="inline-flex items-center gap-1 ml-2">
                            {hl.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full"
                              >
                                :{tag}:
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Headline Body & Details (if not collapsed) */}
                    {!isCollapsed && (
                      <div className="mt-2 pl-7 space-y-2.5 text-xs text-zinc-300">
                        {/* Timestamps: Scheduled & Deadline */}
                        {(hl.scheduled || hl.deadline || hl.closed) && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                            {hl.scheduled && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                                <Clock className="h-3 w-3" />
                                <span>SCHEDULED: {hl.scheduled}</span>
                              </span>
                            )}
                            {hl.deadline && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                                <Calendar className="h-3 w-3" />
                                <span>DEADLINE: {hl.deadline}</span>
                              </span>
                            )}
                            {hl.closed && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span>CLOSED: {hl.closed}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Habit Tracker Streak Component */}
                        {hl.isHabit && hl.habitStreak && (
                          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1 font-semibold text-rose-400">
                                <Flame className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                                Habit Streak (Last 14 Days)
                              </span>
                              <span className="font-mono text-emerald-400">
                                {hl.habitStreak.filter(Boolean).length} / 14 days completed
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1">
                              {hl.habitStreak.map((completed, sIdx) => (
                                <div
                                  key={sIdx}
                                  className={`h-5 flex-1 rounded flex items-center justify-center text-[10px] font-mono transition-transform hover:scale-105 cursor-pointer ${
                                    completed
                                      ? 'bg-emerald-600/80 text-white shadow-xs shadow-emerald-900'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                  title={`Day -${13 - sIdx}: ${completed ? 'Completed' : 'Missed'}`}
                                >
                                  {completed ? '✓' : '·'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Checklists */}
                        {hl.checklists.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {hl.checklists.map((chk, cIdx) => (
                              <div
                                key={cIdx}
                                onClick={() => handleChecklistToggle(chk.line)}
                                className="flex items-center gap-2 cursor-pointer select-none group/chk hover:text-zinc-100"
                              >
                                {chk.completed ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-zinc-400 group-hover/chk:text-zinc-200 shrink-0" />
                                )}
                                <span
                                  className={`${
                                    chk.completed ? 'line-through text-zinc-400' : 'text-zinc-200'
                                  }`}
                                >
                                  {chk.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Body text rendering (wiki-link clicks) */}
                        {hl.body && (
                          <div className="whitespace-pre-wrap leading-relaxed text-zinc-300 font-sans">
                            {renderTextWithWikiLinks(hl.body, onNavigateToFile)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Embedded Beancount Blocks Section in this Org note */}
            {parsed.embeddedBeancountBlocks.length > 0 && (
              <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-400" />
                    Embedded Beancount Ledgers ({parsed.embeddedBeancountBlocks.length})
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Plain-text accounting blocks in this Org note
                  </span>
                </div>

                {parsed.embeddedBeancountBlocks.map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className="rounded-lg border border-indigo-900/50 bg-indigo-950/20 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-indigo-950/60 text-xs">
                      <span className="font-mono text-indigo-300 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        #+BEGIN_SRC beancount (Lines {block.lineStart + 1}–{block.lineEnd + 1})
                      </span>
                      <button
                        onClick={() => handleCopyCode(block.code, `block-${bIdx}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 bg-zinc-800 text-[11px]"
                      >
                        {copiedSnippet === `block-${bIdx}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                      {block.code}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Backlinks & Cross-References Drawer */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                  Backlinks & Connected References ({backlinks.length})
                </span>
                {onOpenQuickTxWithNote && (
                  <button
                    onClick={() => onOpenQuickTxWithNote(file.name)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-300 hover:text-indigo-100 bg-indigo-950/40 border border-indigo-800/50 rounded transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Link New Transaction</span>
                  </button>
                )}
              </div>

              {backlinks.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">
                  No other notes or transactions reference [[{file.name}]] yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {backlinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => onNavigateToFile(link.fileName)}
                      className="p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-850 border border-zinc-800 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
                        <span className="flex items-center gap-1">
                          {link.type === 'org' ? (
                            <Tag className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <DollarSign className="h-3 w-3 text-indigo-400" />
                          )}
                          {link.fileName}
                        </span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-1 font-mono">
                        {link.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Source Plain-Text Editor */}
        {(viewMode === 'source' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
            {/* Quick helper snippet insertion bar */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/80 text-[11px] overflow-x-auto">
              <span className="text-zinc-400 mr-1 shrink-0">Insert:</span>
              <button
                onClick={() => insertSnippet('* TODO New Task :focus:\nSCHEDULED: <2026-10-20>\n')}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
              >
                + TODO Task
              </button>
              <button
                onClick={() => insertSnippet('- [ ] New checklist item\n')}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
              >
                + [ ] Checkbox
              </button>
              <button
                onClick={() =>
                  insertSnippet(
                    '#+BEGIN_SRC beancount\n2026-10-20 * "Payee" "Narration"\n  Assets:Bank:Checking        -50.00 USD\n  Expenses:Food:Dining         50.00 USD\n#+END_SRC\n'
                  )
                }
                className="px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 shrink-0"
              >
                + Beancount Block
              </button>
              <button
                onClick={() => insertSnippet(':PROPERTIES:\n:STYLE: habit\n:END:\n')}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
              >
                + Habit
              </button>
              <button
                onClick={() => insertSnippet('[[dashboard.org]]')}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
              >
                + [[WikiLink]]
              </button>
            </div>

            <textarea
              value={file.content}
              onChange={(e) => onUpdateContent(file.id, e.target.value)}
              placeholder="Type Org-mode notes here... (e.g. * Heading 1, ** TODO Task [#A])"
              spellCheck={false}
              className="flex-1 w-full bg-zinc-950 text-zinc-200 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to render wiki links as clickable buttons
function renderTextWithWikiLinks(
  text: string,
  onNavigateToFile: (fileName: string) => void
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[\[([^\]]+)\](?:\[([^\]]+)\])?\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const target = match[1];
    const label = match[2] || target;

    parts.push(
      <button
        key={`wiki-${match.index}`}
        onClick={(e) => {
          e.stopPropagation();
          onNavigateToFile(target);
        }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 font-mono text-[11px] border border-emerald-800/50 underline transition-colors cursor-pointer"
        title={`Navigate to ${target}`}
      >
        <span>{label}</span>
      </button>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
