import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Columns, Split, Paintbrush } from 'lucide-react';
import { LightboxState, ProviderId } from '../types';
import { SplitSlider } from './SplitSlider';

interface LightboxModalProps {
  state: LightboxState;
  onClose: () => void;
  onDownload: (url: string, filename: string) => void;
  onOpenRegionEditor?: (providerId: ProviderId, image: string, providerName: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  state,
  onClose,
  onDownload,
  onOpenRegionEditor,
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);

  if (!state.isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => (prev < 3 ? ((prev + 1) as any) : prev));
  const handleZoomOut = () => setZoomLevel((prev) => (prev > 1 ? ((prev - 1) as any) : prev));

  const zoomScale = zoomLevel === 1 ? 'scale-100' : zoomLevel === 2 ? 'scale-150' : 'scale-200';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-150">
      {/* Lightbox Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center space-x-2">
              <span>{state.providerName || 'Inspección de Detalle'}</span>
              <span className="text-xs font-normal text-neutral-400">
                ({state.modelName || 'Pixel-peeping'})
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Examina nitidez de ojos, poros, eliminación de rasguños y preservación de identidad.
            </p>
          </div>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center p-1 rounded-xl bg-neutral-800 border border-neutral-700/60">
            <button
              id="lightbox-view-slider-btn"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'slider'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Deslizador Split</span>
            </button>
            <button
              id="lightbox-view-side-btn"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Lado a Lado</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-neutral-800 p-1 rounded-xl border border-neutral-700/60">
            <button
              id="lightbox-zoom-out-btn"
              onClick={handleZoomOut}
              disabled={zoomLevel === 1}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30"
              title="Reducir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-300 px-2 select-none">
              {zoomLevel * 100}%
            </span>
            <button
              id="lightbox-zoom-in-btn"
              onClick={handleZoomIn}
              disabled={zoomLevel === 3}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30"
              title="Aumentar Zoom (Pixel Peeping)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {onOpenRegionEditor && state.providerId && (
            <button
              id="lightbox-retouch-region-btn"
              onClick={() => {
                onClose();
                onOpenRegionEditor(
                  state.providerId!,
                  state.restoredImage,
                  state.providerName || 'Restaurada'
                );
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Seleccionar y retocar un área específica de esta foto"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Retocar Área</span>
            </button>
          )}

          <button
            id="lightbox-download-btn"
            onClick={() =>
              onDownload(
                state.restoredImage,
                `restored-${state.providerId || 'winner'}-${Date.now()}.png`
              )
            }
            className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>

          <button
            id="lightbox-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        {viewMode === 'slider' ? (
          <div className={`w-full max-w-4xl h-[70vh] transition-transform duration-200 ${zoomScale}`}>
            <SplitSlider
              originalImage={state.originalImage}
              restoredImage={state.restoredImage}
              providerName={state.providerName || 'Restaurada'}
              className="w-full h-full shadow-2xl border border-neutral-800"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 w-full max-w-5xl h-[70vh]">
            <div className="relative flex flex-col items-center justify-center bg-neutral-900/60 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 text-[11px] font-mono text-neutral-300 z-10 border border-neutral-700">
                ORIGINAL (ANTES)
              </div>
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={state.originalImage}
                  alt="Original"
                  referrerPolicy="no-referrer"
                  className={`max-h-full max-w-full object-contain transition-transform duration-200 ${zoomScale}`}
                />
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center bg-neutral-900/60 rounded-2xl border border-amber-500/30 overflow-hidden shadow-xl">
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 text-[11px] font-mono text-amber-300 z-10 border border-amber-500/40 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{state.providerName || 'RESTAURADA'} (DESPUÉS)</span>
              </div>
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={state.restoredImage}
                  alt="Restaurada"
                  referrerPolicy="no-referrer"
                  className={`max-h-full max-w-full object-contain transition-transform duration-200 ${zoomScale}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
