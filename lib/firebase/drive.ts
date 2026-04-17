import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from './config';

const DRIVE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '';

interface DriveFile {
  name: string;
  url: string;
  fullPath: string;
  type: string;
  size: number;
  uploadTime: Date;
}

export async function uploadToGoogleDrive(
  file: File | Blob,
  fileName: string,
  folderId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!DRIVE_API_KEY) {
      const storageRef = ref(storage, `files/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return { success: true, url };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    formData.append('apiKey', DRIVE_API_KEY);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const response = await fetch('/api/drive/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

export async function uploadPDFToDrive(
  pdfBlob: Blob,
  fileName: string,
  classId: string
): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
  try {
    if (!DRIVE_API_KEY) {
      const storageRef = ref(storage, `pdfs/${classId}/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, pdfBlob);
      const url = await getDownloadURL(snapshot.ref);
      return { success: true, url };
    }

    const formData = new FormData();
    formData.append('file', pdfBlob, fileName);
    formData.append('fileName', fileName);
    formData.append('classId', classId);
    formData.append('apiKey', DRIVE_API_KEY);

    const response = await fetch('/api/drive/upload-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('PDF upload failed');
    }

    const data = await response.json();
    return { 
      success: true, 
      url: data.url,
      fileId: data.fileId 
    };
  } catch (error) {
    console.error('PDF upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF upload failed' 
    };
  }
}

export async function uploadImageToDrive(
  imageBlob: Blob,
  fileName: string,
  folder: string = 'images'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!DRIVE_API_KEY) {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, imageBlob);
      const url = await getDownloadURL(snapshot.ref);
      return { success: true, url };
    }

    const formData = new FormData();
    formData.append('file', imageBlob, fileName);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    formData.append('apiKey', DRIVE_API_KEY);

    const response = await fetch('/api/drive/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error) {
    console.error('Image upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Image upload failed' 
    };
  }
}

export async function uploadVideoToDrive(
  videoBlob: Blob,
  fileName: string,
  classId: string
): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
  try {
    if (!DRIVE_API_KEY) {
      const storageRef = ref(storage, `videos/${classId}/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, videoBlob);
      const url = await getDownloadURL(snapshot.ref);
      return { success: true, url };
    }

    const formData = new FormData();
    formData.append('file', videoBlob, fileName);
    formData.append('fileName', fileName);
    formData.append('classId', classId);
    formData.append('apiKey', DRIVE_API_KEY);

    const response = await fetch('/api/drive/upload-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Video upload failed');
    }

    const data = await response.json();
    return { 
      success: true, 
      url: data.url,
      fileId: data.fileId 
    };
  } catch (error) {
    console.error('Video upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Video upload failed' 
    };
  }
}

export async function getFilesFromDrive(
  folder: string,
  classId?: string
): Promise<{ success: boolean; files?: DriveFile[]; error?: string }> {
  try {
    if (!DRIVE_API_KEY) {
      const storageRef = ref(storage, folder);
      const listResult = await listAll(storageRef);
      const files: DriveFile[] = [];

      for (const itemRef of listResult.items) {
        const url = await getDownloadURL(itemRef);
        files.push({
          name: itemRef.name,
          url,
          fullPath: itemRef.fullPath,
          type: getFileType(itemRef.name),
          size: 0,
          uploadTime: new Date(),
        });
      }

      return { success: true, files };
    }

    const response = await fetch(
      `/api/drive/list?folder=${folder}&classId=${classId || ''}&apiKey=${DRIVE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    const data = await response.json();
    return { success: true, files: data.files };
  } catch (error) {
    console.error('List files error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list files' 
    };
  }
}

export async function deleteFromDrive(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!DRIVE_API_KEY) {
      const storageRef = ref(storage, fileId);
      await deleteObject(storageRef);
      return { success: true };
    }

    const response = await fetch('/api/drive/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, apiKey: DRIVE_API_KEY }),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  };

  return types[ext || ''] || 'application/octet-stream';
}

export function getDriveUploadUrl(): string {
  return DRIVE_API_KEY ? 'https://www.googleapis.com/upload/drive/v3/files' : '';
}

export function isDriveConfigured(): boolean {
  return !!DRIVE_API_KEY;
}
