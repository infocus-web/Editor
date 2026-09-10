import React from 'react';
import { Layers, CheckSquare, Square, Settings2 } from 'lucide-react';
import { ProviderId, UserApiKeys } from '../types';

export interface ProviderOption {
  id: ProviderId;
  name: string;
  badge: string;
  model: string;
  description: string;
  hasKey: boolean;
}

interface ProviderSelectorProps {
  selectedProviders: ProviderId[];
  onToggleProvider: (id: ProviderId) => void;
  keys: UserApiKeys;
  onOpenSettings: () => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProviders,
  onToggleProvider,
  keys,
  onOpenSettings,
}) => {
  const providerOptions: ProviderOption[] = [
    {
      id: 'google',
      name: 'Google Imagen 3',
      badge: 'Google AI Studio',
      model: 'imagen-3.0-generate-002',
      description: 'Generación fotorrealista desde cero con preservación estricta de identidad.',
      hasKey: Boolean(keys.google),
    },
    {
      id: 'openai',
      name: 'OpenAI DALL-E 3',
      badge: 'OpenAI API',
      model: 'dall-e-3 / gpt-image',
      description: 'Reconstrucción vívida de retratos con nitidez de estudio.',
      hasKey: Boolean(keys.openai),
    },
    {
      id: 'stability',
      name: 'Stability AI',
      badge: 'Stability Cloud',
      model: 'SD3.5 Large / SDXL',
      description: 'Control de grano fino fotorrealista mediante image-to-image.',
      hasKey: Boolean(keys.stability),
    },
    {
      id: 'replicate',
      name: 'Replicate (CodeFormer / Flux)',
      badge: 'Replicate API',
      model: 'sczhou/codeformer',
      description: 'Super-resolución especializada en reconstruir ojos, labios y rostros.',
      hasKey: Boolean(keys.replicate),
    },
    {
      id: 'fal',
      name: 'Fal.ai (Flux.1 Dev)',
      badge: 'Fal Cloud',
      model: 'fal-ai/flux-realism',
      description: 'Generación con profundidad de campo y texturas orgánicas.',
      hasKey: Boolean(keys.fal),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Proveedores de IA Concurrente ({selectedProviders.length} seleccionados)
          </h3>
        </div>
        <button
          id="manage-keys-link-btn"
          type="button"
          onClick={onOpenSettings}
          className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          <span>Configurar Claves</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {providerOptions.map((prov) => {
          const isSelected = selectedProviders.includes(prov.id);
          return (
            <div
              key={prov.id}
              id={`provider-checkbox-${prov.id}`}
              onClick={() => onToggleProvider(prov.id)}
              className={`relative flex flex-col p-3 rounded-xl border cursor-pointer select-none transition-all ${
                isSelected
                  ? 'border-amber-400/80 bg-neutral-900 shadow-md ring-1 ring-amber-400/30'
                  : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900/90 hover:border-neutral-700 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="text-amber-400">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 fill-amber-400/20" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-neutral-100">{prov.name}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                  {prov.badge}
                </span>
              </div>

              <p className="text-[11px] text-neutral-400 line-clamp-1 mb-2">{prov.description}</p>

              <div className="mt-auto flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                <span className="text-neutral-500 font-mono truncate max-w-[120px]">
                  {prov.model}
                </span>
                <span
                  className={`flex items-center space-x-1 ${
                    prov.hasKey ? 'text-emerald-400' : 'text-neutral-500'
                  }`}
                  title={prov.hasKey ? 'API Key configurada' : 'Modo simulación (sin key)'}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      prov.hasKey ? 'bg-emerald-400' : 'bg-neutral-600'
                    }`}
                  ></span>
                  <span>{prov.hasKey ? 'Key Activa' : 'Simulación'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
