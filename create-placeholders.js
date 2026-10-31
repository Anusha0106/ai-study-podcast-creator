const fs = require('fs');
const path = require('path');

// 1. Generate pleasant musical WAV audio files
function createWavAudio(filePath, durationSec, notes) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // 'data' chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate gentle ambient harmonic synth tones
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Rotate through notes every 3 seconds
    const noteIdx = Math.floor(t / 2.5) % notes.length;
    const freq = notes[noteIdx];
    // Gentle envelope attack / decay
    const cycleT = (t % 2.5);
    const env = Math.min(1, cycleT * 4) * Math.max(0, 1 - (cycleT - 1.2) / 1.3);

    // Fundamental + gentle warm octave + 3rd harmonic
    const sampleVal = (
      Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.3 +
      Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.15
    ) * env * 0.4;

    const int16Val = Math.max(-32767, Math.min(32767, Math.floor(sampleVal * 32767)));
    buffer.writeInt16LE(int16Val, offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Created audio file: ${filePath} (${durationSec}s)`);
}

// 2. Generate cover arts as rich, crisp SVGs
function createCoverArt(filename, title, subtitle, tag, colorGradStart, colorGradEnd, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorGradStart}"/>
        <stop offset="60%" stop-color="${colorGradEnd}"/>
        <stop offset="100%" stop-color="#0E1627"/>
      </linearGradient>
      <radialGradient id="glow" cx="70%" cy="20%" r="60%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFF5E4" stroke-width="0.5" stroke-opacity="0.1"/>
      </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="800" rx="32" fill="url(#bgGrad)"/>
    <rect width="800" height="800" rx="32" fill="url(#glow)"/>
    <rect width="800" height="800" rx="32" fill="url(#grid)"/>

    <!-- Decorative Vinyl / Sound waves -->
    <g opacity="0.15" transform="translate(600, 200)">
      <circle r="320" fill="none" stroke="#FFF5E4" stroke-width="2"/>
      <circle r="260" fill="none" stroke="#FFF5E4" stroke-width="1.5" stroke-dasharray="8 6"/>
      <circle r="200" fill="none" stroke="#FFF5E4" stroke-width="2"/>
      <circle r="140" fill="none" stroke="#FFF5E4" stroke-width="1"/>
    </g>

    <!-- Capstone badge -->
    <g transform="translate(60, 70)">
      <rect width="180" height="38" rx="19" fill="#FFF5E4" fill-opacity="0.15" stroke="#FFF5E4" stroke-opacity="0.3"/>
      <text x="90" y="24" fill="#FFF5E4" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="600" letter-spacing="2" text-anchor="middle">${tag}</text>
    </g>

    <!-- Podcast waveform decor -->
    <g transform="translate(60, 480)" fill="${accentColor}">
      <rect x="0" y="10" width="8" height="60" rx="4"/>
      <rect x="16" y="25" width="8" height="45" rx="4"/>
      <rect x="32" y="0" width="8" height="70" rx="4"/>
      <rect x="48" y="18" width="8" height="52" rx="4"/>
      <rect x="64" y="30" width="8" height="40" rx="4"/>
      <rect x="80" y="5" width="8" height="65" rx="4"/>
      <rect x="96" y="20" width="8" height="50" rx="4"/>
      <rect x="112" y="38" width="8" height="32" rx="4"/>
    </g>

    <!-- Typography -->
    <text x="60" y="600" fill="#FFF5E4" font-family="'Playfair Display', Georgia, serif" font-size="44" font-weight="700">
      ${title}
    </text>
    <text x="60" y="650" fill="#E5C5C1" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="400">
      ${subtitle}
    </text>

    <!-- Footer metadata -->
    <line x1="60" y1="700" x2="740" y2="700" stroke="#FFF5E4" stroke-opacity="0.2" stroke-width="1"/>
    <text x="60" y="740" fill="#F4E1E0" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" opacity="0.8">
      AI STUDY PODCAST CREATOR • NOTEBOOKLM &amp; ELEVENLABS
    </text>
    <text x="740" y="740" fill="#DA8393" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="600" text-anchor="end">
      SERIES 01
    </text>
  </svg>`;

  const outPath = path.join(__dirname, 'assets', 'images', filename);
  fs.writeFileSync(outPath, svg);
  console.log(`Created cover art SVG: ${outPath}`);
}

// 3. Generate Video Preview SVG
function createVideoThumbnail(filename) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="vidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E1627"/>
        <stop offset="45%" stop-color="#850E35"/>
        <stop offset="85%" stop-color="#BD8E89"/>
        <stop offset="100%" stop-color="#FFF5E4"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" rx="24" fill="url(#vidGrad)"/>
    
    <!-- Audio Waveform decorative bars across middle -->
    <g opacity="0.25" fill="#FFF5E4" transform="translate(140, 360)">
      ${Array.from({length: 40}).map((_, i) => {
        const h = 20 + Math.sin(i * 0.4) * 60 + ((i % 3) * 20);
        return `<rect x="${i * 25}" y="${-h/2}" width="12" height="${h}" rx="6"/>`;
      }).join('\n')}
    </g>

    <!-- Play button overlay -->
    <circle cx="640" cy="360" r="64" fill="#850E35" stroke="#FFF5E4" stroke-width="4"/>
    <polygon points="630,335 665,360 630,385" fill="#FFF5E4"/>

    <!-- Labels -->
    <text x="640" y="470" fill="#FFF5E4" font-family="'Playfair Display', Georgia, serif" font-size="32" font-weight="700" text-anchor="middle">
      Capstone Final Demo Walkthrough
    </text>
    <text x="640" y="510" fill="#F4E1E0" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" text-anchor="middle" opacity="0.9">
      From Raw Course Syllabus to Verified Audio Learning in 4 Steps (03:42)
    </text>
  </svg>`;

  const outPath = path.join(__dirname, 'assets', 'images', filename);
  fs.writeFileSync(outPath, svg);
  console.log(`Created video preview SVG: ${outPath}`);
}

// Generate Audio Files
const audioDir = path.join(__dirname, 'assets', 'audio');
createWavAudio(path.join(audioDir, 'chapter-1-sample.wav'), 32, [220, 261.63, 329.63, 392]);     // A minor chord arpeggios
createWavAudio(path.join(audioDir, 'chapter-2-sample.wav'), 45, [261.63, 329.63, 392, 523.25]);  // C major warm chord
createWavAudio(path.join(audioDir, 'chapter-3-sample.wav'), 38, [196, 246.94, 293.66, 392]);     // G major mellow
createWavAudio(path.join(audioDir, 'elevenlabs-two-speaker.wav'), 28, [220, 277.18, 329.63, 440]); // A major dialogue chime

// Generate Cover Arts
createCoverArt('cover-art-1.svg', 'Neural Foundations', 'Chapter 01: Deep Learning Decoded', 'LEONARDO AI', '#850E35', '#EE6983', '#DA8393');
createCoverArt('cover-art-2.svg', 'Consensus & Raft', 'Chapter 02: Distributed Systems', 'CANVA + GENAI', '#7F6269', '#850E35', '#FFC4C4');
createCoverArt('cover-art-3.svg', 'AI Ethics & Alignment', 'Chapter 03: Hallucination Protocols', 'STUDIO EDITION', '#0E1627', '#850E35', '#EE6983');
createVideoThumbnail('video-preview.svg');
