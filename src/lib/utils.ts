import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Hard Limit for Firestore Document size is 1MB. 
 * Since we store files as Base64, we must limit the raw file size.
 * Base64 adds ~33% overhead.
 */
export const FIRESTORE_MAX_FILE_SIZE = 750000; // ~730KB raw limit

export const imageToDataUrl = (
  file: File,
  maxSizeInBytes: number = 1024 * 1024 
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's not an image (e.g. PDF), we just read it as is.
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // For images, we attempt high-fidelity compression to save space
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        let { width, height } = img;
        const ratio = width / height;

        // Organizational High-Res Standard
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;

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

        // Compress at 0.6 quality to balance clarity and document size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const units = ['', 'Thousand', 'Million', 'Billion'];

  let words = '';
  let i = 0;

  const getHundreds = (n: number) => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + ' ';
    } else {
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
    }
    return str;
  };

  const parts = num.toFixed(2).split('.');
  let mainNum = parseInt(parts[0]);
  
  while (mainNum > 0) {
    const chunk = mainNum % 1000;
    if (chunk !== 0) {
      words = getHundreds(chunk) + units[i] + ' ' + words;
    }
    mainNum = Math.floor(mainNum / 1000);
    i++;
  }

  words = words.trim();

  if (parts.length > 1) {
    const decimal = parseInt(parts[1]);
    if (decimal > 0) {
      words += ' and ' + getHundreds(decimal) + ' Cents';
    }
  }

  return words + ' Only';
}
