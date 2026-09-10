/**
 * Optimizes an uploaded image for AI Vision & Chat API transmission.
 * Resizes images to a maximum width/height of 1280px (maintaining aspect ratio)
 * and compresses to JPEG with 0.88 quality, keeping facial details crisp while
 * reducing payload size from several megabytes down to ~150-300 KB.
 */
export async function optimizeImageForAi(fileOrDataUrl: File | string): Promise<{
  dataUrl: string;
  originalSizeMb: string;
  optimizedSizeMb: string;
  dimensions: { width: number; height: number };
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const maxDim = 1280;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto del lienzo'));
        return;
      }

      // Draw with high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      const approxBytes = Math.round((optimizedDataUrl.length * 3) / 4);
      const optimizedSizeMb = (approxBytes / (1024 * 1024)).toFixed(2);

      let originalSizeMb = optimizedSizeMb;
      if (typeof fileOrDataUrl !== 'string' && fileOrDataUrl.size) {
        originalSizeMb = (fileOrDataUrl.size / (1024 * 1024)).toFixed(2);
      }

      resolve({
        dataUrl: optimizedDataUrl,
        originalSizeMb,
        optimizedSizeMb: `${optimizedSizeMb} MB`,
        dimensions: { width, height },
      });
    };

    img.onerror = () => {
      reject(new Error('No se pudo decodificar la imagen seleccionada'));
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
