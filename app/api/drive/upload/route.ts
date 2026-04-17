import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const apiKey = formData.get('apiKey') as string;
    const folderId = formData.get('folderId') as string;

    if (!file || !apiKey) {
      return NextResponse.json(
        { error: 'File and API key are required' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer);

    let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media';
    let metadata: Record<string, string> = {
      name: fileName || file.name,
      mimeType: file.type || 'application/octet-stream',
    };

    if (folderId) {
      const folderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (folderResponse.ok) {
        metadata.parents = [folderId];
        uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
      }
    }

    const boundary = `boundary_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataJson = JSON.stringify(metadata);
    const base64Metadata = Buffer.from(metadataJson).toString('base64');

    const multipartBody = Buffer.concat([
      Buffer.from(delimiter),
      Buffer.from(`Content-Type: application/json; charset=UTF-8\r\n\r\n`),
      Buffer.from(metadataJson),
      Buffer.from(delimiter),
      Buffer.from(`Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`),
      fileContent,
      Buffer.from(closeDelimiter),
    ]);

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
      console.error('Google Drive upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload to Google Drive' },
        { status: 500 }
      );
    }

    const uploadResult = await uploadResponse.json();
    const fileUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`;

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      url: fileUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
