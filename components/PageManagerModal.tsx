'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Copy,
  Edit3,
  X,
  Search,
  BookOpen,
  Calendar,
  CheckCircle,
  FilePlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { WorkspaceFile, FileType } from '@/types';
import { parseOrgContent } from '@/lib/org-parser';
import { parseBeancountContent } from '@/lib/beancount-parser';
import {
  PAGE_TEMPLATES,
  PageTemplate,
  renamePageAcrossVault,
  duplicatePageInVault,
} from '@/lib/page-manager';

interface PageManagerModalProps {
  files: WorkspaceFile[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateFiles: (newFiles: WorkspaceFile[]) => void;
  onSelectFile: (fileId: string) => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  files,
  isOpen,
  onClose,
  onUpdateFiles,
  onSelectFile,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'org' | 'bean'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create page form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('daily-journal');
  const [newPageName, setNewPageName] = useState('');

  // Rename modal
  const [renameState, setRenameState] = useState<{
    isOpen: boolean;
    fileId: string;
    currentName: string;
    newName: string;
  }>({
    isOpen: false,
    fileId: '',
    currentName: '',
    newName: '',
  });

  // Calculate metadata for each page
  const pagesData = useMemo(() => {
    return files.map((file) => {
      let headlineCount = 0;
      let todoCount = 0;
      let beancountBlocks = 0;
      let txCount = 0;

      if (file.type === 'org') {
        const parsed = parseOrgContent(file.content, file.id, file.name);
        headlineCount = parsed.headlines.length;
        todoCount = parsed.headlines.filter((h) => h.status === 'TODO' || h.status === 'DOING').length;
        beancountBlocks = parsed.embeddedBeancountBlocks.length;
      } else {
        const parsed = parseBeancountContent(file.content, file.id, file.name);
        txCount = parsed.transactions.length;
      }

      // Calculate backlinks across other files
      let backlinkCount = 0;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      for (const other of files) {
        if (other.id !== file.id && (other.content.includes(`[[${file.name}]]`) || other.content.includes(`[[${baseName}]]`))) {
          backlinkCount++;
        }
      }

      const sizeKb = (new Blob([file.content]).size / 1024).toFixed(1);

      return {
        file,
        headlineCount,
        todoCount,
        beancountBlocks,
        txCount,
        backlinkCount,
        sizeKb,
      };
    });
  }, [files]);

  // Filter pages
  const filteredPages = useMemo(() => {
    return pagesData.filter(({ file }) => {
      if (selectedFilter !== 'all' && file.type !== selectedFilter) return false;
      if (searchQuery) {
        return file.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [pagesData, selectedFilter, searchQuery]);

  // Create page handler
  const handleCreateFromTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;

    const template = PAGE_TEMPLATES.find((t) => t.id === selectedTemplateId) || PAGE_TEMPLATES[0];
    let finalName = newPageName.trim();
    if (!finalName.endsWith(template.defaultExtension)) {
      finalName += template.defaultExtension;
    }

    const content = template.generateContent(
      finalName.replace(/\.[^/.]+$/, ''),
      'User'
    );

    const newFile: WorkspaceFile = {
      id: `page-${Date.now()}-${finalName}`,
      name: finalName,
      path: template.type === 'org' ? `/notes/${finalName}` : `/accounting/${finalName}`,
      type: template.type,
      content,
      updatedAt: Date.now(),
    };

    onUpdateFiles([...files, newFile]);
    onSelectFile(newFile.id);
    setNewPageName('');
    setShowCreateModal(false);
    onClose();
  };

  // Duplicate page handler
  const handleDuplicate = (fileId: string) => {
    const updated = duplicatePageInVault(files, fileId);
    onUpdateFiles(updated);
  };

  // Rename page handler
  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameState.newName.trim() || renameState.newName === renameState.currentName) return;

    let finalName = renameState.newName.trim();
    const isOrg = renameState.currentName.endsWith('.org');
    if (isOrg && !finalName.endsWith('.org')) finalName += '.org';
    if (!isOrg && !finalName.endsWith('.bean') && !finalName.endsWith('.beancount')) finalName += '.bean';

    const updated = renamePageAcrossVault(files, renameState.fileId, finalName);
    onUpdateFiles(updated);
    setRenameState({ isOpen: false, fileId: '', currentName: '', newName: '' });
  };

  // Delete page handler
  const handleDelete = (file: WorkspaceFile) => {
    if (files.length <= 1) {
      alert('You must have at least one file in your vault.');
      return;
    }
    const confirmed = window.confirm(
      `Delete "${file.name}"? This will permanently remove this page from your local workspace.`
    );
    if (!confirmed) return;

    const remaining = files.filter((f) => f.id !== file.id);
    onUpdateFiles(remaining);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Pages & Documents Manager
              </h3>
              <p className="text-[11px] text-zinc-400">
                Create with methodology templates, refactor wiki-links, duplicate, and manage vault pages
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-56 bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-zinc-800 text-emerald-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Pages ({files.length})
              </button>
              <button
                onClick={() => setSelectedFilter('org')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedFilter === 'org'
                    ? 'bg-zinc-800 text-emerald-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Org Notes ({files.filter((f) => f.type === 'org').length})
              </button>
              <button
                onClick={() => setSelectedFilter('bean')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedFilter === 'bean'
                    ? 'bg-zinc-800 text-indigo-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                BeanHub Ledgers ({files.filter((f) => f.type === 'bean').length})
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Page from Template</span>
          </button>
        </div>

        {/* Pages Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPages.map(({ file, headlineCount, todoCount, beancountBlocks, txCount, backlinkCount, sizeKb }) => {
            const isOrg = file.type === 'org';

            return (
              <div
                key={file.id}
                className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 flex flex-col justify-between gap-3 text-xs transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {isOrg ? (
                        <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-indigo-400 shrink-0" />
                      )}
                      <span className="font-semibold text-zinc-100 font-mono truncate">
                        {file.name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                      {sizeKb} KB
                    </span>
                  </div>

                  {/* Metadata statistics */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400">
                    {isOrg ? (
                      <>
                        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                          {headlineCount} headlines
                        </span>
                        <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 text-amber-300">
                          {todoCount} pending TODOs
                        </span>
                        {beancountBlocks > 0 && (
                          <span className="bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">
                            {beancountBlocks} beancount blocks
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 text-indigo-300">
                        {txCount} transactions
                      </span>
                    )}

                    {backlinkCount > 0 && (
                      <span className="bg-emerald-950/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/40">
                        {backlinkCount} backlinks
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      onSelectFile(file.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <span>Open in Editor</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>

                  <div className="flex items-center gap-1 text-zinc-400">
                    {/* Rename */}
                    <button
                      onClick={() =>
                        setRenameState({
                          isOpen: true,
                          fileId: file.id,
                          currentName: file.name,
                          newName: file.name,
                        })
                      }
                      className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200"
                      title="Rename page & refactor wiki-links"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(file.id)}
                      className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200"
                      title="Duplicate page"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete */}
                    {files.length > 1 && (
                      <button
                        onClick={() => handleDelete(file)}
                        className="p-1.5 rounded hover:bg-zinc-800 hover:text-rose-400"
                        title="Delete page"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Page Modal Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <FilePlus className="h-4 w-4 text-emerald-400" />
                Create New Page / Note
              </h4>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFromTemplate} className="space-y-3.5">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Page Title / Filename
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4-Strategy-Roadmap"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-2">
                  Choose Methodology Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PAGE_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-medium mb-1">
                          {tmpl.type === 'org' ? (
                            <FileText className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <DollarSign className="h-3.5 w-3.5 text-indigo-400" />
                          )}
                          <span>{tmpl.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Page Modal */}
      {renameState.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-3.5 text-xs">
            <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-emerald-400" />
              Rename Page & Refactor Wiki-Links
            </h4>
            <p className="text-zinc-400">
              Renaming will automatically update all <code>[[{renameState.currentName}]]</code> links across all notes and ledger files!
            </p>

            <form onSubmit={handleRename} className="space-y-3">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">New Filename</label>
                <input
                  type="text"
                  value={renameState.newName}
                  onChange={(e) =>
                    setRenameState((prev) => ({ ...prev, newName: e.target.value }))
                  }
                  required
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameState({ isOpen: false, fileId: '', currentName: '', newName: '' })}
                  className="px-3 py-1.5 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
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
