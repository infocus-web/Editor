import React, { useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { SAMPLE_PORTRAITS } from '../utils/samples';
import { SamplePortrait } from '../types';

interface UploadZoneProps {
  originalImage: string | null;
  onImageSelected: (base64: string, info?: { name: string; size: string }) => void;
  onClearImage: () => void;
  onSelectSample: (sample: SamplePortrait) => void;
  selectedSampleId: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  originalImage,
  onImageSelected,
  onClearImage,
  onSelectSample,
  selectedSampleId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-3">
      {!originalImage ? (
        <div
          id="dropzone-container"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="relative group border-2 border-dashed border-neutral-700/80 hover:border-amber-400/60 bg-neutral-900/40 hover:bg-neutral-900/80 rounded-2xl p-6 transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[220px]"
        >
          <input
            id="file-input-portrait"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-neutral-800/90 text-neutral-300 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-all border border-neutral-700/60">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-200 mb-1">
            Arrastra tu fotografía antigua o retrato aquí
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mb-3">
            Soporta JPG, PNG o WEBP. Se enviará en paralelo a todas las IAs seleccionadas.
          </p>
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            Explorar Archivos
          </span>
        </div>
      ) : (
        <div className="relative group rounded-2xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-lg">
          <div className="relative max-h-[300px] w-full flex items-center justify-center bg-black/50 overflow-hidden">
            <img
              id="original-preview-img"
              src={originalImage}
              alt="Fotografía original cargada"
              referrerPolicy="no-referrer"
              className="max-h-[300px] w-auto object-contain"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-medium text-neutral-200 border border-neutral-700/50 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Foto Original Lista</span>
            </div>
            <button
              id="clear-original-img-btn"
              onClick={onClearImage}
              title="Quitar imagen"
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-red-500/80 text-neutral-300 hover:text-white backdrop-blur-md transition-colors border border-neutral-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Test Sample Portraits */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>O prueba una foto de muestra para comparar ahora:</span>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_PORTRAITS.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                id={`sample-portrait-${sample.id}`}
                onClick={() => onSelectSample(sample)}
                className={`relative flex items-center space-x-2.5 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <img
                  src={sample.url}
                  alt={sample.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-neutral-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-neutral-200 truncate">{sample.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{sample.damage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
