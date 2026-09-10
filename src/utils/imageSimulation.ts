import { RegionBox } from '../types';

// Client-side canvas restoration algorithms for fallback and instant enhancement
export async function simulateRestoration(
  dataUrl: string,
  mode: 'google' | 'openai' | 'stability' | 'replicate' | 'fal',
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Adjust tone, contrast, and clarity based on model flavor
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Contrast enhancement
        const factor = 1.15;
        r = (r - 128) * factor + 128;
        g = (g - 128) * factor + 128;
        b = (b - 128) * factor + 128;

        if (mode === 'google') {
          // Warm film tone & crisp highlights (Imagen 3 flavor)
          r = r * 1.05 + 5;
          g = g * 1.02 + 2;
          b = b * 0.98;
        } else if (mode === 'openai') {
          // Vivid, vibrant portrait look (DALL-E 3 flavor)
          r = r * 1.08;
          g = g * 1.04;
          b = b * 1.02;
        } else if (mode === 'stability') {
          // High dynamic range & subtle cool shadows (SD3 flavor)
          r = r * 1.02;
          g = r * 1.03;
          b = b * 1.06;
        } else if (mode === 'replicate' || mode === 'fal') {
          // CodeFormer / Flux flavor: crisp skin tones and clean monochrome/sepia removal
          const avg = (r + g + b) / 3;
          r = r * 0.85 + avg * 0.15 + 4;
          g = g * 0.85 + avg * 0.15 + 2;
          b = b * 0.85 + avg * 0.15;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Localized inpainting simulation for selected region
export async function simulateRegionInpainting(
  baseImageUrl: string,
  maskDataUrl: string,
  regionBox: RegionBox | null,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';

    baseImg.onload = () => {
      const width = baseImg.naturalWidth || baseImg.width;
      const height = baseImg.naturalHeight || baseImg.height;

      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = width;
      mainCanvas.height = height;
      const mainCtx = mainCanvas.getContext('2d');
      if (!mainCtx) {
        resolve(baseImageUrl);
        return;
      }

      // Draw base image
      mainCtx.drawImage(baseImg, 0, 0);

      const maskImg = new Image();
      maskImg.crossOrigin = 'anonymous';

      const applyModifications = () => {
        // Create an offscreen canvas for mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');

        if (maskCtx) {
          if (maskDataUrl) {
            maskCtx.drawImage(maskImg, 0, 0, width, height);
          } else if (regionBox) {
            // Draw box on mask
            const bx = (regionBox.x / 100) * width;
            const by = (regionBox.y / 100) * height;
            const bw = (regionBox.width / 100) * width;
            const bh = (regionBox.height / 100) * height;
            maskCtx.fillStyle = '#FFFFFF';
            maskCtx.fillRect(bx, by, bw, bh);
          }
        }

        const baseImageData = mainCtx.getImageData(0, 0, width, height);
        const maskImageData = maskCtx ? maskCtx.getImageData(0, 0, width, height) : null;
        const basePixels = baseImageData.data;
        const maskPixels = maskImageData ? maskImageData.data : null;

        const pLower = prompt.toLowerCase();
        const isSmooth = pLower.includes('suav') || pLower.includes('arrug') || pLower.includes('piel');
        const isSharpen = pLower.includes('ojo') || pLower.includes('nitid') || pLower.includes('clar') || pLower.includes('enfoque');
        const isHeal = pLower.includes('mancha') || pLower.includes('rasgu') || pLower.includes('eliminar') || pLower.includes('borrar');

        for (let i = 0; i < basePixels.length; i += 4) {
          // Check mask coverage (white pixel in mask = 255)
          const maskVal = maskPixels ? maskPixels[i] : 0;
          if (maskVal > 20) {
            const alpha = maskVal / 255;
            let r = basePixels[i];
            let g = basePixels[i + 1];
            let b = basePixels[i + 2];

            if (isHeal) {
              // Healing blur/median: diffuse local color to eliminate dust/scratch
              const avg = (r + g + b) / 3;
              r = r * 0.7 + avg * 0.3;
              g = g * 0.7 + avg * 0.3;
              b = b * 0.7 + avg * 0.3;
            } else if (isSharpen) {
              // Boost local micro-contrast & eye specular highlight
              r = (r - 128) * 1.3 + 128 + 6;
              g = (g - 128) * 1.3 + 128 + 6;
              b = (b - 128) * 1.3 + 128 + 8;
            } else if (isSmooth) {
              // Soft skin tone blending
              const skinAvg = r * 0.5 + g * 0.3 + b * 0.2;
              r = r * 0.75 + skinAvg * 0.25;
              g = g * 0.75 + skinAvg * 0.25;
              b = b * 0.75 + skinAvg * 0.25;
            } else {
              // General localized enhancement
              r = r * 1.06 + 3;
              g = g * 1.06 + 3;
              b = b * 1.04;
            }

            // Alpha blend back into base
            basePixels[i] = Math.min(255, Math.max(0, basePixels[i] * (1 - alpha) + r * alpha));
            basePixels[i + 1] = Math.min(255, Math.max(0, basePixels[i + 1] * (1 - alpha) + g * alpha));
            basePixels[i + 2] = Math.min(255, Math.max(0, basePixels[i + 2] * (1 - alpha) + b * alpha));
          }
        }

        mainCtx.putImageData(baseImageData, 0, 0);
        resolve(mainCanvas.toDataURL('image/jpeg', 0.95));
      };

      if (maskDataUrl) {
        maskImg.onload = applyModifications;
        maskImg.onerror = applyModifications;
        maskImg.src = maskDataUrl;
      } else {
        applyModifications();
      }
    };

    baseImg.onerror = () => resolve(baseImageUrl);
    baseImg.src = baseImageUrl;
  });
}
