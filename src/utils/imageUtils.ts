/**
 * Image processing utilities for Vinisha Pharma
 * Supports transparent PNG conversion, white-background removal, and storage compression
 */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Removes white or near-white background from an image using HTML5 Canvas
 * making it a 100% transparent PNG
 */
export function removeWhiteBackground(
  imageSrc: string,
  tolerance: number = 28
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const threshold = 255 - tolerance;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is near-white or white, turn alpha to 0
        if (r >= threshold && g >= threshold && b >= threshold) {
          // Calculate smooth anti-aliased edge if within threshold zone
          const minVal = Math.min(r, g, b);
          if (minVal > 240) {
            data[i + 3] = 0; // Pure transparent
          } else {
            // Smooth gradient falloff
            const alphaFactor = (255 - minVal) / tolerance;
            data[i + 3] = Math.min(data[i + 3], Math.floor(alphaFactor * 255));
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Optimizes image resolution to balance crispness on 4K retina displays
 * with compact storage in localStorage
 */
export function optimizeImage(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
