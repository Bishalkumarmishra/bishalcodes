const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'de240foz4';
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '685633191642553';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || 'sdKE63yHU-3PUhGuEuoVaPBHJ7g';

const sha1 = async (str: string): Promise<string> => {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export interface CloudinaryUploadResult {
  url: string;
  type: 'image' | 'video' | 'pdf' | 'raw';
  publicId: string;
}

export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'portfolio';
  
  // Create signature string: sort parameters alphabetically, append API Secret at the end
  const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(signatureString);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', folder);
  formData.append('signature', signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cloudinary upload failed with status ${response.status}`);
  }

  const data = await response.json();
  
  // Determine asset type
  let detectedType: 'image' | 'video' | 'pdf' | 'raw' = 'image';
  if (data.resource_type === 'video') {
    detectedType = 'video';
  } else if (file.type === 'application/pdf' || data.format === 'pdf') {
    detectedType = 'pdf';
  } else if (data.resource_type === 'raw') {
    detectedType = 'raw';
  }

  return {
    url: data.secure_url,
    type: detectedType,
    publicId: data.public_id,
  };
};
