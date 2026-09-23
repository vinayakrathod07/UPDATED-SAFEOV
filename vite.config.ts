import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function safeovApiPlugin(): Plugin {
  return {
    name: 'safeov-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/guidance' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { message, location, address, language } = data;

              const apiKey = process.env.GEMINI_API_KEY;
              if (!apiKey) {
                const fallbackReply = (language === 'en')
                  ? 'Stay calm. Move toward a well-lit crowded area or the nearest police station. Emergency contacts have been notified.'
                  : 'शांत रहें। सुरक्षित और उजाले वाले स्थान पर जाएं। आपातकालीन संपर्कों को आपकी लोकेशन भेज दी गई है।';
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: fallbackReply }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const userText = message || 'Emergency SOS triggered! Guide me to safety.';
              const locationStr = location
                ? `Latitude: ${location.latitude}, Longitude: ${location.longitude}`
                : 'Coordinates unavailable';
              const addressStr = address ? `Address: ${address}` : 'Address unknown';

              const prompt = `Emergency Alert Triggered.
User situation / speech: "${userText}"
User GPS Location: ${locationStr}
Reverse Geocoded Location: ${addressStr}
Language requested: ${language === 'en' ? 'English' : 'Hindi (Devanagari)'}

Provide immediate, calm, direct tactical safety instructions. Keep it under 2-3 sentences.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: {
                  systemInstruction: "You are 'SafeOV Elite', an advanced AI safety companion. If Hindi is requested, respond in authentic Hindi using Devanagari script. If English, respond in clear, direct English. Provide calm, reassuring, yet decisive safety commands (e.g. 'शांत रहें। 50 मीटर आगे मुख्य सड़क की ओर बढ़ें। पुलिस स्टेशन निकट है।').",
                },
              });

              const replyText = response.text || (
                language === 'en'
                  ? 'Stay calm and move to a safe, public place. Help is on the way.'
                  : 'शांत रहें और सुरक्षित स्थान पर जाएं। मदद रास्ते में है।'
              );

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: replyText }));
            } catch (err: any) {
              console.error('Gemini API Error:', err);
              const fallback = 'शांत रहें। निकटतम सुरक्षित स्थान या पुलिस स्टेशन की ओर बढ़ें।';
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ reply: fallback }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), safeovApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
