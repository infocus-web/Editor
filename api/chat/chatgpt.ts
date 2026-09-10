const ALLOWED_MODELS = new Set(['gpt-5.6-sol', 'gpt-5.5', 'gpt-4o']);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OpenAI no está configurado en el servidor. Agregá OPENAI_API_KEY en Vercel.',
    });
  }

  try {
    const { message = '', image, model = 'gpt-5.6-sol' } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error: 'El mensaje está vacío.' });

    const selectedModel = ALLOWED_MODELS.has(model) ? model : 'gpt-5.6-sol';
    const content: any[] = [{ type: 'input_text', text: message }];
    if (typeof image === 'string' && image) {
      content.push({ type: 'input_image', image_url: image });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        instructions:
          'Sos especialista en restauración fotográfica y retratos históricos. Respondé en español claro, con sugerencias precisas y concisas.',
        input: [{ role: 'user', content }],
        max_output_tokens: 1500,
        store: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `OpenAI respondió HTTP ${response.status}.`);
    }

    const reply =
      data.output_text ||
      data.output
        ?.flatMap((item: any) => item.content || [])
        .filter((item: any) => item.type === 'output_text')
        .map((item: any) => item.text)
        .join('\n') ||
      '';

    return res.status(200).json({
      success: true,
      provider: 'chatgpt',
      model: selectedModel,
      reply: reply || 'OpenAI no devolvió contenido de texto.',
    });
  } catch (error: any) {
    console.error('[OPENAI_CHAT_ERROR]', error);
    return res.status(500).json({ error: error?.message || 'Error al comunicarse con OpenAI.' });
  }
}
