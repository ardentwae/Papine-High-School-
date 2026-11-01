/**
 * Google Drive API Service
 * Handles PDF validation, 25MB limits, folder routing, and Drive uploads
 */

import { getAccessToken } from '../config/firebase';
import { storageService } from './storageService';

export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  sizeBytes: number;
}

export const googleDriveService = {
  /**
   * Client-side validation: must be PDF and <= 25MB
   */
  validatePdfFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Please select a PDF document.' };
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF documents are permitted for printing registration.',
      };
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size exceeds the 25 MB limit. Selected file is ${sizeMB} MB.`,
      };
    }

    return { valid: true };
  },

  /**
   * Get or create the designated archive folder: "Papine High School - Print Archive"
   */
  async getOrCreateArchiveFolder(): Promise<string> {
    const token = await getAccessToken();
    if (!token) return '';

    const settings = storageService.getSettings();
    if (settings.driveFolderId) {
      return settings.driveFolderId;
    }

    const folderName = settings.driveFolderName || 'Papine High School - Print Archive';

    try {
      // Query if folder already exists
      const query = encodeURIComponent(
        `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      );
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          const folderId = data.files[0].id;
          storageService.setSettings({ ...settings, driveFolderId: folderId });
          return folderId;
        }
      }

      // Create folder
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Official print archive for Papine High School Printing & Document Management System',
        }),
      });

      if (createRes.ok) {
        const folder = await createRes.json();
        storageService.setSettings({ ...settings, driveFolderId: folder.id });
        return folder.id;
      }
    } catch (e) {
      console.warn('Folder resolution error:', e);
    }

    return '';
  },

  /**
   * Upload PDF document to Google Drive with multipart payload
   */
  async uploadPdf(file: File, documentTitle: string): Promise<DriveUploadResult> {
    const validation = googleDriveService.validatePdfFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const token = await getAccessToken();

    // Fallback if user is in demo mode or not signed in
    if (!token) {
      const simulatedId = 'local-preview-' + Date.now();
      const localBlobUrl = URL.createObjectURL(file);
      return {
        fileId: simulatedId,
        fileName: file.name,
        webViewLink: localBlobUrl,
        sizeBytes: file.size,
      };
    }

    const folderId = await googleDriveService.getOrCreateArchiveFolder();
    const metadata: any = {
      name: `[PHS] ${documentTitle.trim()} - ${file.name}`,
      mimeType: 'application/pdf',
      description: `Papine High School print registration: ${documentTitle}`,
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json; charset=UTF-8',
    });

    const form = new FormData();
    form.append('metadata', metadataBlob);
    form.append('file', file);

    // Using standard multipart fetch
    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Google Drive upload failed (${uploadRes.status})`);
    }

    const uploaded = await uploadRes.json();

    // Set permission to anyone with link or domain if needed
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );
    } catch (e) {
      // Permission setting is optional/may be restricted by domain admin
    }

    return {
      fileId: uploaded.id,
      fileName: uploaded.name || file.name,
      webViewLink:
        uploaded.webViewLink ||
        `https://drive.google.com/file/d/${uploaded.id}/view`,
      sizeBytes: file.size,
    };
  },
};
