/**
 * AI Study Podcast Creator - Shared Application Engine
 * Handles Data Loading, Audio Players, Charts, Modals, Lightbox, Copy, & Gemini API
 */

const AppState = {
  chapters: [],
  survey: {},
  prompts: [],
  verification: [],
  beforeAfter: {},
  ethics: {},
  currentAudio: null,
  activeAudioCardId: null,
  generatedScriptData: null,
  activePromptFilter: 'All'
};

// Toast helper
function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

// Dark Mode Handler
function initDarkMode() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (toggleBtn) toggleBtn.textContent = '☀️';
  } else {
    if (toggleBtn) toggleBtn.textContent = '🌙';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toggleBtn.textContent = isDark ? '☀️' : '🌙';
      if (window.renderCharts) window.renderCharts();
    });
  }
}

// Smooth Mobile Menu
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const isOpen = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    // Close menu when clicking link
    links.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  }
}

// Active Nav highlight on scroll
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

// Load all JSON data
async function loadSharedData() {
  try {
    const [chaptersRes, surveyRes, promptsRes, verifyRes, baRes, ethicsRes] = await Promise.all([
      fetch('/data/chapters.json'),
      fetch('/data/survey.json'),
      fetch('/data/prompts.json'),
      fetch('/data/verification.json'),
      fetch('/data/before-after.json'),
      fetch('/data/ethics.json')
    ]);

    AppState.chapters = await chaptersRes.json();
    AppState.survey = await surveyRes.json();
    AppState.prompts = await promptsRes.json();
    AppState.verification = await verifyRes.json();
    AppState.beforeAfter = await baRes.json();
    AppState.ethics = await ethicsRes.json();

    renderAllComponents();
  } catch (err) {
    console.error('Failed to load shared data:', err);
  }
}

