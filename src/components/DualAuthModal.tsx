import React from 'react';
import { CheckCircle2, CircleAlert, Server, ShieldCheck, X } from 'lucide-react';
import { DualAuthState } from '../types';

interface DualAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authState: DualAuthState;
}

export const DualAuthModal: React.FC<DualAuthModalProps> = ({ isOpen, onClose, authState }) => {
  if (!isOpen) return null;

  const providers = [
    { name: 'Google Gemini', env: 'GEMINI_API_KEY', ready: authState.gemini.isLoggedIn },
    { name: 'OpenAI', env: 'OPENAI_API_KEY', ready: authState.chatgpt.isLoggedIn },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Estado de proveedores</h3>
              <p className="text-[11px] text-neutral-400">Las claves se administran de forma segura en el servidor</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {providers.map((provider) => (
            <div key={provider.env} className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-semibold text-neutral-100">{provider.name}</p>
                  <p className="text-[11px] font-mono text-neutral-500">{provider.env}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${provider.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
                {provider.ready ? <CheckCircle2 className="w-4 h-4" /> : <CircleAlert className="w-4 h-4" />}
                <span>{provider.ready ? 'Configurado' : 'Falta configurar'}</span>
              </div>
            </div>
          ))}

          <p className="pt-2 text-xs leading-relaxed text-neutral-400">
            Configurá estas variables en Vercel → Project Settings → Environment Variables. Nunca pegues claves API en el navegador ni las publiques en GitHub.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
