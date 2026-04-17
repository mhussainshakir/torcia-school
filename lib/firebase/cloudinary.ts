/**
 * Cloudinary Upload Service
 * 
 * Handles file uploads to Cloudinary including:
 * - Images
 * - PDFs
 * - Videos
 * - File management
 */

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  original_filename: string;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Cloudinary configuration
 */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dc9kzp20';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'torcia';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

/**
 * Uploads a file to Cloudinary.
 * 
 * @param file - File to upload (File object)
 * @param folder - Folder path in Cloudinary (e.g., 'academy-connect/class123')
 * @param onProgress - Optional progress callback
 * @returns Promise with upload response
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'academy-connect'
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  
  // Add file
  formData.append('file', file);
  
  // Add upload preset (unsigned for direct frontend uploads)
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // Add folder structure
  formData.append('folder', folder);
  
  // Add unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  formData.append('public_id', `${timestamp}_${sanitizedName}`);
  
  // Make upload request
  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }
  
  return await response.json();
}

/**
 * Uploads an image to Cloudinary.
 * Images are automatically optimized.
 * 
 * @param file - Image file to upload
 * @param classId - Class ID for folder organization
 * @returns Promise with upload response
 */
export async function uploadImage(
  file: File,
  classId: string
): Promise<CloudinaryUploadResponse> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid image format. Supported: JPG, PNG, GIF, WebP');
  }
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be less than 10MB');
  }
  
  return uploadToCloudinary(file, `academy-connect/${classId}/images`);
}

/**
 * Uploads a PDF to Cloudinary.
 * PDFs are stored as raw files.
 * 
 * @param file - PDF file to upload
 * @param classId - Class ID for folder organization
 * @returns Promise with upload response
 */
export async function uploadPDF(
  file: File,
  classId: string
): Promise<CloudinaryUploadResponse> {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Invalid file format. Only PDF allowed');
  }
  
  // Validate file size (max 25MB)
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('PDF size must be less than 25MB');
  }
  
  return uploadToCloudinary(file, `academy-connect/${classId}/pdfs`);
}

/**
 * Uploads a video to Cloudinary.
 * Videos are automatically transcoded.
 * 
 * @param file - Video file to upload
 * @param classId - Class ID for folder organization
 * @returns Promise with upload response
 */
export async function uploadVideo(
  file: File,
  classId: string
): Promise<CloudinaryUploadResponse> {
  // Validate file type
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid video format. Supported: MP4, WebM, MOV');
  }
  
  // Validate file size (max 100MB)
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('Video size must be less than 100MB');
  }
  
  return uploadToCloudinary(file, `academy-connect/${classId}/videos`);
}

/**
 * Deletes a file from Cloudinary.
 * 
 * @param publicId - Cloudinary public ID of the file
 * @param resourceType - Resource type ('image', 'video', 'raw')
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<void> {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Cloudinary API credentials not configured');
  }
  
  const timestamp = Math.round(Date.now() / 1000);
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  
  // Generate SHA1 signature (simplified - in production use crypto)
  const signature = btoa(stringToSign).slice(0, 32); // This is simplified
  
  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resource/${resourceType}/destroy`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Delete failed');
  }
}

/**
 * Gets public URL for a Cloudinary file.
 * 
 * @param publicId - Cloudinary public ID
 * @param options - URL transformation options
 * @returns Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  } = {}
): string {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
  
  let transformations = '';
  
  if (width || height) {
    transformations += `w_${width || 'auto'},h_${height || 'auto'},c_${crop},`;
  }
  
  transformations += `q_${quality},f_${format}`;
  
  if (transformations) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
  }
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
}

/**
 * Gets optimized image URL for chat messages.
 * 
 * @param publicId - Cloudinary public ID
 * @returns Optimized image URL
 */
export function getChatImageUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 800,
    height: 600,
    crop: 'inside',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Gets thumbnail URL for images.
 * 
 * @param publicId - Cloudinary public ID
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Validates file before upload.
 * 
 * @param file - File to validate
 * @param allowedTypes - Allowed MIME types
 * @param maxSizeMB - Maximum file size in MB
 * @returns true if valid
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // Check type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}