// Render Chapters Audio Cards
function renderChapterCards() {
  const container = document.getElementById('chapters-container');
  if (!container) return;

  container.innerHTML = AppState.chapters.map(ch => `
    <div class="audio-card" id="card-${ch.id}">
      <div class="audio-header">
        <img src="${ch.coverArt}" alt="${ch.title} Cover" class="audio-cover" onclick="openLightbox('${ch.coverArt}', '${ch.title} - ${ch.subtitle}')" />
        <div class="audio-meta">
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
            <span class="badge-tag">CH ${ch.number}</span>
            <span class="badge-tag" style="background: rgba(189, 142, 137, 0.2); color: var(--text-muted);">${ch.tool}</span>
          </div>
          <h3>${ch.title}</h3>
          <p class="audio-subtitle">${ch.subtitle}</p>
          <p style="font-size: 0.85rem; color: var(--text-subtle);">${ch.summary}</p>
        </div>
      </div>

      <!-- Audio Element -->
      <audio id="audio-${ch.id}" src="${ch.audioSrc}" preload="metadata"></audio>

      <!-- Player UI Controls -->
      <div class="player-controls">
        <button class="play-btn" id="play-${ch.id}" onclick="toggleAudio('${ch.id}')" aria-label="Play ${ch.title}">
          <span class="play-icon">▶</span>
        </button>
        <div class="scrubber-wrap">
          <input type="range" class="scrubber" id="scrub-${ch.id}" value="0" min="0" max="100" step="0.1" oninput="seekAudio('${ch.id}', this.value)" aria-label="Seek track" />
          <div class="time-row">
            <span id="curr-${ch.id}">0:00</span>
            <span id="dur-${ch.id}">${ch.duration}</span>
          </div>
        </div>
        <div class="speed-group">
          <button class="speed-btn active" onclick="setSpeed('${ch.id}', 1.0, this)">1x</button>
          <button class="speed-btn" onclick="setSpeed('${ch.id}', 1.25, this)">1.25x</button>
          <button class="speed-btn" onclick="setSpeed('${ch.id}', 1.5, this)">1.5x</button>
        </div>
      </div>

      <!-- Transcript Accordion -->
      <div class="accordion" id="acc-${ch.id}" style="margin-top: 16px;">
        <button class="accordion-trigger" onclick="toggleAccordion('acc-${ch.id}')">
          <span>Read dialogue transcript</span>
          <span class="accordion-icon">▾</span>
        </button>
        <div class="accordion-content">
          <div class="dialogue-thread">
            ${ch.scriptExcerpt.map(t => `
              <div class="chat-bubble ${t.speaker === 'Host A' ? 'host-a' : 'host-b'}">
                <span class="bubble-sender">${t.speaker}</span>
                ${t.text}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Attach audio events
  AppState.chapters.forEach(ch => {
    const audio = document.getElementById(`audio-${ch.id}`);
    const scrub = document.getElementById(`scrub-${ch.id}`);
    const curr = document.getElementById(`curr-${ch.id}`);
    const dur = document.getElementById(`dur-${ch.id}`);

    if (audio) {
      audio.addEventListener('loadedmetadata', () => {
        dur.textContent = formatTime(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        scrub.value = (audio.currentTime / audio.duration) * 100;
        curr.textContent = formatTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        const btn = document.getElementById(`play-${ch.id}`);
        if (btn) btn.innerHTML = '<span class="play-icon">▶</span>';
      });
    }
  });
}

// Format seconds into MM:SS
function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Toggle Audio Play/Pause
window.toggleAudio = function(id) {
  const audio = document.getElementById(`audio-${id}`);
  const btn = document.getElementById(`play-${id}`);
  if (!audio) return;

  // Stop currently playing if different
  if (AppState.currentAudio && AppState.currentAudio !== audio) {
    AppState.currentAudio.pause();
    const oldBtn = document.getElementById(`play-${AppState.activeAudioCardId}`);
    if (oldBtn) oldBtn.innerHTML = '<span class="play-icon">▶</span>';
  }

  if (audio.paused) {
    audio.play().then(() => {
      btn.innerHTML = '<span class="play-icon">⏸</span>';
      AppState.currentAudio = audio;
      AppState.activeAudioCardId = id;
      // Animate hero waveform if present
      const heroWaves = document.querySelectorAll('.hero-wave-bar');
      heroWaves.forEach(b => b.classList.add('animating'));
    }).catch(err => {
      console.warn('Playback blocked or failed:', err);
    });
  } else {
    audio.pause();
    btn.innerHTML = '<span class="play-icon">▶</span>';
    const heroWaves = document.querySelectorAll('.hero-wave-bar');
    heroWaves.forEach(b => b.classList.remove('animating'));
  }
};

window.seekAudio = function(id, val) {
  const audio = document.getElementById(`audio-${id}`);
  if (audio && audio.duration) {
    audio.currentTime = (val / 100) * audio.duration;
  }
};

window.setSpeed = function(id, speed, btnElement) {
  const audio = document.getElementById(`audio-${id}`);
  if (audio) {
    audio.playbackRate = speed;
    const parent = btnElement.parentElement;
    parent.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    showToast(`Speed set to ${speed}x`);
  }
};

// Global Hero Play Trigger
window.triggerHeroPlay = function() {
  if (AppState.chapters.length > 0) {
    const firstId = AppState.chapters[0].id;
    const card = document.getElementById(`card-${firstId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => toggleAudio(firstId), 400);
    }
  }
};

// Accordion Toggle
window.toggleAccordion = function(accId) {
  const acc = document.getElementById(accId);
  if (acc) {
    acc.classList.toggle('open');
  }
};

// Lightbox Open & Close
window.openLightbox = function(imgSrc, caption) {
  let lb = document.getElementById('global-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'global-lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="closeLightbox()" aria-label="Close Lightbox">&times;</button>
        <img class="lightbox-img" src="" alt="Album Artwork" />
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });
  }

  lb.querySelector('.lightbox-img').src = imgSrc;
  lb.querySelector('.lightbox-caption').textContent = caption || '';
  lb.classList.add('active');
};

window.closeLightbox = function() {
  const lb = document.getElementById('global-lightbox');
  if (lb) lb.classList.remove('active');
};

// Render Cover Art Gallery
function renderCoverGallery() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  container.innerHTML = AppState.chapters.map(ch => `
    <div class="gallery-card" onclick="openLightbox('${ch.coverArt}', '${ch.title} - ${ch.subtitle}')">
      <img src="${ch.coverArt}" alt="${ch.title} Cover" class="gallery-img" />
      <div class="gallery-overlay">
        <span class="badge-tag" style="width: max-content; margin-bottom: 6px;">${ch.tool}</span>
        <h4 style="font-size: 1.15rem; font-weight: 700;">${ch.title}</h4>
        <p style="font-size: 0.85rem; opacity: 0.9;">Click to enlarge • 800x800 SVG</p>
      </div>
    </div>
  `).join('');
}

// Render Results: Stat Tiles & Star Scorecards
function renderResultsSection() {
  const statsContainer = document.getElementById('stat-tiles-container');
  if (statsContainer && AppState.survey.stats) {
    statsContainer.innerHTML = AppState.survey.stats.map(s => `
      <div class="stat-card" style="background: var(--bg-surface); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-soft); text-align: center;">
        <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-primary); line-height: 1;">${s.value}</div>
        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 6px 0 2px;">${s.label}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${s.subtext}</div>
      </div>
    `).join('');
  }

  const scoreContainer = document.getElementById('scorecards-container');
  if (scoreContainer && AppState.survey.scorecards) {
    scoreContainer.innerHTML = AppState.survey.scorecards.map(sc => `
      <div style="background: var(--bg-surface); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-soft); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: 700; color: var(--text-primary);">${sc.metric}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${sc.note}</div>
        </div>
        <div style="text-align: right;">
          <div style="color: var(--accent-secondary); font-size: 1.1rem; letter-spacing: 2px;">★★★★★</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-primary);">${sc.score}</div>
        </div>
      </div>
    `).join('');
  }
}

// Render Chart.js in Strict Palette Colours
let chartInstances = {};
window.renderCharts = function() {
  if (typeof Chart === 'undefined') return;
  const s = AppState.survey.charts;
  if (!s) return;

  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#FFF5E4' : '#0E1627';
  const gridColor = isDark ? 'rgba(218, 131, 147, 0.15)' : 'rgba(189, 142, 137, 0.2)';

  // Chart 1: Comprehension Doughnut
  const ctxComp = document.getElementById('chart-comprehension');
  if (ctxComp) {
    if (chartInstances.comp) chartInstances.comp.destroy();
    chartInstances.comp = new Chart(ctxComp, {
      type: 'doughnut',
      data: {
        labels: s.comprehension.labels,
        datasets: [{
          data: s.comprehension.values,
          backgroundColor: ['#850E35', '#EE6983', '#DA8393', '#BD8E89'],
          borderWidth: 2,
          borderColor: isDark ? '#1B2236' : '#FFF5E4'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} students`
            }
          }
        }
      }
    });
  }

  // Chart 2: Retention Bar Chart (Text-only vs Podcast-assisted)
  const ctxRet = document.getElementById('chart-retention');
  if (ctxRet) {
    if (chartInstances.ret) chartInstances.ret.destroy();
    chartInstances.ret = new Chart(ctxRet, {
      type: 'bar',
      data: {
        labels: s.retentionComparison.labels,
        datasets: [
          {
            label: 'Silent Slide Reading (%)',
            data: s.retentionComparison.textOnly,
            backgroundColor: '#BD8E89',
            borderRadius: 6
          },
          {
            label: 'Podcast Audio Overview (%)',
            data: s.retentionComparison.podcastAssisted,
            backgroundColor: '#850E35',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }, grid: { display: false } },
          y: { min: 0, max: 100, ticks: { color: textColor, callback: (v) => v + '%' }, grid: { color: gridColor } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } } }
        }
      }
    });
  }
};

