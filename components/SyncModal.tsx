'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Folder,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  LogOut,
  FolderSync,
  ShieldCheck,
} from 'lucide-react';
import { WorkspaceFile } from '@/types';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
} from '@/lib/firebase-auth';
import {
  findOrCreateVaultFolder,
  listVaultFiles,
  uploadOrUpdateFile,
  fetchFileContent,
} from '@/lib/google-drive';
import { exportWorkspaceZip, downloadBlob, downloadFile } from '@/lib/storage';
import JSZip from 'jszip';

interface SyncModalProps {
  files: WorkspaceFile[];
  onUpdateFiles: (newFiles: WorkspaceFile[]) => void;
  isOpen: boolean;
  onClose: () => void;
  googleConnected: boolean;
  setGoogleConnected: (val: boolean) => void;
  userEmail: string | null;
  setUserEmail: (val: string | null) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  files,
  onUpdateFiles,
  isOpen,
  onClose,
  googleConnected,
  setGoogleConnected,
  userEmail,
  setUserEmail,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [folderName, setFolderName] = useState<string>('OrgBean-Vault');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [driveFilesList, setDriveFilesList] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);

  // Destructive Confirmation Dialog State (Mandatory Workspace Skill Requirement)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  // Track auth state
  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setGoogleConnected(true);
        setUserEmail(user.email);
      },
      () => {
        setGoogleConnected(false);
        setUserEmail(null);
      }
    );
    return () => unsub();
  }, [setGoogleConnected, setUserEmail]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setSyncStatusMsg('');
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleConnected(true);
        setUserEmail(res.user.email);
        setSyncStatusMsg('Successfully connected to Google Drive.');
        // Locate folder
        const folder = await findOrCreateVaultFolder(res.accessToken);
        setFolderId(folder.id);
        setFolderName(folder.name);
        const list = await listVaultFiles(res.accessToken, folder.id);
        setDriveFilesList(list);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setSyncStatusMsg(`Connection failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setGoogleConnected(false);
    setUserEmail(null);
    setFolderId(null);
    setDriveFilesList([]);
    setSyncStatusMsg('Signed out of Google account.');
  };

  // Push local files to Google Drive folder
  const triggerPushToDrive = () => {
    // Show explicit user confirmation dialog
    setConfirmModal({
      isOpen: true,
      title: 'Upload and sync files to Google Drive?',
      description: `This will upload or update ${files.length} note and ledger files into your 'OrgBean-Vault' folder in Google Drive.`,
      action: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated with Google');

        setIsSyncing(true);
        setSyncStatusMsg('Syncing files to Google Drive...');
        try {
          const folder = await findOrCreateVaultFolder(token);
          setFolderId(folder.id);
          const existingList = await listVaultFiles(token, folder.id);

          const updatedLocalFiles = [...files];

          for (let i = 0; i < updatedLocalFiles.length; i++) {
            const f = updatedLocalFiles[i];
            const existing = existingList.find((ef) => ef.name === f.name);
            const uploaded = await uploadOrUpdateFile(
              token,
              folder.id,
              f.name,
              f.content,
              existing?.id
            );
            updatedLocalFiles[i] = {
              ...f,
              driveFileId: uploaded.id,
              syncedAt: Date.now(),
            };
          }

          onUpdateFiles(updatedLocalFiles);
          const refreshed = await listVaultFiles(token, folder.id);
          setDriveFilesList(refreshed);
          setSyncStatusMsg(`Successfully pushed ${files.length} files to Google Drive.`);
        } catch (err: any) {
          console.error('Push sync error:', err);
          setSyncStatusMsg(`Sync error: ${err.message}`);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Pull remote files from Google Drive folder
  const triggerPullFromDrive = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Pull and replace local files from Google Drive?',
      description: `This will download all files from your 'OrgBean-Vault' folder in Google Drive and update your local workspace notes and ledgers.`,
      action: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated with Google');

        setIsSyncing(true);
        setSyncStatusMsg('Pulling files from Google Drive...');
        try {
          const folder = await findOrCreateVaultFolder(token);
          const remoteList = await listVaultFiles(token, folder.id);

          if (remoteList.length === 0) {
            setSyncStatusMsg('No files found in Google Drive OrgBean-Vault folder.');
            setIsSyncing(false);
            return;
          }

          const newFiles: WorkspaceFile[] = [];

          for (const rf of remoteList) {
            const content = await fetchFileContent(token, rf.id);
            const isBean = rf.name.endsWith('.bean') || rf.name.endsWith('.beancount');
            newFiles.push({
              id: `drive-${rf.id}`,
              name: rf.name,
              path: isBean ? `/accounting/${rf.name}` : `/notes/${rf.name}`,
              type: isBean ? 'bean' : 'org',
              content,
              updatedAt: new Date(rf.modifiedTime).getTime(),
              driveFileId: rf.id,
              syncedAt: Date.now(),
            });
          }

          onUpdateFiles(newFiles);
          setDriveFilesList(remoteList);
          setSyncStatusMsg(`Successfully pulled ${remoteList.length} files from Google Drive.`);
        } catch (err: any) {
          console.error('Pull sync error:', err);
          setSyncStatusMsg(`Pull error: ${err.message}`);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Export ZIP archive
  const handleDownloadZip = async () => {
    const zipBlob = await exportWorkspaceZip(files);
    downloadBlob(zipBlob, `orgbean-workspace-${new Date().toISOString().slice(0, 10)}.zip`);
  };

  // Local file import handler (supports .org, .bean, or .zip)
  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const importedFiles: WorkspaceFile[] = [...files];

    for (let i = 0; i < fileList.length; i++) {
      const selected = fileList[i];

      if (selected.name.endsWith('.zip')) {
        // Unzip archive
        const zip = await JSZip.loadAsync(selected);
        const entries = Object.keys(zip.files);
        for (const filename of entries) {
          if (!zip.files[filename].dir && (filename.endsWith('.org') || filename.endsWith('.bean'))) {
            const content = await zip.files[filename].async('text');
            const cleanName = filename.split('/').pop() || filename;
            const isBean = cleanName.endsWith('.bean');

            const existingIdx = importedFiles.findIndex((f) => f.name === cleanName);
            const newObj: WorkspaceFile = {
              id: `imported-${Date.now()}-${cleanName}`,
              name: cleanName,
              path: isBean ? `/accounting/${cleanName}` : `/notes/${cleanName}`,
              type: isBean ? 'bean' : 'org',
              content,
              updatedAt: Date.now(),
            };

            if (existingIdx >= 0) {
              importedFiles[existingIdx] = newObj;
            } else {
              importedFiles.push(newObj);
            }
          }
        }
      } else {
        // Plain text file (.org or .bean)
        const content = await selected.text();
        const isBean = selected.name.endsWith('.bean') || selected.name.endsWith('.beancount');
        const isOrg = selected.name.endsWith('.org');

        if (isBean || isOrg) {
          const existingIdx = importedFiles.findIndex((f) => f.name === selected.name);
          const newObj: WorkspaceFile = {
            id: `imported-${Date.now()}-${selected.name}`,
            name: selected.name,
            path: isBean ? `/accounting/${selected.name}` : `/notes/${selected.name}`,
            type: isBean ? 'bean' : 'org',
            content,
            updatedAt: Date.now(),
          };

          if (existingIdx >= 0) {
            importedFiles[existingIdx] = newObj;
          } else {
            importedFiles.push(newObj);
          }
        }
      }
    }

    onUpdateFiles(importedFiles);
    setSyncStatusMsg(`Imported files successfully into local workspace.`);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Cross-Platform Sync & Storage Hub
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sync with Google Drive or manage local offline files and backups
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: Google Drive Sync */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderSync className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Google Drive Folder Integration
              </span>
            </div>
            {googleConnected ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <CheckCircle className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-400">Not Connected</span>
            )}
          </div>

          {!googleConnected ? (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Connect your Google Drive to sync your <code className="text-emerald-300">.org</code> notes and <code className="text-indigo-300">.bean</code> double-entry ledgers into a secure, dedicated <strong>OrgBean-Vault</strong> folder.
              </p>

              {/* Official Sign in with Google Button Styling */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between text-xs font-mono bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                <div>
                  <span className="text-zinc-400">Account: </span>
                  <span className="text-zinc-200">{userEmail}</span>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Target Folder: <span className="text-emerald-400 font-semibold">{folderName}</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Disconnect</span>
                </button>
              </div>

              {/* Sync Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={triggerPushToDrive}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Push Local to Drive</span>
                </button>

                <button
                  onClick={triggerPullFromDrive}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Pull from Drive</span>
                </button>
              </div>

              {driveFilesList.length > 0 && (
                <div className="text-[11px] text-zinc-400 font-mono">
                  {driveFilesList.length} files currently detected in Drive vault.
                </div>
              )}
            </div>
          )}

          {syncStatusMsg && (
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              {syncStatusMsg}
            </div>
          )}
        </div>

        {/* Section 2: Offline Download & Backup */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Offline Download & Workspace Archive
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Download your full workspace as an open standard <code className="text-zinc-200">.zip</code> archive containing all your raw Org-mode (<code className="text-emerald-300">.org</code>) and Beancount (<code className="text-indigo-300">.bean</code>) files, ready for Emacs, BeanHub, or local backups.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Entire Workspace (.zip)</span>
            </button>

            {/* Import file input */}
            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700 transition-colors cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Import .org / .bean / .zip</span>
              <input
                type="file"
                multiple
                accept=".org,.bean,.beancount,.zip,.txt"
                onChange={handleImportFiles}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Section 3: File Inventory */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Current Workspace Files ({files.length})
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  {f.type === 'org' ? (
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <DollarSign className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  <span className="truncate text-zinc-200">{f.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">
                    {f.syncedAt ? 'Synced' : 'Local only'}
                  </span>
                  <button
                    onClick={() => downloadFile(f)}
                    className="p-1 hover:text-emerald-400"
                    title="Download this file"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive / Mutating Drive Operations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">
                  {confirmModal.title}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  await confirmModal.action();
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
