'use client';

import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Cloud,
  Plus,
  Kanban,
  Settings,
  MoreHorizontal,
  FolderOpen,
  Scale,
  CheckSquare,
  X,
  BookOpen,
} from 'lucide-react';
import { ActiveAppView } from '@/types';

interface MobileNavigationProps {
  activeView: ActiveAppView;
  setActiveView: (view: ActiveAppView) => void;
  onOpenQuickCapture: () => void;
  onOpenManagePages?: () => void;
  onOpenManageAccounts?: () => void;
  onOpenSettings?: () => void;
  googleConnected: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  setActiveView,
  onOpenQuickCapture,
  onOpenManagePages,
  onOpenManageAccounts,
  onOpenSettings,
  googleConnected,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur px-2 py-1.5 flex items-center justify-around">
      {/* Notes tab */}
      <button
        onClick={() => setActiveView('notes')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
          activeView === 'notes' ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <FileText className="h-4.5 w-4.5" />
        <span className="text-[9px] font-medium">Notes</span>
      </button>

      {/* Ledger tab */}
      <button
        onClick={() => setActiveView('ledger')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
          activeView === 'ledger' ? 'text-indigo-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <DollarSign className="h-4.5 w-4.5" />
        <span className="text-[9px] font-medium">Ledger</span>
      </button>

      {/* Kanban tab */}
      <button
        onClick={() => setActiveView('kanban')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
          activeView === 'kanban' ? 'text-teal-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Kanban className="h-4.5 w-4.5" />
        <span className="text-[9px] font-medium">Kanban</span>
      </button>

      {/* Center Quick Capture Floating Action */}
      <button
        onClick={onOpenQuickCapture}
        className="flex items-center justify-center -mt-4 h-11 w-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/70 border-2 border-zinc-900 active:scale-95 transition-transform shrink-0"
        title="Quick Capture"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Calendar tab */}
      <button
        onClick={() => setActiveView('calendar')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
          activeView === 'calendar' ? 'text-purple-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Calendar className="h-4.5 w-4.5" />
        <span className="text-[9px] font-medium">Calendar</span>
      </button>

      {/* Reports tab */}
      <button
        onClick={() => setActiveView('reports')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
          activeView === 'reports' || activeView === 'balance-sheet' ? 'text-amber-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <BarChart3 className="h-4.5 w-4.5" />
        <span className="text-[9px] font-medium">Reports</span>
      </button>

      {/* More / Hub button */}
      <button
        onClick={() => setShowMoreMenu((prev) => !prev)}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
          showMoreMenu ? 'text-teal-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <MoreHorizontal className="h-4.5 w-4.5" />
        <span className="text-[9px] font-medium">More</span>
      </button>

      {/* More Hub Popover Menu */}
      {showMoreMenu && (
        <>
          <div
            onClick={() => setShowMoreMenu(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          />
          <div className="fixed bottom-14 left-2 right-2 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 shadow-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 px-1">
              <span className="font-semibold text-zinc-200 text-xs">OrgBean Studio Tools</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="text-zinc-400 hover:text-zinc-200 p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {onOpenManagePages && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenManagePages();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-left text-zinc-200"
                >
                  <FolderOpen className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">Pages Hub</div>
                    <div className="text-[9px] text-zinc-400">Manage notes</div>
                  </div>
                </button>
              )}

              {onOpenManageAccounts && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenManageAccounts();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/40 text-left text-zinc-200"
                >
                  <Scale className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">Accounts</div>
                    <div className="text-[9px] text-zinc-400">Open & balance</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveView('agenda');
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-violet-500/40 text-left text-zinc-200"
              >
                <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Agenda</div>
                  <div className="text-[9px] text-zinc-400">Timeline</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveView('habits');
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/40 text-left text-zinc-200"
              >
                <CheckSquare className="h-4 w-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Habits</div>
                  <div className="text-[9px] text-zinc-400">Streaks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setActiveView('balance-sheet');
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/40 text-left text-zinc-200"
              >
                <BookOpen className="h-4 w-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Statements</div>
                  <div className="text-[9px] text-zinc-400">Balance sheet</div>
                </div>
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-left text-zinc-200"
                >
                  <Settings className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-[11px]">Settings</div>
                    <div className="text-[9px] text-zinc-400">Syntax config</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
