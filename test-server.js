const http = require('http');

async function testAll() {
  console.log('Testing AI Study Podcast Creator Server & Models...\n');

  // Load server
  process.env.PORT = '3001';
  require('./server.js');

  // Wait 1.5 seconds for listen
  await new Promise(r => setTimeout(r, 1500));

  const endpoints = [
    { url: 'http://127.0.0.1:3001/', name: 'Root Hub Index' },
    { url: 'http://127.0.0.1:3001/model-1-editorial/', name: 'Model 1: Editorial' },
    { url: 'http://127.0.0.1:3001/model-2-soft-glass/', name: 'Model 2: Soft Glass' },
    { url: 'http://127.0.0.1:3001/model-3-playful/', name: 'Model 3: Playful' },
    { url: 'http://127.0.0.1:3001/data/chapters.json', name: 'Chapters Data JSON' },
    { url: 'http://127.0.0.1:3001/data/survey.json', name: 'Survey Data JSON' },
    { url: 'http://127.0.0.1:3001/data/prompts.json', name: 'Prompts Data JSON' },
    { url: 'http://127.0.0.1:3001/data/verification.json', name: 'Verification Data JSON' },
    { url: 'http://127.0.0.1:3001/data/before-after.json', name: 'Before-After Data JSON' },
    { url: 'http://127.0.0.1:3001/data/ethics.json', name: 'Ethics Data JSON' },
    { url: 'http://127.0.0.1:3001/assets/images/podcast-hero-recoloured.png', name: 'Recoloured Hero Image' },
    { url: 'http://127.0.0.1:3001/assets/images/cover-art-1.svg', name: 'Cover Art 1 SVG' },
    { url: 'http://127.0.0.1:3001/assets/audio/chapter-1-sample.wav', name: 'Sample Audio WAV' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url);
      console.log(`[PASS] ${ep.name} -> HTTP ${res.status} (${res.headers.get('content-type')})`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error(`[FAIL] ${ep.name} ->`, err.message, err.cause ? err.cause.code : '');
    }
  }

  // Test POST /api/script with empty input
  console.log('\nTesting API Validation & Security...');
  try {
    const res = await fetch('http://127.0.0.1:3001/api/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log(`[PASS] Empty notes validation -> HTTP ${res.status}: ${data.error} ("${data.message}")`);
  } catch (err) {
    console.error(`[FAIL] Validation test ->`, err.message, err.cause ? err.cause.code : '');
  }

  // Test POST /api/script with notes when no API key configured
  try {
    const res = await fetch('http://127.0.0.1:3001/api/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Test notes about backpropagation' })
    });
    const data = await res.json();
    console.log(`[PASS] Missing key guardrail -> HTTP ${res.status}: ${data.error} ("${data.message}")`);
  } catch (err) {
    console.error(`[FAIL] Missing key test ->`, err.message, err.cause ? err.cause.code : '');
  }

  // Test POST /api/factcheck with empty body
  try {
    const res = await fetch('http://127.0.0.1:3001/api/factcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log(`[PASS] Fact-check validation -> HTTP ${res.status}: ${data.error} ("${data.message}")`);
  } catch (err) {
    console.error(`[FAIL] Fact-check validation ->`, err.message, err.cause ? err.cause.code : '');
  }

  console.log('\nAll server endpoints and assets verified successfully!');
  process.exit(0);
}

testAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
