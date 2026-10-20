'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { WorkspaceFile, ActiveAppView, FileType } from '@/types';
import {
  subscribeWorkspace,
  getWorkspaceSnapshot,
  getWorkspaceServerSnapshot,
  updateWorkspaceStore,
  downloadFile,
  exportWorkspaceZip,
  downloadBlob,
} from '@/lib/storage';
import {
  subscribeSettings,
  getSettingsSnapshot,
  getSettingsServerSnapshot,
  saveSettings,
  renderNewNoteContent,
  renderNewLedgerContent,
} from '@/lib/settings';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavigation } from '@/components/MobileNavigation';
import { OrgNoteEditor } from '@/components/OrgNoteEditor';
import { BeancountEditor } from '@/components/BeancountEditor';
import { KanbanBoard } from '@/components/KanbanBoard';
import { CalendarView } from '@/components/CalendarView';
import { FinancialReports } from '@/components/FinancialReports';
import { AgendaCalendar } from '@/components/AgendaCalendar';
import { HabitTracker } from '@/components/HabitTracker';
import { SyncModal } from '@/components/SyncModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AccountManagerModal } from '@/components/AccountManagerModal';
import { PageManagerModal } from '@/components/PageManagerModal';
import { QuickCaptureModal } from '@/components/QuickCaptureModal';
import { CommandPalette } from '@/components/CommandPalette';
import { parseOrgContent } from '@/lib/org-parser';
import { parseBeancountContent } from '@/lib/beancount-parser';
import confetti from 'canvas-confetti';

