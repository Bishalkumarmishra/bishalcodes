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

// Client-side image compression function
const compressImage = async (file: File, maxSizeMB: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Scale down dimensions only if image is extremely massive (e.g. > 4096px)
        const maxDimension = 4096;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start compressing with high quality (0.92) and step down if size is still too large
        let quality = 0.92;
        const iterate = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size > maxSizeMB * 1024 * 1024 && q > 0.1) {
              iterate(q - 0.08);
            } else {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          }, 'image/jpeg', q);
        };
        iterate(quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  let processedFile = file;

  // Check if file is an image and needs compression
  if (file.type.startsWith('image/')) {
    const sizeInMB = file.size / (1024 * 1024);
    
    // Proactively compress any image larger than 9.5MB down to under 9.5MB.
    // This allows files up to 100MB+ to be uploaded successfully by automatically fitting 
    // within the Cloudinary free-tier unsigned upload limit (10MB) shown in the screenshot.
    if (sizeInMB > 9.5) {
      console.log(`Image size is ${sizeInMB.toFixed(2)}MB. Compressing to under 9.5MB...`);
      try {
        processedFile = await compressImage(file, 9.5);
        console.log(`Compressed image size: ${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      } catch (err) {
        console.warn("Image compression failed, attempting to upload original file:", err);
      }
    }
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'portfolio';
  
  // Create signature string: sort parameters alphabetically, append API Secret at the end
  const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(signatureString);

  const formData = new FormData();
  formData.append('file', processedFile);
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
