import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SplitSliderProps {
  originalImage: string;
  restoredImage: string;
  providerName?: string;
  className?: string;
}

export const SplitSlider: React.FC<SplitSliderProps> = ({
  originalImage,
  restoredImage,
  providerName = 'Restaurada',
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      className={`relative select-none overflow-hidden rounded-xl bg-black cursor-ew-resize group ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Restored Image (Base background) */}
      <img
        src={restoredImage}
        alt="Restaurada"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Original Image (Clipped overlay on the left) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={originalImage}
          alt="Original"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Divider Bar */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Handle Knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-neutral-900 border-2 border-amber-400 flex items-center justify-center shadow-xl">
          <div className="flex space-x-0.5">
            <span className="w-0.5 h-3 bg-amber-400 rounded-full"></span>
            <span className="w-0.5 h-3 bg-amber-400 rounded-full"></span>
          </div>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-medium text-neutral-300 border border-neutral-800">
        ORIGINAL
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-medium text-amber-300 border border-neutral-800">
        {providerName.toUpperCase()}
      </div>
    </div>
  );
};