// Render Before / After Comparison
function renderBeforeAfter() {
  const container = document.getElementById('before-after-container');
  if (!container || !AppState.beforeAfter.comparisons) return;

  const item = AppState.beforeAfter.comparisons[0]; // Primary feature
  container.innerHTML = `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-soft); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <div>
          <span class="badge-tag">COMPARISON</span>
          <h3 style="font-size: 1.3rem; color: var(--accent-primary); margin-top: 4px;">${item.topic}</h3>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
        <!-- Before -->
        <div style="background: rgba(189, 142, 137, 0.12); border: 1px dashed var(--border-soft); padding: 18px; border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
            ⚠️ BEFORE • ${item.before.format}
          </div>
          <p style="font-size: 0.88rem; line-height: 1.55; color: var(--text-subtle);">${item.before.content}</p>
        </div>
        <!-- After -->
        <div style="background: var(--bg-accent); border: 1px solid var(--c-rose-gold); padding: 18px; border-radius: var(--radius-md);">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--c-burgundy); text-transform: uppercase; margin-bottom: 8px;">
            ✨ AFTER • ${item.after.format}
          </div>
          <div class="dialogue-thread" style="margin: 0;">
            ${item.after.dialogue.map(d => `
              <div class="chat-bubble ${d.speaker === 'Host A' ? 'host-a' : 'host-b'}" style="padding: 8px 14px; font-size: 0.85rem;">
                <span class="bubble-sender">${d.speaker}</span>
                ${d.text}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Verification Log Modal
window.openVerificationModal = function() {
  let modal = document.getElementById('verify-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'verify-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <button class="modal-close" onclick="closeVerificationModal()" aria-label="Close modal">&times;</button>
        <div style="margin-bottom: 16px;">
          <span class="badge-tag">AUDIT LOG</span>
          <h2 style="font-size: 1.6rem; color: var(--accent-primary); margin-top: 4px;">Hallucination Verification Protocol</h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">Line-by-line factual ground-truth check against syllabus citations.</p>
        </div>
        <div style="overflow-x: auto;">
          <table class="verify-table">
            <thead>
              <tr>
                <th>Chapter</th>
                <th>Model Generated Claim</th>
                <th>Ground-Truth Syllabus Fact</th>
                <th>Status</th>
                <th>Prompt Guardrail Applied</th>
              </tr>
            </thead>
            <tbody id="verify-table-body"></tbody>
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeVerificationModal();
    });
  }

  const tbody = modal.querySelector('#verify-table-body');
  tbody.innerHTML = AppState.verification.map(v => `
    <tr>
      <td style="font-weight: 600; white-space: nowrap;">${v.chapter}</td>
      <td style="color: var(--text-subtle); font-size: 0.82rem;">"${v.generatedClaim}"</td>
      <td style="font-size: 0.82rem;">${v.sourceFact}</td>
      <td>
        <span class="status-badge ${v.status === 'VERIFIED' ? 'verified' : 'revised'}">
          ${v.status}
        </span>
      </td>
      <td style="font-size: 0.78rem; color: var(--text-muted);">${v.promptTweak}</td>
    </tr>
  `).join('');

  modal.classList.add('active');
};

