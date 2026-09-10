import React, { useState } from 'react';
import { X, Sparkles, Key, Mail, User, Check, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { DualAuthState } from '../types';

interface DualAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authState: DualAuthState;
  onUpdateAuth: (newAuth: DualAuthState) => void;
}

export const DualAuthModal: React.FC<DualAuthModalProps> = ({
  isOpen,
  onClose,
  authState,
  onUpdateAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'chatgpt'>('gemini');

  // Local form states
  const [geminiEmail, setGeminiEmail] = useState(authState.gemini.email || 'alderpol@gmail.com');
  const [geminiName, setGeminiName] = useState(authState.gemini.name || 'Google User');
  const [geminiKey, setGeminiKey] = useState(authState.gemini.apiKey || '');

  const [chatgptEmail, setChatgptEmail] = useState(authState.chatgpt.email || 'alderpol@openai.com');
  const [chatgptName, setChatgptName] = useState(authState.chatgpt.name || 'OpenAI User');
  const [chatgptKey, setChatgptKey] = useState(authState.chatgpt.apiKey || '');

  if (!isOpen) return null;

  const handleGeminiLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DualAuthState = {
      ...authState,
      gemini: {
        email: geminiEmail,
        name: geminiName || 'Usuario Google',
        isLoggedIn: true,
        apiKey: geminiKey,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
    };
    onUpdateAuth(updated);
  };

  const handleGeminiLogout = () => {
    const updated: DualAuthState = {
      ...authState,
      gemini: {
        ...authState.gemini,
        isLoggedIn: false,
      },
    };
    onUpdateAuth(updated);
  };

  const handleChatgptLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DualAuthState = {
      ...authState,
      chatgpt: {
        email: chatgptEmail,
        name: chatgptName || 'Usuario ChatGPT',
        isLoggedIn: true,
        apiKey: chatgptKey,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      },
    };
    onUpdateAuth(updated);
  };

  const handleChatgptLogout = () => {
    const updated: DualAuthState = {
      ...authState,
      chatgpt: {
        ...authState.chatgpt,
        isLoggedIn: false,
      },
    };
    onUpdateAuth(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Cuentas & Conexión de IA</h3>
              <p className="text-[11px] text-neutral-400">Iniciar sesión en Google Gemini y OpenAI ChatGPT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border-b-2 ${
              activeTab === 'gemini'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Gemini</span>
            {authState.gemini.isLoggedIn && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chatgpt')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border-b-2 ${
              activeTab === 'chatgpt'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full border border-emerald-400 flex items-center justify-center text-[9px] font-bold">
              ⚡
            </div>
            <span>OpenAI ChatGPT</span>
            {authState.chatgpt.isLoggedIn && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
            )}
          </button>
        </div>

        {/* Tab contents */}
        <div className="p-6">
          {activeTab === 'gemini' ? (
            <div>
              <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-blue-950/20 border border-blue-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
                    G
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">
                      {authState.gemini.isLoggedIn
                        ? `Sesión activa: ${authState.gemini.name}`
                        : 'Google Gemini (Desconectado)'}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {authState.gemini.isLoggedIn
                        ? authState.gemini.email
                        : 'Conéctate para usar Gemini 3.8 Flash y 3.1 Pro'}
                    </p>
                  </div>
                </div>
                {authState.gemini.isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleGeminiLogout}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center space-x-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Cerrar</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleGeminiLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span>Correo de Google</span>
                  </label>
                  <input
                    type="email"
                    value={geminiEmail}
                    onChange={(e) => setGeminiEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    required
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-neutral-400" />
                    <span>Nombre de Usuario</span>
                  </label>
                  <input
                    type="text"
                    value={geminiName}
                    onChange={(e) => setGeminiName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Key className="w-3 h-3 text-neutral-400" />
                      <span>Gemini API Key (Opcional si usas el servidor)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400">Activo en servidor</span>
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy... (opcional)"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center space-x-2 transition-colors shadow-md shadow-blue-500/10"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {authState.gemini.isLoggedIn ? 'Guardar Cambios de Cuenta' : 'Iniciar Sesión en Google Gemini'}
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    ⚡
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">
                      {authState.chatgpt.isLoggedIn
                        ? `Sesión activa: ${authState.chatgpt.name}`
                        : 'OpenAI ChatGPT (Desconectado)'}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {authState.chatgpt.isLoggedIn
                        ? authState.chatgpt.email
                        : 'Conéctate para usar GPT-4o y visión avanzada'}
                    </p>
                  </div>
                </div>
                {authState.chatgpt.isLoggedIn && (
                  <button
                    type="button"
                    onClick={handleChatgptLogout}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center space-x-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Cerrar</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleChatgptLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span>Correo OpenAI</span>
                  </label>
                  <input
                    type="email"
                    value={chatgptEmail}
                    onChange={(e) => setChatgptEmail(e.target.value)}
                    placeholder="usuario@openai.com"
                    required
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-neutral-400" />
                    <span>Nombre de Usuario</span>
                  </label>
                  <input
                    type="text"
                    value={chatgptName}
                    onChange={(e) => setChatgptName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Key className="w-3 h-3 text-neutral-400" />
                      <span>OpenAI API Key (sk-...)</span>
                    </span>
                    <span className="text-[10px] text-neutral-500">Para GPT-4o directo</span>
                  </label>
                  <input
                    type="password"
                    value={chatgptKey}
                    onChange={(e) => setChatgptKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2 transition-colors shadow-md shadow-emerald-500/10"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {authState.chatgpt.isLoggedIn ? 'Guardar Cambios de Cuenta' : 'Iniciar Sesión en OpenAI ChatGPT'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center space-x-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Tus credenciales se guardan de forma segura en tu navegador</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-300 hover:text-white font-medium"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
