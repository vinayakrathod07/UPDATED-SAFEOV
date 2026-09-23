import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API endpoint for SafeOV Elite AI Safety Companion
app.post('/api/guidance', async (req, res) => {
  try {
    const { message, location, address, language } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = language === 'en'
        ? 'Stay calm. Move toward a safe, well-lit public area. Emergency contacts have been notified.'
        : 'शांत रहें। सुरक्षित और उजाले वाले स्थान पर जाएं। आपातकालीन संपर्कों को सूचित कर दिया गया है।';
      return res.json({ reply: fallback });
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

    return res.json({ reply: replyText });
  } catch (err) {
    console.error('Gemini API Error in server.ts:', err);
    const fallback = 'शांत रहें। निकटतम सुरक्षित स्थान या पुलिस स्टेशन की ओर बढ़ें।';
    return res.json({ reply: fallback });
  }
});

// Serve static frontend build
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SafeOV Elite server running on http://0.0.0.0:${PORT}`);
});
