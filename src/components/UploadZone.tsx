import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  X,
  Sparkles,
  ClipboardPaste,
  Check,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import { SAMPLE_PORTRAITS } from '../utils/samples';
import { SamplePortrait } from '../types';

interface UploadZoneProps {
  originalImage: string | null;
  onImageSelected: (base64: string, info?: { name: string; size: string }) => void;
  onClearImage: () => void;
  onApplySamplePrompt: (sample: SamplePortrait) => void;
  onLoadSampleImage?: (sample: SamplePortrait) => void;
  selectedSampleId: string | null;
  lastPastedSampleTitle?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  originalImage,
  onImageSelected,
  onClearImage,
  onApplySamplePrompt,
  onLoadSampleImage,
  selectedSampleId,
  lastPastedSampleTitle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [justPastedId, setJustPastedId] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube un archivo de imagen (JPG, PNG o WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        onImageSelected(e.target.result, {
          name: file.name,
          size: `${sizeMb} MB`,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClickSample = (sample: SamplePortrait) => {
    onApplySamplePrompt(sample);
    setJustPastedId(sample.id);
    setTimeout(() => {
      setJustPastedId((prev) => (prev === sample.id ? null : prev));
    }, 2500);
  };

  return (
    <div className="space-y-3.5">
      {/* Photo Upload or Preview Container */}
      {!originalImage ? (
        <div
          id="dropzone-container"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="relative group border-2 border-dashed border-neutral-700/80 hover:border-amber-400/60 bg-neutral-900/40 hover:bg-neutral-900/80 rounded-2xl p-6 transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[200px]"
        >
          <input
            id="file-input-portrait"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="w-11 h-11 rounded-2xl bg-neutral-800/90 text-neutral-300 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-all border border-neutral-700/60">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-neutral-200 mb-1">
            Arrastra tu fotografía antigua o retrato aquí
          </h4>
          <p className="text-[11px] text-neutral-400 max-w-sm mb-2.5">
            Soporta JPG, PNG o WEBP. Tu foto original se mantendrá intacta al probar distintos prompts.
          </p>
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            Explorar Archivos
          </span>
        </div>
      ) : (
        <div className="relative group rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-lg">
          <div className="relative max-h-[260px] w-full flex items-center justify-center bg-black/50 overflow-hidden">
            <img
              id="original-preview-img"
              src={originalImage}
              alt="Fotografía original cargada"
              referrerPolicy="no-referrer"
              className="max-h-[260px] w-auto object-contain"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-medium text-neutral-200 border border-neutral-700/50 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Tu Foto Cargada</span>
            </div>
            <button
              id="clear-original-img-btn"
              onClick={onClearImage}
              title="Quitar imagen"
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 hover:bg-red-500/80 text-neutral-300 hover:text-white backdrop-blur-md transition-colors border border-neutral-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Examples & Prompt Presets Section */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Estilos & Prompts de Ejemplo
              </span>
              <p className="text-[11px] text-neutral-400">
                Haz clic en una imagen para <strong className="text-amber-300 font-medium">pegar su prompt especializado</strong> en el editor
              </p>
            </div>
          </div>

          {lastPastedSampleTitle && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 animate-fade-in">
              <Check className="w-3 h-3" />
              <span>Prompt pegado</span>
            </span>
          )}
        </div>

        {/* Grid of sample cards */}
        <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
          {SAMPLE_PORTRAITS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            const isJustPasted = justPastedId === sample.id;

            return (
              <div
                key={sample.id}
                id={`sample-portrait-${sample.id}`}
                className={`relative group rounded-xl border p-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400/90 bg-amber-500/10 shadow-sm'
                    : 'border-neutral-800/90 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700'
                }`}
                onClick={() => handleClickSample(sample)}
                title={`Haz clic para pegar el prompt de "${sample.title}"`}
              >
                {/* Top preview row */}
                <div className="flex items-start space-x-2">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-neutral-700/80">
                    <img
                      src={sample.url}
                      alt={sample.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ClipboardPaste className="w-4 h-4 text-amber-300" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/50 truncate">
                        {sample.styleTag || sample.era}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-neutral-200 truncate mt-0.5">
                      {sample.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {sample.damage}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-2 pt-1.5 border-t border-neutral-800/60 flex items-center justify-between text-[10px]">
                  <span
                    className={`inline-flex items-center space-x-1 font-medium transition-colors ${
                      isJustPasted
                        ? 'text-emerald-400 font-semibold'
                        : isSelected
                        ? 'text-amber-300'
                        : 'text-neutral-400 group-hover:text-amber-300'
                    }`}
                  >
                    {isJustPasted ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>¡Prompt Pegado!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Pegar Prompt</span>
                      </>
                    )}
                  </span>

                  {/* Optional discreet secondary link to load this image if user has no photo */}
                  {onLoadSampleImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadSampleImage(sample);
                      }}
                      className="text-[9px] text-neutral-400 hover:text-neutral-200 hover:underline px-1 py-0.5"
                      title="Cargar también esta fotografía de muestra en el visor"
                    >
                      Cargar foto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