export default function Home() {
  const files = useSyncExternalStore(
    subscribeWorkspace,
    getWorkspaceSnapshot,
    getWorkspaceServerSnapshot
  );

  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot
  );

  const [activeFileId, setActiveFileId] = useState<string>('file-org-dashboard');
  const [activeView, setActiveView] = useState<ActiveAppView>(() => settings.workflow.defaultView || 'notes');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [showPageManager, setShowPageManager] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [quickTxNoteLink, setQuickTxNoteLink] = useState<string>('');
  const [quickCaptureDate, setQuickCaptureDate] = useState<string | undefined>(undefined);

  // Google Drive Auth state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Save files on update
  const handleUpdateFiles = useCallback((newFiles: WorkspaceFile[]) => {
    updateWorkspaceStore(newFiles);
    setPendingChanges(true);
  }, []);

  // Update specific file content
  const handleUpdateContent = useCallback((fileId: string, newContent: string) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, content: newContent, updatedAt: 1760900000000 } : f
    );
    updateWorkspaceStore(updated);
    setPendingChanges(true);
  }, [files]);

  // Active file resolution
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Create new file based on customizable methodology templates
  const handleCreateFile = useCallback((name: string, type: FileType) => {
    const content = type === 'org'
      ? renderNewNoteContent(settings, name)
      : renderNewLedgerContent(settings, name);

    const newFile: WorkspaceFile = {
      id: `file-${Date.now()}-${name}`,
      name,
      path: type === 'org' ? `/notes/${name}` : `/accounting/${name}`,
      type,
      content,
      updatedAt: 1760900000000,
    };

    const updated = [...files, newFile];
    handleUpdateFiles(updated);
    setActiveFileId(newFile.id);
    setActiveView(type === 'org' ? 'notes' : 'ledger');
  }, [files, settings, handleUpdateFiles]);

  // Delete file
  const handleDeleteFile = useCallback((fileId: string) => {
    if (files.length <= 1) return;
    const confirmed = window.confirm('Are you sure you want to delete this file from your local workspace?');
    if (!confirmed) return;

    const remaining = files.filter((f) => f.id !== fileId);
    handleUpdateFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
      setActiveView(remaining[0].type === 'org' ? 'notes' : 'ledger');
    }
  }, [files, activeFileId, handleUpdateFiles]);

  // Download single file
  const handleDownloadFile = useCallback((file: WorkspaceFile) => {
    downloadFile(file);
  }, []);

  // Download entire workspace as zip
  const handleDownloadZip = useCallback(async () => {
    const blob = await exportWorkspaceZip(files);
    downloadBlob(blob, `orgbean-workspace-${new Date().toISOString().slice(0, 10)}.zip`);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch {}
  }, [files]);

  // Navigate to file by name (from wiki-links or backlinks)
  const handleNavigateToFile = useCallback((fileName: string) => {
    const cleanTarget = fileName.trim().toLowerCase();
    const matched = files.find(
      (f) =>
        f.name.toLowerCase() === cleanTarget ||
        f.name.replace(/\.[^/.]+$/, '').toLowerCase() === cleanTarget
    );

    if (matched) {
      setActiveFileId(matched.id);
      setActiveView(matched.type === 'org' ? 'notes' : 'ledger');
    } else {
      const shouldCreate = window.confirm(`File "${fileName}" does not exist yet. Create it now?`);
      if (shouldCreate) {
        const isBean = fileName.endsWith('.bean') || fileName.endsWith('.beancount');
        handleCreateFile(fileName, isBean ? 'bean' : 'org');
      }
    }
  }, [files, handleCreateFile]);

  // Collect all taxonomy tags across all files
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    for (const f of files) {
      if (f.type === 'org') {
        const parsed = parseOrgContent(f.content, f.id, f.name);
        for (const hl of parsed.headlines) {
          for (const t of hl.tags) tagsSet.add(t);
        }
      } else if (f.type === 'bean') {
        const parsed = parseBeancountContent(f.content, f.id, f.name);
        for (const tx of parsed.transactions) {
          for (const t of tx.tags) tagsSet.add(t);
        }
      }
    }
    return Array.from(tagsSet).sort();
  }, [files]);

  // Keyboard shortcut listener (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick tx with note
  const handleOpenQuickTxWithNote = (noteName: string) => {
    setQuickTxNoteLink(noteName);
    setQuickCaptureDate(undefined);
    setShowQuickCapture(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenQuickCapture={() => {
          setQuickTxNoteLink('');
          setQuickCaptureDate(undefined);
          setShowQuickCapture(true);
        }}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenSync={() => setShowSyncModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenManagePages={() => setShowPageManager(true)}
        onOpenManageAccounts={() => setShowAccountManager(true)}
        onDownloadZip={handleDownloadZip}
        toggleSidebar={() => setSidebarOpen((prev) => !prev)}
        googleConnected={googleConnected}
        userEmail={userEmail}
        pendingChanges={pendingChanges}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={(id) => {
            setActiveFileId(id);
            const selected = files.find((f) => f.id === id);
            if (selected) {
              setActiveView(selected.type === 'org' ? 'notes' : 'ledger');
            }
          }}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onDownloadFile={handleDownloadFile}
          onOpenManagePages={() => setShowPageManager(true)}
          onOpenManageAccounts={() => setShowAccountManager(true)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          allTags={allTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />

        {/* Content Pane */}
        <main className="flex-1 flex flex-col h-full overflow-hidden lg:pl-72 pb-14 lg:pb-0">
          {/* View 1: Org Notes Mode */}
          {activeView === 'notes' && (
            <>
              {activeFile && activeFile.type === 'org' ? (
                <OrgNoteEditor
                  file={activeFile}
                  onUpdateContent={handleUpdateContent}
                  onNavigateToFile={handleNavigateToFile}
                  allFiles={files}
                  onOpenQuickTxWithNote={handleOpenQuickTxWithNote}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <p className="text-sm">Please select or create an Org Note (.org) from the sidebar.</p>
                  <button
                    onClick={() => {
                      const firstOrg = files.find((f) => f.type === 'org');
                      if (firstOrg) setActiveFileId(firstOrg.id);
                    }}
                    className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                  >
                    Open First Org Note
                  </button>
                </div>
              )}
            </>
          )}

          {/* View 2: BeanHub Ledger Mode */}
          {activeView === 'ledger' && (
            <>
              {activeFile && activeFile.type === 'bean' ? (
                <BeancountEditor
                  file={activeFile}
                  onUpdateContent={handleUpdateContent}
                  onNavigateToFile={handleNavigateToFile}
                  allFiles={files}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <p className="text-sm">Please select or create a Beancount Ledger (.bean) from the sidebar.</p>
                  <button
                    onClick={() => {
                      const firstBean = files.find((f) => f.type === 'bean');
                      if (firstBean) setActiveFileId(firstBean.id);
                    }}
                    className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
                  >
                    Open First Ledger File
                  </button>
                </div>
              )}
            </>
          )}

          {/* View 3: Kanban View */}
          {activeView === 'kanban' && (
            <KanbanBoard
              files={files}
              settings={settings}
              onUpdateContent={handleUpdateContent}
              onNavigateToFile={handleNavigateToFile}
            />
          )}

          {/* View 4: Calendar Grid View */}
          {activeView === 'calendar' && (
            <CalendarView
              files={files}
              settings={settings}
              onNavigateToFile={handleNavigateToFile}
              onUpdateContent={handleUpdateContent}
              onOpenQuickCaptureWithDate={(dateStr) => {
                setQuickCaptureDate(dateStr);
                setQuickTxNoteLink('');
                setShowQuickCapture(true);
              }}
            />
          )}

          {/* View 5, 6, 7, 8: Financial Statements & Reports */}
          {(activeView === 'balance-sheet' ||
            activeView === 'income-statement' ||
            activeView === 'trial-balance' ||
            activeView === 'reports') && (
            <FinancialReports
              files={files}
              initialTab={
                activeView === 'reports'
                  ? 'charts'
                  : activeView === 'balance-sheet'
                  ? 'balance-sheet'
                  : activeView === 'income-statement'
                  ? 'income-statement'
                  : 'trial-balance'
              }
            />
          )}

          {/* View 9: Unified Agenda Timeline */}
          {activeView === 'agenda' && (
            <AgendaCalendar
              files={files}
              onNavigateToFile={handleNavigateToFile}
              onUpdateContent={handleUpdateContent}
            />
          )}

          {/* View 10: OrgNote Habits */}
          {activeView === 'habits' && (
            <HabitTracker
              files={files}
              onNavigateToFile={handleNavigateToFile}
              onUpdateContent={handleUpdateContent}
            />
          )}

          {/* View 11: Sync & Drive Hub */}
          {activeView === 'sync' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <SyncModal
                files={files}
                onUpdateFiles={handleUpdateFiles}
                isOpen={true}
                onClose={() => setActiveView('notes')}
                googleConnected={googleConnected}
                setGoogleConnected={setGoogleConnected}
                userEmail={userEmail}
                setUserEmail={setUserEmail}
              />
            </div>
          )}

          {/* View 12: Settings View */}
          {activeView === 'settings' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <SettingsModal
                settings={settings}
                onSaveSettings={saveSettings}
                isOpen={true}
                onClose={() => setActiveView('notes')}
                onOpenManagePages={() => setShowPageManager(true)}
                onOpenManageAccounts={() => setShowAccountManager(true)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenQuickCapture={() => {
          setQuickTxNoteLink('');
          setQuickCaptureDate(undefined);
          setShowQuickCapture(true);
        }}
        onOpenManagePages={() => setShowPageManager(true)}
        onOpenManageAccounts={() => setShowAccountManager(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        googleConnected={googleConnected}
      />

      {/* Modals */}
      <QuickCaptureModal
        files={files}
        settings={settings}
        onUpdateContent={handleUpdateContent}
        isOpen={showQuickCapture}
        onClose={() => {
          setShowQuickCapture(false);
          setQuickCaptureDate(undefined);
        }}
        preselectedNote={quickTxNoteLink}
        preselectedDate={quickCaptureDate}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        files={files}
        onSelectFile={setActiveFileId}
        setActiveView={setActiveView}
        onOpenQuickCapture={() => {
          setQuickTxNoteLink('');
          setQuickCaptureDate(undefined);
          setShowQuickCapture(true);
        }}
        onOpenSync={() => setShowSyncModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenManagePages={() => setShowPageManager(true)}
        onOpenManageAccounts={() => setShowAccountManager(true)}
        onDownloadZip={handleDownloadZip}
      />

      {showSyncModal && activeView !== 'sync' && (
        <SyncModal
          files={files}
          onUpdateFiles={handleUpdateFiles}
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          googleConnected={googleConnected}
          setGoogleConnected={setGoogleConnected}
          userEmail={userEmail}
          setUserEmail={setUserEmail}
        />
      )}

      {showSettingsModal && activeView !== 'settings' && (
        <SettingsModal
          settings={settings}
          onSaveSettings={saveSettings}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onOpenManagePages={() => setShowPageManager(true)}
          onOpenManageAccounts={() => setShowAccountManager(true)}
        />
      )}

      {showPageManager && (
        <PageManagerModal
          files={files}
          isOpen={showPageManager}
          onClose={() => setShowPageManager(false)}
          onUpdateFiles={handleUpdateFiles}
          onSelectFile={(id) => {
            setActiveFileId(id);
            const f = files.find((file) => file.id === id);
            if (f) setActiveView(f.type === 'org' ? 'notes' : 'ledger');
          }}
        />
      )}

      {showAccountManager && (
        <AccountManagerModal
          files={files}
          settings={settings}
          isOpen={showAccountManager}
          onClose={() => setShowAccountManager(false)}
          onUpdateFiles={handleUpdateFiles}
        />
      )}
    </div>
  );
}
