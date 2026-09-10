import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Settings2,
  Key,
  Trophy,
  Download,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Split,
  Eye,
  Camera,
} from 'lucide-react';
import {
  ProviderId,
  ProviderResultState,
  UserApiKeys,
  SamplePortrait,
  LightboxState,
  RegionEditState,
} from './types';
import { UploadZone } from './components/UploadZone';
import { PromptEditor, MASTER_PROMPT_DEFAULT } from './components/PromptEditor';
import { ProviderSelector } from './components/ProviderSelector';
import { ProviderCard } from './components/ProviderCard';
import { SettingsModal } from './components/SettingsModal';
import { LightboxModal } from './components/LightboxModal';
import { RegionEditorModal } from './components/RegionEditorModal';
import { simulateRestoration } from './utils/imageSimulation';
import { SAMPLE_PORTRAITS } from './utils/samples';

const INITIAL_PROVIDERS: ProviderId[] = ['google', 'openai', 'stability', 'replicate'];

const PROVIDER_INFO: Record<ProviderId, { name: string; model: string }> = {
  google: { name: 'Google Imagen 3', model: 'gemini-3.1-flash-lite-image / Imagen' },
  openai: { name: 'OpenAI DALL-E 3', model: 'dall-e-3 / gpt-image' },
  stability: { name: 'Stability AI', model: 'SD3.5 Large / SDXL' },
  replicate: { name: 'Replicate (CodeFormer)', model: 'sczhou/codeformer' },
  fal: { name: 'Fal.ai (Flux.1 Dev)', model: 'fal-ai/flux-realism' },
};

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(MASTER_PROMPT_DEFAULT);
  const [selectedProviders, setSelectedProviders] = useState<ProviderId[]>(INITIAL_PROVIDERS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // User API Keys stored in localStorage
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({
    google: '',
    openai: '',
    stability: '',
    replicate: '',
    fal: '',
  });

  // Results state per provider
  const [providerResults, setProviderResults] = useState<Record<ProviderId, ProviderResultState>>({
    google: {
      id: 'google',
      name: PROVIDER_INFO.google.name,
      model: PROVIDER_INFO.google.model,
      status: 'idle',
    },
    openai: {
      id: 'openai',
      name: PROVIDER_INFO.openai.name,
      model: PROVIDER_INFO.openai.model,
      status: 'idle',
    },
    stability: {
      id: 'stability',
      name: PROVIDER_INFO.stability.name,
      model: PROVIDER_INFO.stability.model,
      status: 'idle',
    },
    replicate: {
      id: 'replicate',
      name: PROVIDER_INFO.replicate.name,
      model: PROVIDER_INFO.replicate.model,
      status: 'idle',
    },
    fal: {
      id: 'fal',
      name: PROVIDER_INFO.fal.name,
      model: PROVIDER_INFO.fal.model,
      status: 'idle',
    },
  });

  // Lightbox Modal state
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    originalImage: '',
    restoredImage: '',
    zoom: 1,
  });

  // Region Editor Modal state (Targeted Inpainting)
  const [regionEditor, setRegionEditor] = useState<RegionEditState>({
    isOpen: false,
    providerId: 'google',
    providerName: 'Google Imagen 3',
    image: '',
  });

  // Load stored API keys on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('multi_ai_keys');
      if (stored) {
        setApiKeys(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading API keys from localStorage', e);
    }
  }, []);

  const handleSaveKeys = (newKeys: UserApiKeys) => {
    setApiKeys(newKeys);
    try {
      localStorage.setItem('multi_ai_keys', JSON.stringify(newKeys));
    } catch (e) {
      console.error('Error saving API keys', e);
    }
  };

  const handleToggleProvider = (id: ProviderId) => {
    setSelectedProviders((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((p) => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectSample = (sample: SamplePortrait) => {
    setSelectedSampleId(sample.id);
    setImageMeta({ name: sample.title, size: 'Muestra Web' });

    // Convert sample url to base64 via canvas for reliable upload
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

    if (sample.recommendedPromptAddon && !prompt.includes(sample.recommendedPromptAddon)) {
      setPrompt(`${MASTER_PROMPT_DEFAULT}\n\nNota de preservación: ${sample.recommendedPromptAddon}`);
    }
  };

  // Concurrent Execution via Promise.allSettled
  const handleGenerateAll = async () => {
    if (!originalImage) {
      alert('Por favor carga una fotografía antes de generar.');
      return;
    }
    if (selectedProviders.length === 0) {
      alert('Selecciona al menos un proveedor de IA.');
      return;
    }

    setIsGeneratingAll(true);
    setWinnerId(null);

    // Set selected cards to loading
    setProviderResults((prev) => {
      const updated = { ...prev };
      selectedProviders.forEach((id) => {
        updated[id] = {
          ...updated[id],
          status: 'loading',
          error: undefined,
        };
      });
      return updated;
    });

    try {
      // Send concurrent request to backend
      const response = await fetch('/api/restore-concurrent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: originalImage,
          prompt,
          providers: selectedProviders,
          keys: apiKeys,
        }),
      });

      const data = await response.json();

      if (response.ok && data.results) {
        // Process results
        for (const item of data.results) {
          const id = item.providerId as ProviderId;

          // If result status was simulated, generate crisp client-side preview
          let finalImg = item.imageUrl;
          if (item.status === 'simulated' && !finalImg) {
            finalImg = await simulateRestoration(originalImage, id, prompt);
          }

          setProviderResults((prev) => ({
            ...prev,
            [id]: {
              id,
              name: item.providerName || PROVIDER_INFO[id]?.name || id,
              model: item.modelName || PROVIDER_INFO[id]?.model || '',
              status: item.status,
              imageUrl: finalImg,
              executionTimeMs: item.executionTimeMs,
              error: item.error,
              notes: item.notes,
            },
          }));
        }
      } else {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }
    } catch (err: any) {
      console.error('[CONCURRENT_ERROR]', err);
      // Fallback: run simulated restoration locally for each so the user can inspect results
      for (const id of selectedProviders) {
        const simImg = await simulateRestoration(originalImage, id, prompt);
        setProviderResults((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            status: 'simulated',
            imageUrl: simImg,
            executionTimeMs: 1200,
            notes: 'Filtro de simulación en canvas aplicado.',
          },
        }));
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Retry a single card
  const handleRetrySingle = async (providerId: string) => {
    if (!originalImage) return;
    const id = providerId as ProviderId;

    setProviderResults((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'loading', error: undefined },
    }));

    try {
      const response = await fetch('/api/restore-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: id,
          image: originalImage,
          prompt,
          customKey: apiKeys[id as keyof UserApiKeys],
        }),
      });
      const data = await response.json();

      if (response.ok && data.result) {
        let finalImg = data.result.imageUrl;
        if (data.result.status === 'simulated' && !finalImg) {
          finalImg = await simulateRestoration(originalImage, id, prompt);
        }
        setProviderResults((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            status: data.result.status,
            imageUrl: finalImg,
            executionTimeMs: data.result.executionTimeMs,
            error: data.result.error,
            notes: data.result.notes,
          },
        }));
      } else {
        throw new Error(data.error || 'Error al reintentar proveedor.');
      }
    } catch (err: any) {
      const simImg = await simulateRestoration(originalImage, id, prompt);
      setProviderResults((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'simulated',
          imageUrl: simImg,
          error: undefined,
          notes: 'Simulación aplicada.',
        },
      }));
    }
  };

  // Open inspection modal
  const handleOpenLightbox = (result: ProviderResultState) => {
    if (!originalImage || !result.imageUrl) return;
    setLightbox({
      isOpen: true,
      providerId: result.id,
      providerName: result.name,
      modelName: result.model,
      originalImage,
      restoredImage: result.imageUrl,
      zoom: 1,
    });
  };

  // Download image file
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Mark winner
  const handleSelectWinner = (id: string) => {
    setWinnerId((prev) => (prev === id ? null : id));
  };

  // Open region editor
  const handleOpenRegionEditor = (result: ProviderResultState) => {
    if (!result.imageUrl) return;
    setRegionEditor({
      isOpen: true,
      providerId: result.id,
      providerName: result.name,
      image: result.imageUrl,
    });
  };

  const handleOpenRegionEditorFromLightbox = (
    providerId: ProviderId,
    image: string,
    providerName: string
  ) => {
    setRegionEditor({
      isOpen: true,
      providerId,
      providerName,
      image,
    });
  };

  // Save modified inpaint image
  const handleSaveModifiedImage = (providerId: ProviderId, newImageUrl: string) => {
    setProviderResults((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        imageUrl: newImageUrl,
        notes: 'Área retocada con inpainting.',
      },
    }));
  };

  // Count active keys
  const configuredKeysCount = Object.values(apiKeys).filter(
    (k) => typeof k === 'string' && Boolean(k.trim())
  ).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
      {/* Top Navigation Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center text-neutral-950">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-neutral-100 tracking-tight">
                  Multi-AI Photo Restorer & Comparator
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  Concurrente
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Compara en paralelo Google Imagen 3, OpenAI DALL-E, Stability AI y Replicate/Fal
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            <button
              id="header-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 border border-neutral-700/80 flex items-center space-x-2 transition-all hover:border-neutral-600 shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Claves API</span>
              {configuredKeysCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] flex items-center justify-center font-bold">
                  {configuredKeysCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload & Master Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Upload Zone */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>1. Cargar Retrato Vintage / Dañado</span>
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
                onSelectSample={handleSelectSample}
                selectedSampleId={selectedSampleId}
              />
            </div>

            {/* Master Prompt Input */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm">
              <PromptEditor
                prompt={prompt}
                onChange={setPrompt}
                onReset={() => setPrompt(MASTER_PROMPT_DEFAULT)}
              />
            </div>

            {/* Provider Selector Checkboxes */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-sm">
              <ProviderSelector
                selectedProviders={selectedProviders}
                onToggleProvider={handleToggleProvider}
                keys={apiKeys}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>

            {/* Master Action Button */}
            <button
              id="generate-all-btn"
              onClick={handleGenerateAll}
              disabled={!originalImage || isGeneratingAll || selectedProviders.length === 0}
              className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2.5 transition-all shadow-xl ${
                !originalImage || selectedProviders.length === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/40'
                  : isGeneratingAll
                  ? 'bg-amber-500 text-neutral-950 animate-pulse'
                  : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-400/10 hover:shadow-amber-400/20 active:scale-[0.99]'
              }`}
            >
              {isGeneratingAll ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                  <span>Despachando {selectedProviders.length} IAs en paralelo...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Generar y Restaurar Todo ({selectedProviders.length} IAs)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Split Screen Comparison Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Dashboard Header Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
              <div className="flex items-center space-x-2">
                <Split className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                  Panel de Comparación Simultánea
                </h3>
              </div>
              {winnerId && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                  <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Ganadora: {providerResults[winnerId as ProviderId]?.name}</span>
                </div>
              )}
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side: Original Image Sticky Preview */}
              <div className="flex flex-col rounded-2xl border border-neutral-800/90 bg-neutral-900/80 overflow-hidden shadow-sm md:sticky md:top-24 max-h-[480px]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/90">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                    <span>ORIGINAL (Entrada Única)</span>
                  </span>
                  {originalImage && (
                    <button
                      id="view-original-full-btn"
                      onClick={() =>
                        handleOpenLightbox({
                          id: 'google',
                          name: 'Original',
                          model: 'Entrada base',
                          status: 'success',
                          imageUrl: originalImage,
                        })
                      }
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspeccionar</span>
                    </button>
                  )}
                </div>

                <div className="relative aspect-[4/3] w-full bg-neutral-950 flex items-center justify-center p-2 overflow-hidden">
                  {originalImage ? (
                    <img
                      src={originalImage}
                      alt="Original subida"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-6 text-neutral-600 flex flex-col items-center">
                      <Camera className="w-8 h-8 mb-2 stroke-1 text-neutral-700" />
                      <p className="text-xs text-neutral-400">Sin imagen cargada</p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Arrastra una foto a la izquierda
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>Referencia constante para pixel-peeping</span>
                  <span className="font-mono text-neutral-500">100% Sin Modificar</span>
                </div>
              </div>

              {/* Right Side: Generated AI Cards Grid */}
              <div className="space-y-4">
                {selectedProviders.map((id) => (
                  <ProviderCard
                    key={id}
                    result={providerResults[id]}
                    onOpenLightbox={handleOpenLightbox}
                    onOpenRegionEditor={handleOpenRegionEditor}
                    onDownload={handleDownload}
                    onSelectWinner={handleSelectWinner}
                    onRetrySingle={handleRetrySingle}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    isWinner={winnerId === id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        keys={apiKeys}
        onSaveKeys={handleSaveKeys}
      />

      {/* Lightbox / Pixel-Peeping Modal */}
      <LightboxModal
        state={lightbox}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
        onDownload={handleDownload}
        onOpenRegionEditor={handleOpenRegionEditorFromLightbox}
      />

      {/* Region / Area Inpainting Retouch Modal */}
      <RegionEditorModal
        isOpen={regionEditor.isOpen}
        onClose={() => setRegionEditor((prev) => ({ ...prev, isOpen: false }))}
        image={regionEditor.image}
        providerId={regionEditor.providerId}
        providerName={regionEditor.providerName}
        apiKeys={apiKeys}
        onSaveModifiedImage={handleSaveModifiedImage}
      />
    </div>
  );
}
