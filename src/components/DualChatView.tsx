import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  ImageIcon,
  X,
  RefreshCw,
  Sliders,
  Zap,
} from 'lucide-react';
import { ChatMessage, DualAuthState } from '../types';

interface DualChatViewProps {
  geminiMessages: ChatMessage[];
  chatgptMessages: ChatMessage[];
  isGeminiLoading: boolean;
  isChatgptLoading: boolean;
  onSendToBoth: (prompt: string) => void;
  onSendToGeminiOnly: (prompt: string) => void;
  onSendToChatgptOnly: (prompt: string) => void;
  onClearChats: () => void;
  attachedImage: string | null;
  onRemoveAttachedImage?: () => void;
  authState: DualAuthState;
  onOpenAuthModal: (tab?: 'gemini' | 'chatgpt') => void;
  currentPrompt: string;
  onChangePrompt: (val: string) => void;
  geminiModel: string;
  setGeminiModel: (m: string) => void;
  chatgptModel: string;
  setChatgptModel: (m: string) => void;
}

export const DualChatView: React.FC<DualChatViewProps> = ({
  geminiMessages,
  chatgptMessages,
  isGeminiLoading,
  isChatgptLoading,
  onSendToBoth,
  onSendToGeminiOnly,
  onSendToChatgptOnly,
  onClearChats,
  attachedImage,
  onRemoveAttachedImage,
  authState,
  onOpenAuthModal,
  currentPrompt,
  onChangePrompt,
  geminiModel,
  setGeminiModel,
  chatgptModel,
  setChatgptModel,
}) => {
  const geminiScrollRef = useRef<HTMLDivElement>(null);
  const chatgptScrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (geminiScrollRef.current) {
      geminiScrollRef.current.scrollTop = geminiScrollRef.current.scrollHeight;
    }
  }, [geminiMessages, isGeminiLoading]);

  useEffect(() => {
    if (chatgptScrollRef.current) {
      chatgptScrollRef.current.scrollTop = chatgptScrollRef.current.scrollHeight;
    }
  }, [chatgptMessages, isChatgptLoading]);

  const handleCopyMessage = (id: string, text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentPrompt.trim() && !isGeminiLoading && !isChatgptLoading) {
        onSendToBoth(currentPrompt);
      }
    }
  };

  const geminiModelsList = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Rápido)' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Razonamiento)' },
    { id: 'gemini-3.1-flash-image', name: 'Gemini Flash Image (Visual)' },
  ];

  const chatgptModelsList = [
    { id: 'gpt-4o', name: 'GPT-4o (Omni Visión)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Veloz)' },
    { id: 'dall-e-3', name: 'DALL-E 3 (Generador)' },
  ];

  return (
    <div className="flex flex-col h-[750px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Dual Status Bar */}
      <div className="px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-neutral-300 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Dual Chat Sincronizado en Vivo</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-neutral-800 text-[11px] text-neutral-400 border border-neutral-700/60">
            Envío simultáneo en paralelo
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClearChats}
            className="px-2.5 py-1 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors flex items-center space-x-1 text-[11px]"
            title="Limpiar ambos chats"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar Chats</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAuthModal()}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center space-x-1.5 text-[11px] font-medium transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Gestionar Cuentas / Login</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Chat Windows (Split View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 flex-1 min-h-0 bg-neutral-950/70">
        {/* ================= LEFT WINDOW: GOOGLE GEMINI ================= */}
        <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-neutral-950 via-neutral-950 to-blue-950/10">
          {/* Gemini Header */}
          <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-neutral-100">Google Gemini</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="bg-transparent text-[11px] text-blue-400/90 font-medium focus:outline-none cursor-pointer hover:underline"
                >
                  {geminiModelsList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-neutral-900 text-neutral-200">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gemini Login badge */}
            <button
              type="button"
              onClick={() => onOpenAuthModal('gemini')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors flex items-center space-x-1 ${
                authState.gemini.isLoggedIn
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="max-w-[110px] truncate">
                {authState.gemini.isLoggedIn ? authState.gemini.name : 'Iniciar Sesión'}
              </span>
            </button>
          </div>

          {/* Gemini Message Stream */}
          <div
            ref={geminiScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth"
          >
            {geminiMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-semibold text-neutral-300 mb-1">
                  Gemini está listo para recibir tu prompt
                </h4>
                <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
                  Haz clic en una de las fotos de muestra a la izquierda o escribe un mensaje. Gemini responderá aquí con análisis óptico y generación.
                </p>
              </div>
            ) : (
              geminiMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 px-1">
                      <span>{isUser ? 'Tú' : 'Gemini'}</span>
                      {msg.model && <span className="font-mono text-blue-400/80">({msg.model})</span>}
                      {msg.executionTimeMs && (
                        <span className="text-amber-400/90">⚡ {(msg.executionTimeMs / 1000).toFixed(2)}s</span>
                      )}
                    </div>

                    <div
                      className={`relative max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : msg.isError
                          ? 'bg-red-950/50 border border-red-800 text-red-200'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {/* Attached user image preview */}
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[180px]">
                          <img
                            src={msg.image}
                            alt="Foto adjunta"
                            referrerPolicy="no-referrer"
                            className="w-full h-auto object-cover max-h-32"
                          />
                        </div>
                      )}

                      {/* Message body */}
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Rendered image from Gemini if present */}
                      {msg.generatedImage && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-neutral-700/80 bg-black/40">
                          <img
                            src={msg.generatedImage}
                            alt="Imagen generada por Gemini"
                            referrerPolicy="no-referrer"
                            className="w-full h-auto object-contain max-h-60"
                          />
                          <div className="p-2 bg-neutral-950 flex items-center justify-between">
                            <span className="text-[10px] text-neutral-400">Resultado generado por Gemini</span>
                            <a
                              href={msg.generatedImage}
                              download="gemini-restoration.png"
                              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] flex items-center space-x-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Descargar</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Copy button */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading indicator */}
            {isGeminiLoading && (
              <div className="flex items-center space-x-2 text-xs text-blue-400 p-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                <span className="animate-pulse">Gemini está procesando y respondiendo...</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT WINDOW: OPENAI CHATGPT ================= */}
        <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-neutral-950 via-neutral-950 to-emerald-950/10">
          {/* ChatGPT Header */}
          <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                ⚡
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-neutral-100">OpenAI ChatGPT</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <select
                  value={chatgptModel}
                  onChange={(e) => setChatgptModel(e.target.value)}
                  className="bg-transparent text-[11px] text-emerald-400/90 font-medium focus:outline-none cursor-pointer hover:underline"
                >
                  {chatgptModelsList.map((m) => (
                    <option key={m.id} value={m.id} className="bg-neutral-900 text-neutral-200">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ChatGPT Login badge */}
            <button
              type="button"
              onClick={() => onOpenAuthModal('chatgpt')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors flex items-center space-x-1 ${
                authState.chatgpt.isLoggedIn
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="max-w-[110px] truncate">
                {authState.chatgpt.isLoggedIn ? authState.chatgpt.name : 'Iniciar Sesión'}
              </span>
            </button>
          </div>

          {/* ChatGPT Message Stream */}
          <div
            ref={chatgptScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth"
          >
            {chatgptMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <span className="text-xl">⚡</span>
                </div>
                <h4 className="text-xs font-semibold text-neutral-300 mb-1">
                  ChatGPT está listo para recibir tu prompt
                </h4>
                <p className="text-[11px] text-neutral-400 max-w-xs leading-relaxed">
                  Al enviar o pegar un prompt, ChatGPT responderá en paralelo con su propia perspectiva y directivas técnicas de remasterización.
                </p>
              </div>
            ) : (
              chatgptMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] text-neutral-400 px-1">
                      <span>{isUser ? 'Tú' : 'ChatGPT'}</span>
                      {msg.model && <span className="font-mono text-emerald-400/80">({msg.model})</span>}
                      {msg.executionTimeMs && (
                        <span className="text-amber-400/90">⚡ {(msg.executionTimeMs / 1000).toFixed(2)}s</span>
                      )}
                    </div>

                    <div
                      className={`relative max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : msg.isError
                          ? 'bg-red-950/50 border border-red-800 text-red-200'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {/* Attached user image preview */}
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[180px]">
                          <img
                            src={msg.image}
                            alt="Foto adjunta"
                            referrerPolicy="no-referrer"
                            className="w-full h-auto object-cover max-h-32"
                          />
                        </div>
                      )}

                      {/* Message body */}
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Copy button */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading indicator */}
            {isChatgptLoading && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 p-2">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <span className="animate-pulse">ChatGPT está redactando su respuesta...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SYNCHRONIZED MASTER INPUT BAR ================= */}
      <div className="p-3.5 bg-neutral-900/95 border-t border-neutral-800/90">
        {/* Attached image pill if uploaded */}
        {attachedImage && (
          <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-5 h-5 rounded overflow-hidden border border-neutral-600 shrink-0">
                <img
                  src={attachedImage}
                  alt="Miniatura"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate text-[11px] text-neutral-300">
                Retrato adjunto: Se enviará a ambos modelos para análisis visual simultáneo
              </span>
            </div>
            {onRemoveAttachedImage && (
              <button
                type="button"
                onClick={onRemoveAttachedImage}
                className="text-neutral-400 hover:text-red-400 ml-2 p-0.5"
                title="Quitar imagen adjunta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Master Input Box */}
        <div className="relative">
          <textarea
            id="dual-master-chat-input"
            rows={2}
            value={currentPrompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un prompt aquí o haz clic en una imagen de ejemplo a la izquierda para enviar a ambos chats..."
            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none transition-all"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-[11px] text-neutral-400">
            <span>Presiona Enter para enviar a ambos</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Send only to Gemini */}
            <button
              type="button"
              onClick={() => onSendToGeminiOnly(currentPrompt)}
              disabled={!currentPrompt.trim() || isGeminiLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Solo a Gemini
            </button>

            {/* Send only to ChatGPT */}
            <button
              type="button"
              onClick={() => onSendToChatgptOnly(currentPrompt)}
              disabled={!currentPrompt.trim() || isChatgptLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Solo a ChatGPT
            </button>

            {/* Primary: Send to BOTH */}
            <button
              id="send-to-both-chats-btn"
              type="button"
              onClick={() => onSendToBoth(currentPrompt)}
              disabled={!currentPrompt.trim() || (isGeminiLoading && isChatgptLoading)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-neutral-950 hover:opacity-95 shadow-md shadow-amber-400/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar a Ambos Chats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
