import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';
import { UserApiKeys } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: UserApiKeys;
  onSaveKeys: (newKeys: UserApiKeys) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  keys,
  onSaveKeys,
}) => {
  const [formData, setFormData] = useState<UserApiKeys>({ ...keys });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleShowKey = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field: keyof UserApiKeys, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val.trim() }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="settings-modal-dialog"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-100">
                Configuración de Claves API
              </h3>
              <p className="text-xs text-neutral-400">
                Se guardan de forma privada en el almacenamiento local de tu navegador.
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
            <span>
              <strong>Llamadas Concurrentes:</strong> Si una clave no está presente, esa tarjeta ejecutará una simulación de restauración en canvas para que puedas comparar la interfaz y el flujo sin bloqueos.
            </span>
          </div>

          {/* Google Gemini / AI Studio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Google Gemini / Imagen 3 API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Obtener en AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                id="input-key-google"
                type={showKeys['google'] ? 'text' : 'password'}
                value={formData.google}
                onChange={(e) => handleChange('google', e.target.value)}
                placeholder="AIzaSy... (o usa la inyectada por defecto)"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('google')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showKeys['google'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span>OpenAI API Key (DALL-E 3)</span>
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-green-400 hover:underline flex items-center space-x-1"
              >
                <span>Obtener en OpenAI</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                id="input-key-openai"
                type={showKeys['openai'] ? 'text' : 'password'}
                value={formData.openai}
                onChange={(e) => handleChange('openai', e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('openai')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showKeys['openai'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Stability AI */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>Stability AI Key (SD3.5 / SDXL)</span>
              </label>
              <a
                href="https://platform.stability.ai/account/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-400 hover:underline flex items-center space-x-1"
              >
                <span>Obtener en Stability</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                id="input-key-stability"
                type={showKeys['stability'] ? 'text' : 'password'}
                value={formData.stability}
                onChange={(e) => handleChange('stability', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('stability')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showKeys['stability'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Replicate Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Replicate API Token (CodeFormer / Flux)</span>
              </label>
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Obtener en Replicate</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                id="input-key-replicate"
                type={showKeys['replicate'] ? 'text' : 'password'}
                value={formData.replicate}
                onChange={(e) => handleChange('replicate', e.target.value)}
                placeholder="r8_..."
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('replicate')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showKeys['replicate'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Fal.ai Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span>Fal.ai Key (Flux.1 Dev)</span>
              </label>
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-orange-400 hover:underline flex items-center space-x-1"
              >
                <span>Obtener en Fal.ai</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                id="input-key-fal"
                type={showKeys['fal'] ? 'text' : 'password'}
                value={formData.fal}
                onChange={(e) => handleChange('fal', e.target.value)}
                placeholder="Key ..."
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('fal')}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showKeys['fal'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-neutral-800">
            <button
              id="cancel-settings-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-keys-btn"
              type="submit"
              className="px-5 py-2 text-sm font-medium text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md flex items-center space-x-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardado</span>
                </>
              ) : (
                <span>Guardar Configuración</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
