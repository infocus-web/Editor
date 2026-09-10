import { GoogleGenAI } from '@google/genai';

const ALLOWED_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro-preview',
]);

function parseImage(dataUri: string) {
  const commaIndex = dataUri.indexOf(',');
  if (commaIndex === -1) return { mimeType: 'image/jpeg', data: dataUri };
  const header = dataUri.slice(0, commaIndex);
  return {
    mimeType: header.match(/^data:([^;,]+)/)?.[1] || 'image/jpeg',
    data: dataUri.slice(commaIndex + 1),
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Gemini no está configurado en el servidor. Agregá GEMINI_API_KEY en Vercel.',
    });
  }

  try {
    const { message = '', image, model = 'gemini-3.8-flash' } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error: 'El mensaje está vacío.' });

    const selectedModel = ALLOWED_MODELS.has(model) ? model : 'gemini-3.8-flash';
    const parts: any[] = [];
    if (typeof image === 'string' && image) {
      const parsed = parseImage(image);
      parts.push({ inlineData: parsed });
    }
    parts.push({ text: message });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [{ role: 'user', parts }],
    });

    const responseParts = response.candidates?.[0]?.content?.parts || [];
    const reply = responseParts.map((part: any) => part.text || '').filter(Boolean).join('\n');
    const generatedPart = responseParts.find((part: any) => part.inlineData?.data);
    const generatedImage = generatedPart
      ? `data:${generatedPart.inlineData.mimeType || 'image/jpeg'};base64,${generatedPart.inlineData.data}`
      : null;

    return res.status(200).json({
      success: true,
      provider: 'gemini',
      model: selectedModel,
      reply: reply || 'Gemini no devolvió contenido de texto.',
      generatedImage,
    });
  } catch (error: any) {
    console.error('[GEMINI_CHAT_ERROR]', error);
    return res.status(500).json({ error: error?.message || 'Error al comunicarse con Gemini.' });
  }
}