window.closeVerificationModal = function() {
  const modal = document.getElementById('verify-modal');
  if (modal) modal.classList.remove('active');
};

// Render Prompt Library Grid & Filters
window.filterPrompts = function(tool) {
  AppState.activePromptFilter = tool;
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-tool') === tool);
  });
  renderPromptsGrid();
};

function renderPromptsGrid() {
  const container = document.getElementById('prompts-container');
  if (!container) return;

  const filtered = AppState.activePromptFilter === 'All'
    ? AppState.prompts
    : AppState.prompts.filter(p => p.tool.toLowerCase() === AppState.activePromptFilter.toLowerCase());

  container.innerHTML = filtered.map(p => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 22px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm);">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span class="badge-tag" style="background: var(--bg-primary);">${p.tool} • ${p.role}</span>
          ${p.bestVersion ? '<span class="badge-tag" style="background: var(--c-burgundy); color: var(--c-cream);">★ Best version</span>' : ''}
        </div>
        <h4 style="font-size: 1.05rem; color: var(--accent-primary); margin-bottom: 6px;">${p.title}</h4>
        <p style="font-size: 0.82rem; color: var(--text-subtle); margin-bottom: 14px;">${p.shortDesc}</p>
        <div style="background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); font-family: monospace; font-size: 0.78rem; line-height: 1.4; color: var(--text-primary); max-height: 110px; overflow-y: auto; margin-bottom: 14px; white-space: pre-wrap; border: 1px solid var(--border-soft);">
${p.prompt}
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-soft); padding-top: 12px;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">Evaluated on 10 student runs</span>
        <button onclick="copyToClipboard('${escapeJs(p.prompt)}')" style="background: var(--accent-primary); color: var(--c-cream); border: none; border-radius: var(--radius-full); padding: 6px 14px; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
          Copy prompt
        </button>
      </div>
    </div>
  `).join('');
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
}

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Prompt copied to clipboard!');
  }).catch(() => {
    showToast('Copied text!');
  });
};

// Render Ethics Expandable Cards
function renderEthicsCards() {
  const container = document.getElementById('ethics-container');
  if (!container || !AppState.ethics.cards) return;

  container.innerHTML = AppState.ethics.cards.map(c => `
    <div class="accordion" id="eth-${c.id}">
      <button class="accordion-trigger" onclick="toggleAccordion('eth-${c.id}')">
        <span>${c.title} — <strong style="font-weight: 400; color: var(--text-muted); font-size: 0.85rem;">${c.summary}</strong></span>
        <span class="accordion-icon">▾</span>
      </button>
      <div class="accordion-content">
        <p style="font-size: 0.88rem; color: var(--text-subtle); line-height: 1.55;">${c.details}</p>
      </div>
    </div>
  `).join('');
}

// Gemini API "Try It" Feature
window.generatePodcastScript = async function() {
  const textarea = document.getElementById('gemini-notes-input');
  const resultContainer = document.getElementById('gemini-results-wrap');
  const scriptContent = document.getElementById('gemini-script-content');
  const factcheckBtn = document.getElementById('gemini-factcheck-btn');
  const factcheckResult = document.getElementById('gemini-factcheck-result');
  const generateBtn = document.getElementById('gemini-generate-btn');
  const errorBox = document.getElementById('gemini-error-box');

  const notes = textarea ? textarea.value.trim() : '';

  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.innerHTML = '';
  }

  if (!notes) {
    showError('Please paste some study notes first before generating.');
    return;
  }

  if (notes.length > 4000) {
    showError('Note text exceeds 4,000 characters. Please provide a shorter snippet.');
    return;
  }

  // Loading state
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span class="spinner"></span> Generating dialogue...';
  if (resultContainer) resultContainer.style.display = 'block';
  if (scriptContent) {
    scriptContent.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.5rem; animation: pulse 1.5s infinite;">🎙️</div>
        <p style="font-size: 0.88rem; margin-top: 8px;">Synthesizing Host A &amp; Host B dialogue with Gemini...</p>
      </div>
    `;
  }
  if (factcheckBtn) factcheckBtn.style.display = 'none';
  if (factcheckResult) factcheckResult.style.display = 'none';

  try {
    const res = await fetch('/api/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      handleApiError(data);
      return;
    }

    AppState.generatedScriptData = data.data;

    // Render dialogue bubbles
    const turns = data.data.turns || [];
    scriptContent.innerHTML = `
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span class="badge-tag" style="background: var(--c-soft-pink); color: var(--c-burgundy);">${data.data.title || 'Generated Dialogue'}</span>
        <button onclick="copyGeneratedScript()" style="background: transparent; border: 1px solid var(--border-soft); color: var(--accent-primary); border-radius: var(--radius-full); padding: 4px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
          📋 Copy script
        </button>
      </div>
      <div class="dialogue-thread">
        ${turns.map(t => `
          <div class="chat-bubble ${t.speaker === 'Host A' ? 'host-a' : 'host-b'}">
            <span class="bubble-sender">${t.speaker}</span>
            ${t.text}
          </div>
        `).join('')}
      </div>
    `;

    // Reveal Fact-Check button
    if (factcheckBtn) {
      factcheckBtn.style.display = 'inline-flex';
    }

    showToast('Podcast dialogue generated!');

  } catch (err) {
    showError('Network error connecting to backend. Is server.js running?');
    console.error(err);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '✨ Make my podcast';
  }
};

