import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Paintbrush,
  Square,
  RotateCcw,
  Sparkles,
  Eraser,
  Check,
  Split,
  Eye,
  Layers,
  Wand2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ProviderId, RegionBox, UserApiKeys } from '../types';
import { SplitSlider } from './SplitSlider';
import { simulateRegionInpainting } from '../utils/imageSimulation';

interface RegionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  providerId: ProviderId;
  providerName: string;
  apiKeys: UserApiKeys;
  onSaveModifiedImage: (providerId: ProviderId, newImageUrl: string) => void;
}

type ToolMode = 'brush' | 'box';

export const RegionEditorModal: React.FC<RegionEditorModalProps> = ({
  isOpen,
  onClose,
  image,
  providerId,
  providerName,
  apiKeys,
  onSaveModifiedImage,
}) => {
  const [toolMode, setToolMode] = useState<ToolMode>('brush');
  const [brushSize, setBrushSize] = useState<number>(28);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>(
    'Eliminar rasguño restante y restaurar con textura de piel fotorrealista y poros naturales.'
  );
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(providerId);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [boxSelection, setBoxSelection] = useState<RegionBox | null>(null);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);

  // Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Synchronize canvas dimensions with source image
  useEffect(() => {
    if (!isOpen || !image) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      // Base canvas
      const baseCanvas = baseCanvasRef.current;
      if (baseCanvas) {
        baseCanvas.width = w;
        baseCanvas.height = h;
        const ctx = baseCanvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      }

      // Mask canvas (stores the black & white mask: white = selected area)
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        maskCanvas.width = w;
        maskCanvas.height = h;
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
          mCtx.fillStyle = '#000000';
          mCtx.fillRect(0, 0, w, h);
        }
      }

      // Display visualizer canvas
      const dispCanvas = displayCanvasRef.current;
      if (dispCanvas) {
        dispCanvas.width = w;
        dispCanvas.height = h;
      }

      redrawDisplay();
      setHasMask(false);
      setBoxSelection(null);
      setPreviewResult(null);
      setShowComparison(false);
      setErrorMessage(null);
    };
    img.src = image;
  }, [isOpen, image]);

  // Redraws the visual display: Base image + translucent amber highlight over mask
  const redrawDisplay = useCallback(() => {
    const dispCanvas = displayCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!dispCanvas || !baseCanvas || !maskCanvas) return;

    const ctx = dispCanvas.getContext('2d');
    if (!ctx) return;

    const w = dispCanvas.width;
    const h = dispCanvas.height;

    // 1. Draw base photo
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseCanvas, 0, 0);

    // 2. Draw amber glowing overlay for masked areas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    // Draw amber fill
    tCtx.fillStyle = 'rgba(251, 191, 36, 0.45)';
    tCtx.fillRect(0, 0, w, h);

    // Mask with maskCanvas
    tCtx.globalCompositeOperation = 'destination-in';
    tCtx.drawImage(maskCanvas, 0, 0);

    // Draw overlay on top of base
    ctx.drawImage(tempCanvas, 0, 0);

    // 3. If box selection exists, draw border outline
    if (boxSelection) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(boxSelection.x, boxSelection.y, boxSelection.width, boxSelection.height);
      ctx.setLineDash([]);
    }
  }, [boxSelection]);

  // Coordinates helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Mouse Handlers for Painting & Box Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);

    if (toolMode === 'brush') {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const mCtx = maskCanvas.getContext('2d');
      if (!mCtx) return;

      mCtx.beginPath();
      mCtx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      mCtx.fillStyle = isEraser ? '#000000' : '#FFFFFF';
      mCtx.fill();

      setHasMask(true);
      redrawDisplay();
    } else if (toolMode === 'box') {
      setBoxStart(coords);
      setBoxSelection({ x: coords.x, y: coords.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    if (toolMode === 'brush') {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const mCtx = maskCanvas.getContext('2d');
      if (!mCtx) return;

      mCtx.beginPath();
      mCtx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      mCtx.fillStyle = isEraser ? '#000000' : '#FFFFFF';
      mCtx.fill();

      setHasMask(true);
      redrawDisplay();
    } else if (toolMode === 'box' && boxStart) {
      const x = Math.min(boxStart.x, coords.x);
      const y = Math.min(boxStart.y, coords.y);
      const width = Math.abs(coords.x - boxStart.x);
      const height = Math.abs(coords.y - boxStart.y);

      setBoxSelection({ x, y, width, height });

      // Fill mask canvas with box
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
          mCtx.fillStyle = '#000000';
          mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
          mCtx.fillStyle = '#FFFFFF';
          mCtx.fillRect(x, y, width, height);
          setHasMask(true);
        }
      }
      redrawDisplay();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setBoxStart(null);
    redrawDisplay();
  };

  // Clear mask
  const handleClearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        mCtx.fillStyle = '#000000';
        mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }
    setHasMask(false);
    setBoxSelection(null);
    redrawDisplay();
  };

  // Preset prompts
  const quickSuggestions = [
    'Eliminar rasguño blanco y restaurar textura de piel',
    'Aumentar nitidez del ojo e iris con brillo natural',
    'Suavizar arrugas y poros de la frente',
    'Reconstruir detalle y simetría de los labios',
    'Reparar mancha oscura y unificar tono',
  ];

  // Execute inpainting on the region
  const handleApplyModification = async () => {
    if (!hasMask && !boxSelection) {
      setErrorMessage('Selecciona primero un área con el pincel o la caja de selección.');
      return;
    }
    if (!prompt.trim()) {
      setErrorMessage('Ingresa las instrucciones de modificación para el área seleccionada.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const maskCanvas = maskCanvasRef.current;
      const maskDataUrl = maskCanvas ? maskCanvas.toDataURL('image/png') : '';

      // Prepare normalized box if available
      let normalizedBox = null;
      if (boxSelection && maskCanvas) {
        normalizedBox = {
          x: (boxSelection.x / maskCanvas.width) * 100,
          y: (boxSelection.y / maskCanvas.height) * 100,
          width: (boxSelection.width / maskCanvas.width) * 100,
          height: (boxSelection.height / maskCanvas.height) * 100,
        };
      }

      // Call inpainting API endpoint
      const response = await fetch('/api/edit-region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          mask: maskDataUrl,
          regionBox: normalizedBox,
          prompt,
          providerId: selectedProvider,
        }),
      });

      const data = await response.json();

      let resultImg = data.editedImage;
      if (!resultImg || data.simulated) {
        // Run localized inpainting simulation on canvas
        resultImg = await simulateRegionInpainting(image, maskDataUrl, normalizedBox, prompt);
      }

      setPreviewResult(resultImg);
      setShowComparison(true);
    } catch (err: any) {
      console.error('[INPAINTING_ERROR]', err);
      // Fallback
      const maskCanvas = maskCanvasRef.current;
      const maskDataUrl = maskCanvas ? maskCanvas.toDataURL('image/png') : '';
      const fallbackImg = await simulateRegionInpainting(image, maskDataUrl, null, prompt);
      setPreviewResult(fallbackImg);
      setShowComparison(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save modified image back to the board
  const handleSaveToBoard = () => {
    if (!previewResult) return;
    onSaveModifiedImage(selectedProvider, previewResult);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="region-editor-modal"
        className="relative w-full max-w-6xl max-h-[95vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Hidden internal working canvases */}
        <canvas ref={baseCanvasRef} className="hidden" />
        <canvas ref={maskCanvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/95">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
                <span>Herramienta de Edición y Retoque de Área Específica</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Inpainting Dirigido
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Pinta o enmarca la zona deseada e indica a la IA qué modificar exclusivamente en esa área.
              </p>
            </div>
          </div>

          <button
            id="close-region-modal-btn"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Canvas Work Area (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              {/* Tool Mode Selectors */}
              <div className="flex items-center space-x-1">
                <button
                  id="tool-brush-btn"
                  onClick={() => {
                    setToolMode('brush');
                    setIsEraser(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    toolMode === 'brush' && !isEraser
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Pincel</span>
                </button>

                <button
                  id="tool-eraser-btn"
                  onClick={() => {
                    setToolMode('brush');
                    setIsEraser(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    toolMode === 'brush' && isEraser
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Borrador</span>
                </button>

                <button
                  id="tool-box-btn"
                  onClick={() => {
                    setToolMode('box');
                    setIsEraser(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                    toolMode === 'box'
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Caja Rectangular</span>
                </button>
              </div>

              {/* Brush size slider */}
              {toolMode === 'brush' && (
                <div className="flex items-center space-x-2 text-xs text-neutral-400">
                  <span>Tamaño:</span>
                  <input
                    id="brush-size-slider"
                    type="range"
                    min="8"
                    max="70"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-neutral-300 w-6 text-right">{brushSize}px</span>
                </div>
              )}

              {/* Clear mask button */}
              <button
                id="clear-mask-btn"
                onClick={handleClearMask}
                disabled={!hasMask}
                className="px-2.5 py-1 text-xs text-neutral-400 hover:text-red-400 disabled:opacity-30 flex items-center space-x-1 transition-colors"
                title="Limpiar toda la selección"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </div>

            {/* Canvas Stage */}
            <div
              ref={containerRef}
              className="relative w-full aspect-[4/3] max-h-[460px] bg-black rounded-2xl border border-neutral-800 overflow-hidden flex items-center justify-center select-none"
            >
              {showComparison && previewResult ? (
                <div className="w-full h-full">
                  <SplitSlider
                    originalImage={image}
                    restoredImage={previewResult}
                    providerName="ÁREA EDITADA"
                    className="w-full h-full"
                  />
                  <button
                    onClick={() => setShowComparison(false)}
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-xs text-neutral-300 hover:text-white backdrop-blur-md flex items-center space-x-1.5 shadow-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Volver a Editar Máscara</span>
                  </button>
                </div>
              ) : (
                <canvas
                  id="drawing-interactive-canvas"
                  ref={displayCanvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`max-w-full max-h-full object-contain ${
                    toolMode === 'brush' ? 'cursor-crosshair' : 'cursor-cell'
                  }`}
                />
              )}

              {/* Floating Instructions Helper */}
              {!hasMask && !showComparison && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/80 border border-neutral-700/80 text-[11px] text-amber-300 pointer-events-none backdrop-blur-md flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>Usa el cursor sobre la foto para pintar o enmarcar la zona a retocar</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Control Panel: Text Box & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Targeted Modification Text Box */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="region-prompt-textarea"
                  className="text-xs font-semibold text-neutral-200 flex items-center space-x-1.5 uppercase tracking-wider"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Instrucciones para el Área Seleccionada</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {hasMask ? 'Área Marcada' : 'Sin Selección'}
                </span>
              </div>

              <textarea
                id="region-prompt-textarea"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Indica qué deseas cambiar en la zona seleccionada (ej: 'Eliminar el arañazo blanco y rellenar con textura natural de piel', 'Hacer el iris de los ojos más cristalino y nítido')..."
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-y leading-relaxed"
              />

              {/* Quick suggestion tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-neutral-400">Sugerencias rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(sug)}
                      className="px-2.5 py-1 text-[11px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-800 hover:border-amber-400/40 rounded-lg transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider for Inpainting */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Modelo de IA para el Retoque</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('google')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    selectedProvider === 'google'
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <p className="font-semibold">Google Imagen 3</p>
                  <p className="text-[10px] text-neutral-500">Gemini Inpaint</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('stability')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    selectedProvider === 'stability'
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <p className="font-semibold">Stability AI</p>
                  <p className="text-[10px] text-neutral-500">SD3.5 Inpainting</p>
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                id="apply-region-edit-btn"
                onClick={handleApplyModification}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aplicando modificación al área seleccionada...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Aplicar Modificación al Área</span>
                  </>
                )}
              </button>

              {previewResult && (
                <div className="flex items-center space-x-2">
                  <button
                    id="toggle-preview-compare-btn"
                    onClick={() => setShowComparison((prev) => !prev)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>{showComparison ? 'Ver Máscara' : 'Comparar Deslizador'}</span>
                  </button>

                  <button
                    id="save-region-to-board-btn"
                    onClick={handleSaveToBoard}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center space-x-1.5 transition-colors shadow-md"
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardado!</span>
                      </>
                    ) : (
                      <span>Guardar en Tablero</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
