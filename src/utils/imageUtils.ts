/**
 * Automatically compresses, centers, and square-crops any uploaded image
 * (from mobile camera, photo library, or desktop file picker)
 * into a lightweight avatar Data URL (max 256x256, ~25KB JPEG).
 */
export function compressImageForAvatar(file: File, maxDim = 256, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic format check
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not process image format.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          // Square center-crop calculation
          const minSide = Math.min(width, height);
          const startX = (width - minSide) / 2;
          const startY = (height - minSide) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          // Smooth resampling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped & resized square image
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

          // Export as compressed JPEG Data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to raw dataUrl if canvas operations fail
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