// Fact-Check button handler
window.runFactCheck = async function() {
  if (!AppState.generatedScriptData) return;

  const factcheckBtn = document.getElementById('gemini-factcheck-btn');
  const factcheckResult = document.getElementById('gemini-factcheck-result');
  const textarea = document.getElementById('gemini-notes-input');

  factcheckBtn.disabled = true;
  factcheckBtn.innerHTML = '<span class="spinner"></span> Auditing claims...';
  if (factcheckResult) {
    factcheckResult.style.display = 'block';
    factcheckResult.innerHTML = '<p style="font-size: 0.82rem; color: var(--text-muted); text-align: center;">Cross-referencing claims against source notes...</p>';
  }

  try {
    const res = await fetch('/api/factcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: AppState.generatedScriptData.turns,
        notes: textarea ? textarea.value : ''
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      handleApiError(data);
      return;
    }

    const audit = data.data;
    factcheckResult.innerHTML = `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 16px; margin-top: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 0.88rem; color: var(--accent-primary);">Hallucination Audit</strong>
          <span class="status-badge ${audit.hallucinationRisk === 'Low' ? 'verified' : 'revised'}">Risk: ${audit.hallucinationRisk}</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">${audit.auditSummary}</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(audit.flags || []).map(f => `
            <div style="padding: 8px 12px; background: var(--bg-primary); border-radius: var(--radius-sm); font-size: 0.8rem; border-left: 3px solid ${f.verdict === 'Verified' ? 'var(--accent-secondary)' : 'var(--c-burgundy)'};">
              <div style="display: flex; justify-content: space-between;">
                <strong>"${f.claim}"</strong>
                <span style="font-weight: 700; color: ${f.verdict === 'Verified' ? 'var(--text-primary)' : 'var(--c-burgundy)'};">${f.verdict}</span>
              </div>
              <div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 2px;">${f.note}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    showToast('Fact-check audit complete!');

  } catch (err) {
    showError('Fact-check request failed. Please retry.');
    console.error(err);
  } finally {
    factcheckBtn.disabled = false;
    factcheckBtn.innerHTML = '🔍 Fact-check with Gemini';
  }
};

