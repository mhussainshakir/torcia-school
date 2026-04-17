import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const classId = formData.get('classId') as string;
    const apiKey = formData.get('apiKey') as string;

    if (!file || !apiKey) {
      return NextResponse.json(
        { error: 'File and API key are required' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);

    const folderName = `Torcia_Videos_${classId || 'general'}`;
    const folderId = await createOrGetFolder(apiKey, folderName, classId);

    const boundary = `boundary_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName || file.name,
      mimeType: file.type || 'video/mp4',
      parents: folderId ? [folderId] : undefined,
    };

    const metadataJson = JSON.stringify(metadata);

    const multipartBody = Buffer.concat([
      Buffer.from(delimiter),
      Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
      Buffer.from(metadataJson),
      Buffer.from(delimiter),
      Buffer.from(`Content-Type: ${file.type || 'video/mp4'}\r\n\r\n`),
      fileContent,
      Buffer.from(closeDelimiter),
    ]);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Video upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload video to Google Drive' },
        { status: 500 }
      );
    }

    const uploadResult = await uploadResponse.json();
    const fileUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`;
    const embedUrl = `https://drive.google.com/file/d/${uploadResult.id}/preview`;

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      url: fileUrl,
      embedUrl: embedUrl,
      fileName: fileName || file.name,
      classId: classId,
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createOrGetFolder(apiKey: string, folderName: string, classId?: string): Promise<string | null> {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.files && searchResult.files.length > 0) {
        return searchResult.files[0].id;
      }
    }

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const createResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderMetadata),
      }
    );

    if (createResponse.ok) {
      const folder = await createResponse.json();
      return folder.id;
    }

    return null;
  } catch (error) {
    console.error('Folder creation error:', error);
    return null;
  }
}
