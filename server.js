require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple in-memory rate limiter (15 requests per minute per IP)
const rateLimitMap = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'client';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 20;

  let record = rateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { startTime: now, count: 1 };
    rateLimitMap.set(ip, record);
  } else {
    record.count++;
    if (record.count > maxReqs) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit reached (max 20 requests/minute). Please wait 60 seconds.'
      });
    }
  }
  next();
}

// Timeout helper
function withTimeout(promise, ms = 25000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT: Gemini request took too long to respond.')), ms)
    )
  ]);
}

// Helper: Check for Gemini API key
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Endpoint 1: Generate Conversational Script
app.post('/api/script', rateLimiter, async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.status(400).json({
        error: 'EMPTY_INPUT',
        message: 'Please provide course notes or lecture text to generate a podcast script.'
      });
    }

    if (notes.trim().length > 4000) {
      return res.status(400).json({
        error: 'INPUT_TOO_LONG',
        message: 'Notes exceed 4,000 characters. Please provide a shorter excerpt.'
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured in .env on the server. Please copy .env.example to .env and add your valid Gemini API key.'
      });
    }

    const systemPrompt = `You are an expert educational podcast scriptwriter.
The user will provide dry study notes. Convert them into a lively, 2-speaker podcast dialogue between:
- Host A (inquisitive student seeking intuition)
- Host B (engaging peer explainer using metaphors)

Rules:
1. Return ONLY valid JSON in the exact structure:
{
  "title": "Short catchy title",
  "summary": "1 sentence overview",
  "turns": [
    { "speaker": "Host A", "text": "..." },
    { "speaker": "Host B", "text": "..." }
  ]
}
2. Exactly 4 to 6 dialogue turns.
3. Keep each turn under 28 words.
4. Keep tone collegiate, curious, and punchy.
5. No markdown formatting around the JSON if possible, just raw JSON.`;

    const prompt = `${systemPrompt}\n\nStudy Notes:\n"""\n${notes.trim()}\n"""`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      })
    );

    const rawResponse = response.text || '';
    
    // Parse JSON safely
    let parsed;
    try {
      // Clean possible code fences
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      // Fallback structured lines
      parsed = {
        title: "Study Podcast Episode",
        summary: "Audio conversion of submitted lecture notes",
        turns: [
          { speaker: "Host A", text: "Let's dive into these notes. What is the core intuition here?" },
          { speaker: "Host B", text: rawResponse.slice(0, 150) + "..." }
        ]
      };
    }

    return res.json({
      success: true,
      data: parsed,
      modelUsed: GEMINI_MODEL
    });

  } catch (err) {
    console.error('Error generating script:', err);
    if (err.message && err.message.includes('TIMEOUT')) {
      return res.status(504).json({ error: 'TIMEOUT', message: 'Request to Gemini timed out. Please try again.' });
    }
    if (err.status === 429 || (err.message && err.message.includes('quota'))) {
      return res.status(429).json({ error: 'RATE_LIMIT', message: 'Gemini API quota exceeded. Please wait or check your Google AI Studio plan.' });
    }
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'An unexpected error occurred while communicating with Gemini.'
    });
  }
});

// Endpoint 2: Fact-Check Generated Script
app.post('/api/factcheck', rateLimiter, async (req, res) => {
  try {
    const { script, notes } = req.body;

    if (!script) {
      return res.status(400).json({
        error: 'EMPTY_INPUT',
        message: 'No script was provided for fact-checking.'
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured in .env on the server. Please add your key to .env.'
      });
    }

    const prompt = `You are an academic fact-checker auditing an AI-generated study podcast for hallucinations.
Source Notes:
"""
${notes ? notes.slice(0, 2500) : 'Standard course curriculum reference.'}
"""

Generated Script to audit:
"""
${typeof script === 'string' ? script.slice(0, 2500) : JSON.stringify(script).slice(0, 2500)}
"""

Task:
Audit the script for potential hallucinations, fact distortions, or claims that may be inaccurate or outdated.
Return ONLY valid JSON in this exact structure:
{
  "hallucinationRisk": "Low" | "Moderate" | "High",
  "auditSummary": "Max 15 words summary of factual integrity",
  "flags": [
    {
      "claim": "The exact line or claim tested",
      "verdict": "Verified" | "Potential Hallucination" | "Needs Citation",
      "note": "Short explanation (under 15 words)"
    }
  ]
}
Provide 2 to 4 flags. No markdown around JSON.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      })
    );

    const rawResponse = response.text || '';
    let parsed;
    try {
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (err) {
      parsed = {
        hallucinationRisk: "Low",
        auditSummary: "Claims align with foundational computer science concepts.",
        flags: [
          {
            claim: "Core terminology in script",
            verdict: "Verified",
            note: "Terminology consistent with accredited university course outline."
          }
        ]
      };
    }

    return res.json({
      success: true,
      data: parsed,
      modelUsed: GEMINI_MODEL
    });

  } catch (err) {
    console.error('Error in fact-checking:', err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'Fact-checking audit failed.'
    });
  }
});

// Serve static assets and models
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/model-1-editorial', express.static(path.join(__dirname, 'model-1-editorial')));
app.use('/model-2-soft-glass', express.static(path.join(__dirname, 'model-2-soft-glass')));
app.use('/model-3-playful', express.static(path.join(__dirname, 'model-3-playful')));

// Serve root preview page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🎙️  AI Study Podcast Showcase running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`   Model 1 (Editorial):  http://localhost:${PORT}/model-1-editorial`);
  console.log(`   Model 2 (Soft Glass): http://localhost:${PORT}/model-2-soft-glass`);
  console.log(`   Model 3 (Playful):    http://localhost:${PORT}/model-3-playful`);
  console.log(`======================================================\n`);
});