window.copyGeneratedScript = function() {
  if (!AppState.generatedScriptData || !AppState.generatedScriptData.turns) return;
  const scriptText = AppState.generatedScriptData.turns.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
  copyToClipboard(scriptText);
};

window.fillSampleNotes = function() {
  const textarea = document.getElementById('gemini-notes-input');
  if (textarea) {
    textarea.value = `Gradient descent optimizes parameters theta by updating in the opposite direction of the gradient of the objective function. Learning rate eta determines step size. In deep networks, the chain rule propagates error deltas backward through layers. If the learning rate is too large, the optimizer may oscillate or diverge; if too small, convergence takes excessive epochs.`;
    showToast('Sample study notes loaded!');
  }
};

function handleApiError(data) {
  if (data.error === 'MISSING_API_KEY') {
    showError(`🔑 <strong>API Key Required:</strong> ${data.message}`);
  } else if (data.error === 'RATE_LIMIT') {
    showError(`⏳ <strong>Rate Limited:</strong> ${data.message}`);
  } else {
    showError(`⚠️ <strong>Error:</strong> ${data.message || 'Something went wrong.'}`);
  }
}

function showError(msg) {
  const errorBox = document.getElementById('gemini-error-box');
  if (errorBox) {
    errorBox.innerHTML = msg;
    errorBox.style.display = 'block';
  } else {
    showToast(msg);
  }
}

// Master Render Invocation
function renderAllComponents() {
  renderChapterCards();
  renderCoverGallery();
  renderResultsSection();
  renderBeforeAfter();
  renderPromptsGrid();
  renderEthicsCards();
  if (window.renderCharts) {
    window.renderCharts();
  }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initMobileMenu();
  initScrollSpy();
  loadSharedData();
});
