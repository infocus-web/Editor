import React from 'react';
import {
  Download,
  Maximize2,
  Trophy,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Key,
  RotateCcw,
  Layers,
  Paintbrush,
} from 'lucide-react';
import { ProviderResultState } from '../types';

interface ProviderCardProps {
  result: ProviderResultState;
  onOpenLightbox: (result: ProviderResultState) => void;
  onOpenRegionEditor: (result: ProviderResultState) => void;
  onDownload: (url: string, filename: string) => void;
  onSelectWinner: (providerId: string) => void;
  onRetrySingle: (providerId: string) => void;
  onOpenSettings: () => void;
  isWinner: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  result,
  onOpenLightbox,
  onOpenRegionEditor,
  onDownload,
  onSelectWinner,
  onRetrySingle,
  onOpenSettings,
  isWinner,
}) => {
  const formatTime = (ms?: number) => {
    if (!ms) return '';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      id={`provider-card-${result.id}`}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden bg-neutral-900/90 ${
        isWinner
          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
          : 'border-neutral-800 hover:border-neutral-700 shadow-md'
      }`}
    >
      {/* Winner Ribbon */}
      {isWinner && (
        <div className="absolute -top-1 -right-1 z-20 flex items-center space-x-1 px-3 py-1 rounded-bl-xl rounded-tr-xl bg-amber-400 text-neutral-950 font-bold text-[11px] shadow-lg">
          <Trophy className="w-3.5 h-3.5 fill-current" />
          <span>GANADORA</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/95">
        <div className="min-w-0 pr-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-semibold text-neutral-100 truncate">{result.name}</h4>
          </div>
          <p className="text-[10px] font-mono text-neutral-400 truncate">{result.model}</p>
        </div>

        {/* Status / Timing Badge */}
        <div className="shrink-0 flex items-center space-x-1.5 text-xs">
          {result.status === 'loading' && (
            <span className="flex items-center space-x-1 text-amber-400 font-mono text-[11px] animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Procesando...</span>
            </span>
          )}
          {result.status === 'success' && (
            <span className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{formatTime(result.executionTimeMs)}</span>
            </span>
          )}
          {result.status === 'simulated' && (
            <span className="flex items-center space-x-1 text-sky-400 font-mono text-[10px] bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              <span>Simulada</span>
            </span>
          )}
          {result.status === 'error' && (
            <span className="flex items-center space-x-1 text-red-400 font-mono text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Error</span>
            </span>
          )}
          {result.status === 'idle' && (
            <span className="text-[10px] font-mono text-neutral-500">En espera</span>
          )}
        </div>
      </div>

      {/* Card Main Media Area */}
      <div className="relative aspect-[4/3] w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
        {result.status === 'idle' && (
          <div className="p-6 text-center text-neutral-600 flex flex-col items-center justify-center">
            <Layers className="w-8 h-8 mb-2 stroke-1 text-neutral-700" />
            <p className="text-xs text-neutral-400">Listo para ejecutar</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Presiona "Generar Todo" para despachar
            </p>
          </div>
        )}

        {result.status === 'loading' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900/50">
            <div className="relative w-12 h-12 mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-800"></div>
              <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs font-medium text-neutral-200">Restaurando con IA...</p>
            <p className="text-[11px] text-neutral-500 mt-1">Conectando con endpoint concurrente</p>
          </div>
        )}

        {(result.status === 'success' || result.status === 'simulated') && result.imageUrl && (
          <div className="relative w-full h-full group/img flex items-center justify-center">
            <img
              src={result.imageUrl}
              alt={result.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
            />

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-end p-3 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  id={`btn-winner-${result.id}`}
                  onClick={() => onSelectWinner(result.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md ${
                    isWinner
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-neutral-900/90 text-neutral-200 hover:text-amber-400 hover:bg-neutral-800 border border-neutral-700'
                  }`}
                  title="Marcar como mejor resultado"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{isWinner ? 'Ganadora' : 'Elegir Ganadora'}</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    id={`btn-edit-region-${result.id}`}
                    onClick={() => onOpenRegionEditor(result)}
                    className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 transition-colors"
                    title="Retocar área específica (Inpainting)"
                  >
                    <Paintbrush className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-peep-${result.id}`}
                    onClick={() => onOpenLightbox(result)}
                    className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 transition-colors"
                    title="Inspeccionar detalle (Pixel-Peeping)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-download-${result.id}`}
                    onClick={() =>
                      onDownload(result.imageUrl!, `restored-${result.id}-${Date.now()}.png`)
                    }
                    className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-md"
                    title="Descargar Full Res"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {result.status === 'error' && (
          <div className="p-4 text-center flex flex-col items-center justify-center space-y-2.5">
            <div className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-red-300 line-clamp-2 px-2">
              {result.error || 'Ocurrió un error en la llamada a la API.'}
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                id={`btn-retry-${result.id}`}
                onClick={() => onRetrySingle(result.id)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reintentar</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center space-x-1"
              >
                <Key className="w-3 h-3" />
                <span>Revisar Key</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Notes */}
      <div className="px-3.5 py-2.5 bg-neutral-900 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="truncate max-w-[180px]" title={result.notes || ''}>
          {result.notes || (result.status === 'idle' ? 'Pendiente de inicio' : 'Procesado')}
        </span>
        {(result.status === 'success' || result.status === 'simulated') && (
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <button
              onClick={() => onOpenRegionEditor(result)}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 hover:underline"
              title="Seleccionar área para retocar"
            >
              <Paintbrush className="w-3 h-3" />
              <span>Retocar Zona</span>
            </button>
            <span className="text-neutral-600">•</span>
            <button
              onClick={() => onOpenLightbox(result)}
              className="text-[11px] text-neutral-300 hover:text-white hover:underline"
            >
              Split
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
