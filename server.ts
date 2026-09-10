import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;

interface ProviderRequest {
  providerId: 'google' | 'openai' | 'stability' | 'replicate' | 'fal';
  image: string; // base64 data url
  prompt: string;
}

interface ProviderResult {
  providerId: 'google' | 'openai' | 'stability' | 'replicate' | 'fal';
  providerName: string;
  modelName: string;
  status: 'success' | 'error' | 'simulated';
  imageUrl?: string;
  executionTimeMs: number;
  error?: string;
  notes?: string;
}

export async function createApp(options: { serveFrontend?: boolean } = {}) {
  const { serveFrontend = true } = options;
  const app = express();

  // Allow larger payload for high-resolution base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper to get GoogleGenAI client
  function getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Helper to parse base64 data URL without regex catastrophic backtracking on large strings
  function parseBase64Image(dataUri: string): { mimeType: string; base64: string } | null {
    if (!dataUri || typeof dataUri !== 'string') return null;
    const commaIdx = dataUri.indexOf(',');
    if (commaIdx === -1) {
      // If it's pure base64 without prefix
      return { mimeType: 'image/jpeg', base64: dataUri };
    }
    const header = dataUri.substring(0, commaIdx);
    const base64 = dataUri.substring(commaIdx + 1);
    const mimeMatch = header.match(/^data:([^;,]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    return { mimeType, base64 };
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGoogleKey: Boolean(process.env.GEMINI_API_KEY),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      hasStabilityKey: Boolean(process.env.STABILITY_API_KEY),
      hasReplicateKey: Boolean(process.env.REPLICATE_API_TOKEN),
      hasFalKey: Boolean(process.env.FAL_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Execute Google Imagen 3 Generative Restoration
  async function executeGoogle(image: string, prompt: string): Promise<ProviderResult> {
    const startTime = Date.now();
    const providerName = 'Google Gemini Image';
    const modelName = 'gemini-3.1-flash-image';
    if (!process.env.GEMINI_API_KEY) {
      return {
        providerId: 'google',
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: 'Gemini no está configurado en el servidor.',
      };
    }

    const ai = getGeminiClient();

    // Master photographic prompt with high creative strength, eliminating vintage color cast and generating real photographic textures
    const fullPhotographicPrompt = `High-end master photorealistic studio portrait restoration. Completely regenerate and rebuild this portrait from scratch with high creative strength.
CRITICAL REQUIREMENTS:
1. COMPLETE COLOR CAST ELIMINATION: Eliminate all vintage yellowing, sepia staining, faded orange/brown tint, scan artifacts, and aged monochromatic degradation. Restore rich, authentic modern studio color balance with healthy natural human skin undertones, neutral white eye scleras, and deep true blacks.
2. PHOTOGRAPHIC TEXTURE SYNTHESIS FROM SCRATCH: Generate genuine high-resolution photographic textures—individual hair strands, crisp eyelashes, moist reflective cornea and iris striations, natural dermal skin pores with authentic subsurface scattering (avoiding flat/airbrushed plastic smoothness), and crisp natural clothing fabric textures.
3. STRICT IDENTITY PRESERVATION: Accurately preserve the exact facial bone architecture, eye shape, nose contour, lip form, skull proportion, age, ethnicity, and emotional expression of the subject in the reference image.
4. OPTICAL MASTERY: Photographed on an 85mm f/1.4 prime portrait lens at 1/250s, ISO 100, professional key-light and soft rim-light studio setup, tack-sharp focal plane on the eyes, smooth natural bokeh.
User specific restoration directives: ${prompt}`;

    try {
      // Multimodal image editing with current Gemini image models.
      if (ai) {
        const parsed = parseBase64Image(image);
        const mimeType = parsed?.mimeType || 'image/jpeg';
        const base64Data = parsed?.base64 || image;

        const multimodalModels = ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-lite-image'];
        for (const candidateModel of multimodalModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType,
                    },
                  },
                  {
                    text: fullPhotographicPrompt,
                  },
                ],
              },
              config: {
                imageConfig: {
                  aspectRatio: '1:1',
                  imageSize: '1K',
                },
              } as any,
            });

            let restoredImageUrl: string | null = null;
            let notes = '';
            if (response.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  const outMime = part.inlineData.mimeType || 'image/jpeg';
                  restoredImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
                } else if (part.text) {
                  notes += part.text + ' ';
                }
              }
            }

            if (restoredImageUrl) {
              return {
                providerId: 'google',
                providerName,
                modelName: candidateModel,
                status: 'success',
                imageUrl: restoredImageUrl,
                executionTimeMs: Date.now() - startTime,
                notes: notes.trim() || `Generado con modelo visual de Google (${candidateModel}). Texturas y rostro regenerados desde cero.`,
              };
            }
          } catch (modelErr: any) {
            console.log(`[Google candidate ${candidateModel} failed]:`, modelErr.message);
          }
        }
      }

      throw new Error(
        'No se pudo editar la imagen con Gemini. Verificá la cuota y el acceso de la API key a modelos de imagen.'
      );
    } catch (err: any) {
      console.error('[Google Error]:', err.message);
      return {
        providerId: 'google',
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: err.message || 'Error al conectar con Google Gemini Image.',
      };
    }
  }

  // Execute OpenAI image restoration using the current image editing endpoint.
  async function executeOpenAI(image: string, prompt: string): Promise<ProviderResult> {
    const startTime = Date.now();
    const providerName = 'OpenAI GPT Image';
    const modelName = 'gpt-image-2';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        providerId: 'openai',
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: 'OpenAI no está configurado en el servidor.',
      };
    }

    try {
      const parsed = parseBase64Image(image);
      if (!parsed) throw new Error('La imagen recibida no tiene un formato válido.');

      const extension = parsed.mimeType.includes('png') ? 'png' : 'jpg';
      const formData = new FormData();
      formData.append(
        'image',
        new Blob([Buffer.from(parsed.base64, 'base64')], { type: parsed.mimeType }),
        `portrait.${extension}`
      );
      formData.append('model', modelName);
      formData.append(
        'prompt',
        `Restore and enhance this exact portrait while preserving identity and composition. ${prompt}. Natural skin texture, realistic detail and professional photographic color.`
      );
      formData.append('size', '1024x1024');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `OpenAI Error: ${response.statusText}`);
      }

      const b64 = data?.data?.[0]?.b64_json;
      const url = b64 ? `data:image/png;base64,${b64}` : data?.data?.[0]?.url;

      return {
        providerId: 'openai',
        providerName,
        modelName,
        status: 'success',
        imageUrl: url,
        executionTimeMs: Date.now() - startTime,
        notes: 'Imagen editada correctamente con OpenAI GPT Image.',
      };
    } catch (err: any) {
      console.error('[OpenAI Error]:', err.message);
      return {
        providerId: 'openai',
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: err.message || 'Error al conectar con OpenAI API.',
      };
    }
  }

  // Execute Stability AI SD3 / SDXL image-to-image
  async function executeStability(image: string, prompt: string): Promise<ProviderResult> {
    const startTime = Date.now();
    const providerName = 'Stability AI (SD3 / SDXL)';
    const modelName = 'sd3.5-large-restore';
    const apiKey = process.env.STABILITY_API_KEY;

    if (!apiKey) {
      return {
        providerId: 'stability',
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: 'Stability AI no está configurado en el servidor.',
      };
    }

    try {
      // Strip data url to buffer
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const formData = new FormData();
      formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'input.jpg');
      formData.append('prompt', `${prompt}, photo restoration, hyperrealistic skin, 85mm lens, sharp focus`);
      formData.append('output_format', 'png');
      formData.append('mode', 'image-to-image');
      formData.append('strength', '0.45'); // Keep original face structure

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'image/*',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Stability API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const outputB64 = Buffer.from(arrayBuffer).toString('base64');

      return {
        providerId: 'stability',
        providerName,
        modelName,
        status: 'success',
        imageUrl: `data:image/png;base64,${outputB64}`,
        executionTimeMs: Date.now() - startTime,
        notes: 'Restauración completada mediante Stability SD3 Image-to-Image.',
      };
    } catch (err: any) {
      console.error('[Stability Error]:', err.message);
      return {
        providerId: 'stability',
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: err.message || 'Error al conectar con Stability AI.',
      };
    }
  }

  // Execute Replicate / Fal.ai (Flux.1 / CodeFormer)
  async function executeReplicateOrFal(image: string, prompt: string, isFal = false): Promise<ProviderResult> {
    const startTime = Date.now();
    const providerId = isFal ? 'fal' : 'replicate';
    const providerName = isFal ? 'Fal.ai (Flux.1 / CodeFormer)' : 'Replicate (Flux / CodeFormer)';
    const modelName = isFal ? 'fal-ai/flux-realism' : 'sczhou/codeformer';
    const apiKey = isFal ? process.env.FAL_KEY : process.env.REPLICATE_API_TOKEN;

    if (!apiKey) {
      return {
        providerId,
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: `${isFal ? 'Fal.ai' : 'Replicate'} no está configurado en el servidor.`,
      };
    }

    try {
      if (isFal) {
        // Fal.ai API
        const response = await fetch('https://queue.fal.run/fal-ai/flux/dev/image-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Key ${apiKey}`,
          },
          body: JSON.stringify({
            image_url: image,
            prompt: `${prompt}, 85mm photo portrait, sharp focus, crystal clear eyes, natural skin tone`,
            strength: 0.4,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || data?.message || `Fal.ai Error: ${response.status}`);
        }

        const outUrl = data?.images?.[0]?.url || data?.image?.url;
        if (!outUrl) throw new Error('Fal.ai no devolvió URL de imagen.');

        return {
          providerId: 'fal',
          providerName,
          modelName,
          status: 'success',
          imageUrl: outUrl,
          executionTimeMs: Date.now() - startTime,
          notes: 'Restauración completada con Fal.ai Flux.1 Dev.',
        };
      } else {
        // Replicate API
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${apiKey}`,
          },
          body: JSON.stringify({
            version: '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c875db53abc05f250b7dd', // CodeFormer
            input: {
              image,
              codeformer_fidelity: 0.75,
              background_enhance: true,
              face_upsample: true,
              upscale: 2,
            },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || `Replicate Error: ${response.status}`);
        }

        // Poll for completion if needed
        let prediction = data;
        let attempts = 0;
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < 30) {
          await new Promise((r) => setTimeout(r, 1000));
          const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { Authorization: `Token ${apiKey}` },
          });
          prediction = await checkRes.json();
          attempts++;
        }

        if (prediction.status !== 'succeeded') {
          throw new Error(prediction.error || 'La predicción de Replicate no finalizó a tiempo.');
        }

        const outUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

        return {
          providerId: 'replicate',
          providerName,
          modelName,
          status: 'success',
          imageUrl: outUrl,
          executionTimeMs: Date.now() - startTime,
          notes: 'Restauración facial de alta fidelidad completada con CodeFormer en Replicate.',
        };
      }
    } catch (err: any) {
      console.error(`[${providerName} Error]:`, err.message);
      return {
        providerId,
        providerName,
        modelName,
        status: 'error',
        executionTimeMs: Date.now() - startTime,
        error: err.message || `Error al conectar con ${providerName}.`,
      };
    }
  }

  // Concurrent Execution Endpoint using Promise.allSettled
  app.post('/api/restore-concurrent', async (req, res) => {
    try {
      const {
        image,
        prompt,
        providers = ['google', 'openai', 'stability', 'replicate'],
      } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Se requiere una imagen en formato base64' });
      }

      console.log(`[CONCURRENT_ENGINE] Dispatching restore requests to: ${providers.join(', ')}`);

      // Prepare promise list
      const tasks: Promise<ProviderResult>[] = [];

      if (providers.includes('google')) {
        tasks.push(executeGoogle(image, prompt));
      }
      if (providers.includes('openai')) {
        tasks.push(executeOpenAI(image, prompt));
      }
      if (providers.includes('stability')) {
        tasks.push(executeStability(image, prompt));
      }
      if (providers.includes('replicate')) {
        tasks.push(executeReplicateOrFal(image, prompt, false));
      }
      if (providers.includes('fal')) {
        tasks.push(executeReplicateOrFal(image, prompt, true));
      }

      // Execute all concurrently with Promise.allSettled
      const settledResults = await Promise.allSettled(tasks);

      const formattedResults: ProviderResult[] = settledResults.map((r, idx) => {
        if (r.status === 'fulfilled') {
          return r.value;
        } else {
          return {
            providerId: providers[idx] || 'unknown',
            providerName: providers[idx] || 'Proveedor Desconocido',
            modelName: 'Error en despacho',
            status: 'error',
            executionTimeMs: 0,
            error: r.reason?.message || 'Fallo inesperado al ejecutar el proveedor',
          };
        }
      });

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        results: formattedResults,
      });
    } catch (err: any) {
      console.error('[CONCURRENT_DISPATCH_ERROR]', err);
      return res.status(500).json({
        error: err.message || 'Error general en el despachador concurrente',
      });
    }
  });

  // Single provider execute endpoint (for retrying individual cards)
  app.post('/api/restore-single', async (req, res) => {
    try {
      const { providerId, image, prompt } = req.body;
      if (!providerId || !image) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (providerId, image)' });
      }

      let result: ProviderResult;
      switch (providerId) {
        case 'google':
          result = await executeGoogle(image, prompt);
          break;
        case 'openai':
          result = await executeOpenAI(image, prompt);
          break;
        case 'stability':
          result = await executeStability(image, prompt);
          break;
        case 'replicate':
          result = await executeReplicateOrFal(image, prompt, false);
          break;
        case 'fal':
          result = await executeReplicateOrFal(image, prompt, true);
          break;
        default:
          return res.status(400).json({ error: `Proveedor no soportado: ${providerId}` });
      }

      return res.json({ success: true, result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Targeted Region Inpainting / Area Modification endpoint
  app.post('/api/edit-region', async (req, res) => {
    try {
      const { image, mask, regionBox, prompt, providerId = 'google' } = req.body;
      if (!image || !prompt) {
        return res.status(400).json({ error: 'Se requiere una imagen y una instrucción de modificación.' });
      }

      const startTime = Date.now();
      console.log(`[EDIT_REGION] Provider: ${providerId}, Prompt: ${prompt}`);

      // If provider is google
      if (providerId === 'google') {
        const ai = getGeminiClient();
        if (ai) {
          try {
            const parsed = parseBase64Image(image);
            const mimeType = parsed?.mimeType || 'image/jpeg';
            const base64Data = parsed?.base64 || image;

            let boxDescription = '';
            if (regionBox) {
              boxDescription = `Centered approximately around ${Math.round(regionBox.x + regionBox.width / 2)}% horizontally and ${Math.round(regionBox.y + regionBox.height / 2)}% vertically. `;
            }

            const targetedPrompt = `High-end photorealistic studio retouching and inpainting.\nFocus specifically on regenerating and modifying the selected region: ${boxDescription}\nModification instruction: "${prompt}"\nStrict constraints: Seamlessly blend the modified area into the surrounding skin, eyes, hair, or fabric. Match the exact photographic grain, 85mm lens depth of field, natural lighting, and skin texture. Keep all unselected parts of the portrait 100% identical. Return the newly rendered photograph.`;

            let editedImageUrl: string | null = null;
            let notes = '';

            const inpaintCandidates = ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-lite-image'];
            for (const candidate of inpaintCandidates) {
              try {
                const response = await ai.models.generateContent({
                  model: candidate,
                  contents: {
                    parts: [
                      {
                        inlineData: {
                          data: base64Data,
                          mimeType,
                        },
                      },
                      {
                        text: targetedPrompt,
                      },
                    ],
                  },
                  config: {
                    imageConfig: {
                      aspectRatio: '1:1',
                      imageSize: '1K',
                    },
                  } as any,
                });

                if (response.candidates?.[0]?.content?.parts) {
                  for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData?.data) {
                      const outMime = part.inlineData.mimeType || 'image/jpeg';
                      editedImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
                      break;
                    } else if (part.text) {
                      notes += part.text + ' ';
                    }
                  }
                }
                if (editedImageUrl) break;
              } catch (candidateErr: any) {
                console.warn(`[Inpaint candidate ${candidate} failed]:`, candidateErr.message);
              }
            }

            if (editedImageUrl) {
              return res.json({
                success: true,
                editedImage: editedImageUrl,
                notes: notes.trim() || 'Área modificada con éxito mediante Google Imagen.',
                executionTimeMs: Date.now() - startTime,
              });
            }
          } catch (gErr: any) {
            console.warn('[Gemini inpaint warning]:', gErr.message);
          }
        }
      }

      // Stability AI Inpainting
      if (providerId === 'stability' && process.env.STABILITY_API_KEY) {
        const apiKey = process.env.STABILITY_API_KEY;
        try {
          const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const formData = new FormData();
          formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg');

          if (mask) {
            const maskBase64 = mask.replace(/^data:image\/\w+;base64,/, '');
            const maskBuffer = Buffer.from(maskBase64, 'base64');
            formData.append('mask', new Blob([maskBuffer], { type: 'image/png' }), 'mask.png');
          }

          formData.append('prompt', prompt);
          formData.append('output_format', 'png');

          const sRes = await fetch('https://api.stability.ai/v2beta/stable-image/edit/inpaint', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'image/*',
            },
            body: formData,
          });

          if (sRes.ok) {
            const arrBuf = await sRes.arrayBuffer();
            const outB64 = Buffer.from(arrBuf).toString('base64');
            return res.json({
              success: true,
              editedImage: `data:image/png;base64,${outB64}`,
              notes: 'Área modificada con Stability Inpaint.',
              executionTimeMs: Date.now() - startTime,
            });
          }
        } catch (sErr: any) {
          console.warn('[Stability inpaint warning]:', sErr.message);
        }
      }

      return res.status(503).json({
        error: 'No hay un proveedor de edición configurado o el proveedor no pudo completar la operación.',
        executionTimeMs: Date.now() - startTime,
      });
    } catch (err: any) {
      console.error('[EDIT_REGION_ERROR]', err);
      return res.status(500).json({ error: err.message || 'Error al procesar la edición del área.' });
    }
  });

  // Google Gemini Chat Endpoint
  app.post('/api/chat/gemini', async (req, res) => {
    const startTime = Date.now();
    try {
      const { message, messages, image, model = 'gemini-3.8-flash' } = req.body;
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(401).json({
          error: 'Gemini no está configurado en el servidor. Agregá GEMINI_API_KEY en las variables de entorno.',
        });
      }

      // Build contents parts
      const parts: any[] = [];
      if (image && typeof image === 'string') {
        const parsed = parseBase64Image(image);
        if (parsed) {
          parts.push({
            inlineData: {
              data: parsed.base64,
              mimeType: parsed.mimeType,
            },
          });
        }
      }

      const promptText = message || (messages && messages[messages.length - 1]?.content) || '';
      parts.push({ text: promptText });

      // Call Gemini model with automatic resilient fallback and fast timeout protection
      const requested = model || 'gemini-3.8-flash';
      let modelCandidates: string[] = [];
      let thinkingConfig: any = undefined;

      if (requested === 'gemini-3.5-flash-lite') {
        modelCandidates = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      } else if (requested === 'gemini-3.8-flash') {
        modelCandidates = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
      } else if (requested === 'gemini-3.1-pro-preview') {
        modelCandidates = ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
      } else {
        modelCandidates = [requested, 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
      }

      // Deduplicate
      const uniqueCandidates = Array.from(new Set(modelCandidates));

      let response: any = null;
      let usedModel = uniqueCandidates[0];
      let lastError: any = null;

      for (const candidate of uniqueCandidates) {
        try {
          const timeoutMs =
            candidate === 'gemini-3.1-pro-preview'
              ? 16000
              : candidate === 'gemini-3.8-flash'
              ? 5000
              : 8000;
          const generatePromise = ai.models.generateContent({
            model: candidate,
            contents: { parts },
            config: thinkingConfig ? { thinkingConfig } : undefined,
          });

          response = await Promise.race([
            generatePromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout de ${timeoutMs}ms en modelo ${candidate}`)), timeoutMs)
            ),
          ]);

          usedModel = candidate;
          if (response?.candidates?.[0]?.content?.parts) {
            break;
          }
        } catch (candErr: any) {
          lastError = candErr;
          console.warn(`[Gemini Chat model ${candidate} failed/timeout]:`, candErr.message);
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      let replyText = '';
      let generatedImage: string | null = null;

      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            replyText += part.text;
          }
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/jpeg';
            generatedImage = `data:${mime};base64,${part.inlineData.data}`;
          }
        }
      }

      return res.json({
        success: true,
        provider: 'gemini',
        model: usedModel,
        reply: replyText || 'Respuesta generada por Gemini.',
        generatedImage,
        executionTimeMs: Date.now() - startTime,
      });
    } catch (err: any) {
      console.error('[GEMINI_CHAT_ERROR]', err);
      return res.status(500).json({
        error: err.message || 'Error al comunicarse con el modelo de Gemini.',
      });
    }
  });

  // OpenAI ChatGPT Endpoint
  app.post('/api/chat/chatgpt', async (req, res) => {
    const startTime = Date.now();
    try {
      const { message, messages, image, model = 'gpt-5.6-sol' } = req.body;
      const apiKey = process.env.OPENAI_API_KEY;

      const modelDisplayName =
        model === 'gpt-5.6-sol'
          ? 'GPT-5.6 Sol'
          : model === 'gpt-5.5'
          ? 'GPT-5.5'
          : model;

      const promptText = message || (messages && messages[messages.length - 1]?.content) || '';

      if (!apiKey) {
        return res.status(503).json({
          error: 'OpenAI no está configurado en el servidor. Agregá OPENAI_API_KEY en las variables de entorno.',
        });
      }

      const content: any[] = [{ type: 'input_text', text: promptText }];
      if (image && typeof image === 'string') {
        content.push({ type: 'input_image', image_url: image });
      }

      const openAiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions:
            'Sos un especialista en restauración fotográfica, remasterización digital de retratos históricos y fotografía de estudio. Respondé en español claro, con sugerencias técnicas precisas y concisas.',
          input: [{ role: 'user', content }],
          max_output_tokens: 1500,
          store: false,
        }),
      });

        if (!openAiRes.ok) {
          const errData = await openAiRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Error de OpenAI: HTTP ${openAiRes.status}`);
        }

        const data = await openAiRes.json();
        const replyText =
          data.output_text ||
          data.output
            ?.flatMap((item: any) => item.content || [])
            .filter((item: any) => item.type === 'output_text')
            .map((item: any) => item.text)
            .join('\n') ||
          '';

        return res.json({
          success: true,
          provider: 'chatgpt',
          model: modelDisplayName,
          reply: replyText,
          executionTimeMs: Date.now() - startTime,
        });
    } catch (err: any) {
      console.error('[CHATGPT_CHAT_ERROR]', err);
      return res.status(500).json({
        error: err.message || 'Error al comunicarse con OpenAI ChatGPT.',
      });
    }
  });

  // Vite middleware in development
  if (serveFrontend && process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (serveFrontend) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Multi-AI Photo Restorer Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
