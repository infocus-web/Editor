import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Key,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Send,
  LogIn,
  Check,
} from 'lucide-react';
import {
  SamplePortrait,
  ChatMessage,
  DualAuthState,
} from './types';
import { UploadZone } from './components/UploadZone';
import { PromptEditor, MASTER_PROMPT_DEFAULT } from './components/PromptEditor';
import { DualChatView } from './components/DualChatView';
import { DualAuthModal } from './components/DualAuthModal';

const DEFAULT_AUTH: DualAuthState = {
  gemini: {
    email: 'alderpol@gmail.com',
    name: 'Usuario Google',
    isLoggedIn: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  chatgpt: {
    email: 'alderpol@openai.com',
    name: 'Usuario ChatGPT',
    isLoggedIn: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
};

const INITIAL_GEMINI_MESSAGE: ChatMessage = {
  id: 'g-welcome',
  sender: 'gemini',
  content:
    '¡Hola! Soy Google Gemini. Puedo analizar tu retrato con visión computacional de alta resolución, restaurar detalles faciales perdidos con fidelidad absoluta y aplicar estilos de época fotográfica (85mm, Kodachrome, daguerrotipo).\n\nHaz clic en cualquier foto de ejemplo a la izquierda o escribe un mensaje para enviarlo en paralelo.',
  timestamp: Date.now(),
  model: 'gemini-3.8-flash',
};

const INITIAL_CHATGPT_MESSAGE: ChatMessage = {
  id: 'c-welcome',
  sender: 'chatgpt',
  content:
    '¡Hola! Soy ChatGPT con GPT-4o. Estoy configurado para examinar fotos antiguas, diagnosticar velos sepia, grano y arañazos, y guiar remasterizaciones ópticas de nivel profesional.\n\nAl seleccionar una muestra o escribir en la barra inferior, recibiré tu prompt simultáneamente junto a Gemini.',
  timestamp: Date.now(),
  model: 'gpt-4o',
};

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(MASTER_PROMPT_DEFAULT);
  const [activeStyleTitle, setActiveStyleTitle] = useState<string | null>(null);
  const [lastPastedSampleTitle, setLastPastedSampleTitle] = useState<string | null>(null);

  // Dual Chat Messages & State
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([INITIAL_GEMINI_MESSAGE]);
  const [chatgptMessages, setChatgptMessages] = useState<ChatMessage[]>([INITIAL_CHATGPT_MESSAGE]);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isChatgptLoading, setIsChatgptLoading] = useState(false);

  // Model selectors
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [chatgptModel, setChatgptModel] = useState('gpt-4o');

  // Auth State
  const [authState, setAuthState] = useState<DualAuthState>(() => {
    try {
      const stored = localStorage.getItem('dual_chat_auth');
      return stored ? JSON.parse(stored) : DEFAULT_AUTH;
    } catch {
      return DEFAULT_AUTH;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleUpdateAuth = (newAuth: DualAuthState) => {
    setAuthState(newAuth);
    try {
      localStorage.setItem('dual_chat_auth', JSON.stringify(newAuth));
    } catch (e) {
      console.error('Error saving auth to localStorage', e);
    }
  };

  // Dispatch message to Gemini
  const sendToGemini = async (promptText: string, imageToUse: string | null) => {
    setIsGeminiLoading(true);
    const userMsgId = 'u-gem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: promptText,
      image: imageToUse || undefined,
      timestamp: Date.now(),
    };
    setGeminiMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          image: imageToUse,
          model: geminiModel,
          customKey: authState.gemini.apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con Gemini');
      }

      const botMsg: ChatMessage = {
        id: 'g-' + Date.now(),
        sender: 'gemini',
        content: data.reply || 'Respuesta generada por Gemini.',
        generatedImage: data.generatedImage,
        model: data.model || geminiModel,
        executionTimeMs: data.executionTimeMs,
        timestamp: Date.now(),
      };
      setGeminiMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: 'g-err-' + Date.now(),
        sender: 'gemini',
        content: `❌ Error en Gemini: ${err.message}`,
        isError: true,
        timestamp: Date.now(),
      };
      setGeminiMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Dispatch message to ChatGPT
  const sendToChatgpt = async (promptText: string, imageToUse: string | null) => {
    setIsChatgptLoading(true);
    const userMsgId = 'u-gpt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: promptText,
      image: imageToUse || undefined,
      timestamp: Date.now(),
    };
    setChatgptMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          image: imageToUse,
          model: chatgptModel,
          customKey: authState.chatgpt.apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con ChatGPT');
      }

      const botMsg: ChatMessage = {
        id: 'c-' + Date.now(),
        sender: 'chatgpt',
        content: data.reply || 'Respuesta generada por ChatGPT.',
        model: data.model || chatgptModel,
        executionTimeMs: data.executionTimeMs,
        simulated: data.simulated,
        timestamp: Date.now(),
      };
      setChatgptMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: 'c-err-' + Date.now(),
        sender: 'chatgpt',
        content: `❌ Error en ChatGPT: ${err.message}`,
        isError: true,
        timestamp: Date.now(),
      };
      setChatgptMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatgptLoading(false);
    }
  };

  // Send concurrently to BOTH Gemini & ChatGPT
  const handleSendToBoth = (promptText: string) => {
    if (!promptText.trim()) return;
    sendToGemini(promptText, originalImage);
    sendToChatgpt(promptText, originalImage);
  };

  // When clicking an example image: paste its prompt AND dispatch to both chats simultaneously!
  const handleApplySamplePrompt = (sample: SamplePortrait) => {
    setSelectedSampleId(sample.id);
    setPrompt(sample.fullPrompt);
    setActiveStyleTitle(sample.title);
    setLastPastedSampleTitle(sample.title);

    // Immediate concurrent dispatch to both chats!
    sendToGemini(sample.fullPrompt, originalImage);
    sendToChatgpt(sample.fullPrompt, originalImage);

    // Auto-clear toast notice after 3 seconds
    setTimeout(() => {
      setLastPastedSampleTitle((prev) => (prev === sample.title ? null : prev));
    }, 3000);
  };

  // Optional: load sample image if user has no photo
  const handleLoadSampleImage = (sample: SamplePortrait) => {
    setSelectedSampleId(sample.id);
    setImageMeta({ name: sample.title, size: 'Muestra Web' });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setOriginalImage(dataUrl);
      }
    };
    img.src = sample.url;
  };

  const handleClearChats = () => {
    setGeminiMessages([INITIAL_GEMINI_MESSAGE]);
    setChatgptMessages([INITIAL_CHATGPT_MESSAGE]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-400/20 selection:text-amber-200">
      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-amber-400 to-emerald-500 p-0.5 shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-100">
                  Dual AI Chat: Gemini + ChatGPT
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                  En Vivo Simultáneo
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Envía tus prompts a Google Gemini y OpenAI ChatGPT al mismo tiempo con dos ventanas de chat sincronizadas
              </p>
            </div>
          </div>

          {/* Right Header: Login Status & Management */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Gemini status */}
            <div
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-300 cursor-pointer hover:bg-blue-900/40 transition-colors"
              title="Cuenta Google Gemini"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Gemini: {authState.gemini.isLoggedIn ? 'Conectado' : 'Sin sesión'}</span>
            </div>

            {/* Quick ChatGPT status */}
            <div
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300 cursor-pointer hover:bg-emerald-900/40 transition-colors"
              title="Cuenta OpenAI ChatGPT"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>ChatGPT: {authState.chatgpt.isLoggedIn ? 'Conectado' : 'Sin sesión'}</span>
            </div>

            {/* Main Auth Button */}
            <button
              id="header-auth-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 border border-neutral-700/80 flex items-center space-x-2 transition-all hover:border-neutral-600 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Login & Cuentas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Photo Upload & Samples Presets (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Upload Zone */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>1. Retrato para Análisis & Restauración</span>
                </h2>
                {imageMeta && (
                  <span className="text-[11px] text-neutral-400 font-mono">{imageMeta.size}</span>
                )}
              </div>
              <UploadZone
                originalImage={originalImage}
                onImageSelected={(b64, info) => {
                  setOriginalImage(b64);
                  if (info) setImageMeta(info);
                  setSelectedSampleId(null);
                }}
                onClearImage={() => {
                  setOriginalImage(null);
                  setImageMeta(null);
                  setSelectedSampleId(null);
                }}
                onApplySamplePrompt={handleApplySamplePrompt}
                onLoadSampleImage={handleLoadSampleImage}
                selectedSampleId={selectedSampleId}
                lastPastedSampleTitle={lastPastedSampleTitle}
              />
            </div>

            {/* Master Prompt Input */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm">
              <PromptEditor
                prompt={prompt}
                onChange={(newVal) => {
                  setPrompt(newVal);
                  if (activeStyleTitle && newVal !== prompt) {
                    setActiveStyleTitle(null);
                  }
                }}
                onReset={() => {
                  setPrompt(MASTER_PROMPT_DEFAULT);
                  setActiveStyleTitle(null);
                }}
                activeStyleTitle={activeStyleTitle}
              />

              {/* Instant Dispatch Button from Prompt Box */}
              <button
                type="button"
                onClick={() => handleSendToBoth(prompt)}
                disabled={!prompt.trim() || isGeminiLoading || isChatgptLoading}
                className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center space-x-2 transition-all shadow-md shadow-amber-400/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar este Prompt a Ambos Chats</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dual Side-by-Side Live Chat (8 cols) */}
          <div className="lg:col-span-8">
            <DualChatView
              geminiMessages={geminiMessages}
              chatgptMessages={chatgptMessages}
              isGeminiLoading={isGeminiLoading}
              isChatgptLoading={isChatgptLoading}
              onSendToBoth={handleSendToBoth}
              onSendToGeminiOnly={(p) => sendToGemini(p, originalImage)}
              onSendToChatgptOnly={(p) => sendToChatgpt(p, originalImage)}
              onClearChats={handleClearChats}
              attachedImage={originalImage}
              onRemoveAttachedImage={() => {
                setOriginalImage(null);
                setImageMeta(null);
              }}
              authState={authState}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              currentPrompt={prompt}
              onChangePrompt={setPrompt}
              geminiModel={geminiModel}
              setGeminiModel={setGeminiModel}
              chatgptModel={chatgptModel}
              setChatgptModel={setChatgptModel}
            />
          </div>
        </div>
      </main>

      {/* Login & Account Credentials Modal */}
      <DualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authState={authState}
        onUpdateAuth={handleUpdateAuth}
      />
    </div>
  );
}
