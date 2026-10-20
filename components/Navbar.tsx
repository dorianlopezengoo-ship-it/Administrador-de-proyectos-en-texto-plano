'use client';

import {
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  CheckSquare,
  Cloud,
  Download,
  Plus,
  Search,
  BookOpen,
  Menu,
  Kanban,
  Settings,
  Scale,
  FolderOpen,
} from 'lucide-react';
import { ActiveAppView } from '@/types';

interface NavbarProps {
  activeView: ActiveAppView;
  setActiveView: (view: ActiveAppView) => void;
  onOpenQuickCapture: () => void;
  onOpenCommandPalette: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenManagePages?: () => void;
  onOpenManageAccounts?: () => void;
  onDownloadZip: () => void;
  toggleSidebar: () => void;
  googleConnected: boolean;
  userEmail: string | null;
  pendingChanges: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenQuickCapture,
  onOpenCommandPalette,
  onOpenSync,
  onOpenSettings,
  onOpenManagePages,
  onOpenManageAccounts,
  onDownloadZip,
  toggleSidebar,
  googleConnected,
  userEmail,
  pendingChanges,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-3 md:px-5 backdrop-blur">
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          onClick={() => setActiveView('notes')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 text-white font-bold text-sm shadow-md shadow-emerald-950/50">
            OB
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-1.5">
              OrgBean
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                v1.0
              </span>
            </span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 leading-none">
              OrgNote + BeanHub Studio
            </span>
          </div>
        </div>
      </div>

      {/* Center: Desktop Navigation tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800/80 text-xs font-medium">
        <button
          onClick={() => setActiveView('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'notes'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Org Notes</span>
        </button>

        <button
          onClick={() => setActiveView('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'ledger'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>BeanHub Ledger</span>
        </button>

        <button
          onClick={() => setActiveView('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'kanban'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Kanban className="h-3.5 w-3.5" />
          <span>Kanban</span>
        </button>

        <button
          onClick={() => setActiveView('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'calendar'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => setActiveView('balance-sheet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'balance-sheet' || activeView === 'income-statement' || activeView === 'trial-balance'
              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Statements</span>
        </button>

        <button
          onClick={() => setActiveView('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'reports'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Charts</span>
        </button>

        <button
          onClick={() => setActiveView('agenda')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'agenda'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <span>Agenda</span>
        </button>

        <button
          onClick={() => setActiveView('habits')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            activeView === 'habits'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span>Habits</span>
        </button>
      </nav>

      {/* Right: Quick Actions, Sync & Export */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Command Palette button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800 rounded-md transition-colors"
          title="Search anything (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] text-zinc-400">⌘K</span>
        </button>

        {/* Quick Capture button */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-100 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-md shadow-sm transition-all"
          title="Quick Capture note or transaction"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Capture</span>
        </button>

        {/* Manage Pages Hub button */}
        {onOpenManagePages && (
          <button
            onClick={onOpenManagePages}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-emerald-300 border border-zinc-800 rounded-md transition-colors"
            title="Manage Vault Pages, Templates & Notes"
          >
            <FolderOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Pages</span>
          </button>
        )}

        {/* Manage Accounts button */}
        {onOpenManageAccounts && (
          <button
            onClick={onOpenManageAccounts}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-indigo-300 border border-zinc-800 rounded-md transition-colors"
            title="Manage Beancount Chart of Accounts"
          >
            <Scale className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Accounts</span>
          </button>
        )}

        {/* Download Zip */}
        <button
          onClick={onDownloadZip}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
          title="Download workspace files as .zip"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Export ZIP</span>
        </button>

        {/* Google Drive Sync Indicator Button */}
        <button
          onClick={onOpenSync}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-all ${
            googleConnected
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/40'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          title="Google Drive sync & files manager"
        >
          <Cloud className={`h-3.5 w-3.5 ${googleConnected ? 'text-emerald-400' : 'text-zinc-400'}`} />
          <span className="hidden sm:inline">
            {googleConnected ? 'Drive Synced' : 'Connect Drive'}
          </span>
          {pendingChanges && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-800 transition-colors"
          title="Methodology & Syntax Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
