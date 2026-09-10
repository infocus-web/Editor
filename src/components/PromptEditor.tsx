import React, { useState } from 'react';
import { Wand2, RotateCcw, Sliders, Copy, Check, Sparkles } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  onChange: (value: string) => void;
  onReset: () => void;
  activeStyleTitle?: string | null;
}

export const MASTER_PROMPT_DEFAULT =
  'Master photograph restoration of the subject portrait. Preserve exact facial identity, bone contours, eye structure, and expression with absolute fidelity. Reconstruct in the style of an 85mm f/1.4 portrait prime lens photograph. Remove all scratches, film grain noise, dust specks, and compression artifacts. Generate authentic, lifelike skin texture with natural pores and subsurface scattering. Render subtle, creamy bokeh background depth with professional studio rim lighting. Ultra-detailed, 8K photorealistic preservation.';

export const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  onChange,
  onReset,
  activeStyleTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const quickTokens = [
    { label: '85mm f/1.4 Lens', value: ', 85mm f/1.4 lens bokeh' },
    { label: 'Preservar Identidad', value: ', preserve exact facial likeness and expressions' },
    { label: 'Eliminar Arañazos', value: ', flawlessly inpaint tears and white scratches' },
    { label: 'Piel Fotorrealista', value: ', authentic natural skin pores, realistic textures' },
    { label: 'Colorizar Época', value: ', historically accurate natural colorization' },
    { label: 'Iluminación Rem', value: ', studio softbox portrait lighting' },
  ];

  const handleAppendToken = (token: string) => {
    if (!prompt.includes(token.trim())) {
      onChange(prompt.trim() + token);
    }
  };

  const handleCopyPrompt = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="master-prompt-textarea"
          className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5 uppercase tracking-wider"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Master Prompt de Restauración & Estilo</span>
        </label>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center space-x-1 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-800"
            title="Copiar prompt actual al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            id="reset-prompt-btn"
            type="button"
            onClick={onReset}
            className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center space-x-1 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-800"
            title="Restablecer al prompt maestro estándar"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {activeStyleTitle && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/25 text-xs text-amber-300 animate-fade-in">
          <div className="flex items-center space-x-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Prompt activo de ejemplo: <strong>{activeStyleTitle}</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400/80 shrink-0 ml-2">Pegado</span>
        </div>
      )}

      <div className="relative">
        <textarea
          id="master-prompt-textarea"
          rows={3}
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe o selecciona un prompt de las fotos de ejemplo..."
          className="w-full px-3.5 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 transition-all leading-relaxed resize-y"
        />
      </div>

      {/* Quick Modifier Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] text-neutral-500 flex items-center space-x-1 mr-1">
          <Sliders className="w-3 h-3" />
          <span>Añadir:</span>
        </span>
        {quickTokens.map((tok, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAppendToken(tok.value)}
            className="px-2.5 py-1 text-[11px] font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 rounded-lg hover:text-amber-300 hover:border-amber-400/40 transition-colors"
          >
            + {tok.label}
          </button>
        ))}
      </div>
    </div>
  );
};
