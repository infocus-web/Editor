export default function handler(_req: any, res: any) {
  return res.status(200).json({
    status: 'ok',
    hasGoogleKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
