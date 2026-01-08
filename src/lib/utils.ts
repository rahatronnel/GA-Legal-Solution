import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const imageToDataUrl = (
  file: File,
  maxSizeInBytes: number = 1024 * 1024 
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // For non-image files, or files already under the size limit, just convert to data URL
    if (!file.type.startsWith('image/') || file.size <= maxSizeInBytes) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // For large images, resize and compress
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        // Calculate the new dimensions
        let { width, height } = img;
        const ratio = width / height;

        // Simple resizing logic based on a max dimension
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = MAX_WIDTH / ratio;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = MAX_HEIGHT * ratio;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to data URL (JPEG for compression)
        // The quality parameter (0.7) can be adjusted
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
