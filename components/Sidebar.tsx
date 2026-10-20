'use client';

import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Download,
  Folder,
  Tag,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  FilePlus2,
} from 'lucide-react';
import { WorkspaceFile, FileType } from '@/types';

interface SidebarProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, type: FileType) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadFile: (file: WorkspaceFile) => void;
  onOpenManagePages?: () => void;
  onOpenManageAccounts?: () => void;
  isOpen: boolean;
  onClose: () => void;
  allTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onDownloadFile,
  onOpenManagePages,
  onOpenManageAccounts,
  isOpen,
  onClose,
  allTags,
  selectedTag,
  onSelectTag,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FileType>('org');

  const [notesExpanded, setNotesExpanded] = useState(true);
  const [beanExpanded, setBeanExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const orgFiles = files.filter(
    (f) => f.type === 'org' && f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const beanFiles = files.filter(
    (f) => f.type === 'bean' && f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let finalName = newFileName.trim();
    if (newFileType === 'org' && !finalName.endsWith('.org')) {
      finalName += '.org';
    } else if (newFileType === 'bean' && !finalName.endsWith('.bean') && !finalName.endsWith('.beancount')) {
      finalName += '.bean';
    }

    onCreateFile(finalName, newFileType);
    setNewFileName('');
    setShowNewModal(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top search & new file action */}
        <div className="p-3 border-b border-zinc-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Workspace Files
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 transition-colors"
                title="Create new file"
              >
                <Plus className="h-3 w-3" />
                <span>New</span>
              </button>
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {onOpenManagePages && (
              <button
                type="button"
                onClick={onOpenManagePages}
                className="flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium transition-colors"
                title="Manage all vault pages"
              >
                <FileText className="h-3 w-3 text-emerald-400" />
                <span>Pages Hub</span>
              </button>
            )}
            {onOpenManageAccounts && (
              <button
                type="button"
                onClick={onOpenManageAccounts}
                className="flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium transition-colors"
                title="Manage Beancount accounts"
              >
                <DollarSign className="h-3 w-3 text-indigo-400" />
                <span>Accounts</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable file list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs">
          {/* Org Files Group */}
          <div>
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-zinc-200 font-medium tracking-wide uppercase text-[11px]"
            >
              <span className="flex items-center gap-1.5">
                {notesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Folder className="h-3.5 w-3.5 text-emerald-400" />
                <span>Org Notes ({orgFiles.length})</span>
              </span>
            </button>

            {notesExpanded && (
              <div className="mt-1 space-y-0.5 pl-2">
                {orgFiles.map((file) => {
                  const isActive = file.id === activeFileId;
                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        onSelectFile(file.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-emerald-950/50 text-emerald-300 font-medium border border-emerald-800/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                        <span className="truncate">{file.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFile(file);
                          }}
                          className="p-1 hover:text-emerald-400"
                          title="Download file"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        {files.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(file.id);
                            }}
                            className="p-1 hover:text-rose-400"
                            title="Delete file"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Beancount Ledger Files Group */}
          <div>
            <button
              onClick={() => setBeanExpanded(!beanExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-zinc-200 font-medium tracking-wide uppercase text-[11px]"
            >
              <span className="flex items-center gap-1.5">
                {beanExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Folder className="h-3.5 w-3.5 text-indigo-400" />
                <span>BeanHub Ledgers ({beanFiles.length})</span>
              </span>
            </button>

            {beanExpanded && (
              <div className="mt-1 space-y-0.5 pl-2">
                {beanFiles.map((file) => {
                  const isActive = file.id === activeFileId;
                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        onSelectFile(file.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-indigo-950/50 text-indigo-300 font-medium border border-indigo-800/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <DollarSign className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                        <span className="truncate">{file.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFile(file);
                          }}
                          className="p-1 hover:text-indigo-400"
                          title="Download file"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        {files.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(file.id);
                            }}
                            className="p-1 hover:text-rose-400"
                            title="Delete file"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags & Taxonomy */}
          {allTags.length > 0 && (
            <div>
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="w-full flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-zinc-200 font-medium tracking-wide uppercase text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  {tagsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <Tag className="h-3.5 w-3.5 text-amber-400" />
                  <span>Taxonomy Tags ({allTags.length})</span>
                </span>
              </button>

              {tagsExpanded && (
                <div className="mt-1 flex flex-wrap gap-1 px-2">
                  <button
                    onClick={() => onSelectTag(null)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      selectedTag === null
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onSelectTag(tag === selectedTag ? null : tag)}
                      className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                        selectedTag === tag
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Workspace Summary */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>{files.length} files in vault</span>
          <span className="text-emerald-400 font-mono">Offline-ready</span>
        </div>
      </aside>

      {/* New File Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FilePlus2 className="h-4 w-4 text-emerald-400" />
                Create New File
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  File Format & Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFileType('org')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      newFileType === 'org'
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Org-Mode (.org)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFileType('bean')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      newFileType === 'bean'
                        ? 'bg-indigo-950/60 border-indigo-600 text-indigo-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Beancount (.bean)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  placeholder={newFileType === 'org' ? 'weekly-review.org' : '2026-investments.bean'}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFileName.trim()}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
