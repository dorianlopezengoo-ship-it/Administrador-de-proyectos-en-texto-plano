import { DriveSyncFileMetadata, WorkspaceFile } from '@/types';

const FOLDER_NAME = 'OrgBean-Vault';

export async function findOrCreateVaultFolder(accessToken: string): Promise<{ id: string; name: string }> {
  // Query existing folder
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to query Google Drive folder: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return { id: data.files[0].id, name: data.files[0].name };
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Synchronized OrgNote and BeanHub notes and ledger files',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create OrgBean-Vault folder: ${createRes.status} ${err}`);
  }

  const folder = await createRes.json();
  return { id: folder.id, name: folder.name };
}

export async function listVaultFiles(accessToken: string, folderId: string): Promise<DriveSyncFileMetadata[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&pageSize=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list files in Google Drive folder: ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function fetchFileContent(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to read file content from Google Drive: ${res.status}`);
  }

  return await res.text();
}

export async function uploadOrUpdateFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  content: string,
  existingFileId?: string
): Promise<{ id: string; name: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const contentType = fileName.endsWith('.bean') ? 'text/plain' : 'text/plain';

  if (existingFileId) {
    // Update existing file
    const metadata = { name: fileName };
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${contentType}\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to update file in Google Drive: ${res.status}`);
    }

    const data = await res.json();
    return { id: data.id, name: data.name };
  } else {
    // Create new file
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${contentType}\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to upload file to Google Drive: ${res.status}`);
    }

    const data = await res.json();
    return { id: data.id, name: data.name };
  }
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string,
  fileName: string
): Promise<void> {
  // Confirmation is handled at UI layer, but guard check here
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete file from Google Drive: ${res.status}`);
  }
}
