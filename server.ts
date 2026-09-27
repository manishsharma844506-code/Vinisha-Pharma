import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// In-memory display session authoritative cache for dual-screen
let currentDisplaySession = {
  state: 'idle',
  billNumber: '',
  items: [],
  subtotal: 0,
  taxAmount: 0,
  discountAmount: 0,
  grandTotal: 0,
  totalSavings: 0,
  lastUpdated: Date.now()
};

// SSE clients for Patient Displays
const sseClients = new Set<express.Response>();

// Display session API
app.get('/api/display/session', (_req, res) => {
  res.json(currentDisplaySession);
});

app.post('/api/display/session', (req, res) => {
  currentDisplaySession = {
    ...currentDisplaySession,
    ...req.body,
    lastUpdated: Date.now()
  };

  // Broadcast to all SSE connected displays
  const payload = `data: ${JSON.stringify(currentDisplaySession)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }

  res.json({ success: true, session: currentDisplaySession });
});

// SSE endpoint for live customer displays
app.get('/api/display/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(currentDisplaySession)}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Vinisha Pharma',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// AI Pharmacy Operations Assistant Proxy
app.post('/api/ai/assistant', async (req, res) => {
  const { message, context, history, searchGrounding } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(200).json({
      reply: null,
      message: 'GEMINI_API_KEY not configured. Falling back to local intelligence.'
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({});

    const systemInstruction = `You are the Vinisha Pharma Operational Assistant for the head pharmacist and retail staff.
YOUR PURPOSE:
Assist with retail pharmacy operations: stock level inquiries, expiry warnings, sales analysis, reorder suggestions, and financial summaries based EXCLUSIVELY on the provided database facts.
When web search grounding is enabled, you may cite official CDSCO, NPPA, WHO, or drug authority guidelines for Indian retail pharmacy.

STRICT MEDICAL SAFETY RULES:
1. NEVER diagnose patient medical conditions.
2. NEVER prescribe prescription medicines (Schedule H / H1 / X).
3. NEVER fabricate medical claims, interactions, or inventory numbers.
4. Clearly distinguish between database facts, calculations, and operational suggestions.
5. If the user asks for clinical diagnoses or personal medical prescription, remind them to consult a registered medical practitioner.

LIVE PHARMACY DATABASE CONTEXT:
${JSON.stringify(context?.systemContext || {}, null, 2)}
`;

    const chatContents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.role === 'user' || h.role === 'assistant') {
          chatContents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          });
        }
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const config: any = {
      systemInstruction,
      temperature: 0.3
    };

    if (searchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config
    });

    const reply = response.text || 'Unable to generate operational summary.';

    const sources: Array<{ title: string; url: string }> = [];
    const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
    if (groundingMetadata && Array.isArray(groundingMetadata.groundingChunks)) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri
          });
        }
      }
    }

    res.json({ reply, sources });
  } catch (err: any) {
    console.error('Gemini API assistant error:', err);
    res.status(200).json({
      reply: null,
      error: err.message
    });
  }
});

// AI Image Generation & Editing for Pharmacy Signage & Promos
app.post('/api/ai/image', async (req, res) => {
  const { prompt, aspectRatio = '1:1', referenceImage } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    return;
  }

  try {
    const ai = new GoogleGenAI({});
    const contents: any[] = [];

    if (referenceImage) {
      const base64Data = referenceImage.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      } as any
    });

    let imageUrl: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      res.status(500).json({ error: 'No image was generated by model.' });
      return;
    }

    res.json({ imageUrl, description: response.text || '' });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// Mount Vite middleware in dev or serve static in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Vinisha Pharma server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
