# Dual AI Photo Editor

Editor Vite + React con endpoints server-side para Google Gemini y OpenAI. Las claves API nunca se envían al navegador ni se guardan en `localStorage`.

## Desarrollo local

Requisitos: Node.js 20 o superior.

1. Instalá dependencias con `npm install`.
2. Copiá `.env.example` como `.env`.
3. Completá `GEMINI_API_KEY` y `OPENAI_API_KEY`.
4. Ejecutá `npm run dev`.
5. Abrí `http://localhost:3000` y verificá `http://localhost:3000/api/health`.

El health check sólo informa si cada variable existe; nunca devuelve las claves.

## Deploy en Vercel

1. Importá este repositorio en Vercel.
2. En **Project Settings → Environment Variables**, agregá `GEMINI_API_KEY` y `OPENAI_API_KEY` para Production, Preview y Development según corresponda.
3. Desplegá nuevamente para que las funciones reciban las variables.
4. Verificá `/api/health`; `hasGoogleKey` y `hasOpenAiKey` deben ser `true`.
5. Probá un mensaje de texto en cada panel antes de probar imágenes.

No uses claves con prefijo `VITE_`: esas variables se incorporan al bundle público.

## Modelos

- Chat Gemini: `gemini-3.8-flash`, `gemini-3.5-flash-lite` y `gemini-3.1-pro-preview`.
- Imagen Gemini: `gemini-3.1-flash-image` con alternativas compatibles.
- Chat OpenAI: `gpt-5.6-sol`, `gpt-5.5` y `gpt-4o` mediante Responses API.
- Imagen OpenAI: `gpt-image-2` mediante Images Edit API.

La disponibilidad depende de la cuota y del nivel de acceso de cada cuenta API.
