# 🎙️ AI Study Podcast Creator

> **“Notes, but make them listenable.”**  
> An educational technology capstone showcase exploring generative audio synthesis, student comprehension metrics, and hallucination verification protocols.

---

## 🌟 Executive Overview

**AI Study Podcast Creator** transforms dense, technical computer science course syllabi into engaging, conversational audio learning modules. Built as a college capstone project (B.Tech Information Technology), this showcase presents the complete methodology—from raw syllabus notes and prompt engineering to synthetic voice calibration, peer cohort evaluation, and automated factual verification.

### Key Milestones
- **3 Technical Course Modules:** Neural Foundations, Distributed Consensus (Raft/Paxos), and AI Alignment.
- **10-Student Evaluation Cohort:** Evaluated perceived comprehension, preferred playback speeds, and retention vs. silent slide reading.
- **Hallucination Auditing Protocol:** Grounded line-by-line verification against primary university course textbooks.

---

## 🎨 Three Distinct Design Models

This project features three complete design systems driven by a unified data architecture. Switch between them instantly via the top navigation bar or the root hub:

### 1. Model 1: Editorial Magazine (`/model-1-editorial`)
* **Philosophy:** Boutique academic publication inspired by classic design journals.
* **Typography:** `Playfair Display` serif headings paired with `Plus Jakarta Sans`.
* **Visual Style:** Large whitespace, soft blush backgrounds, burgundy accents, delicate gradient dividers, and calm fade-in transitions.

### 2. Model 2: Soft Glass (`/model-2-soft-glass`)
* **Philosophy:** Modern luminous translucent interface.
* **Typography:** `Plus Jakarta Sans` in balanced geometric weights.
* **Visual Style:** Translucent frosted glass cards (`backdrop-filter: blur(18px)`), smooth floating ambient color blobs, and rounded pill controls over a flowing burgundy-to-rose gradient.

### 3. Model 3: Playful Creative Studio (`/model-3-playful`)
* **Philosophy:** High-energy, tactile collegiate studio feel.
* **Typography:** `Space Grotesk` headings paired with `Plus Jakarta Sans`.
* **Visual Style:** Tilted sticker-style badges, soft layered drop-shadows, bouncy micro-interactions, and hero artwork framed in geometric concentric rings.

---

## 🎨 Design System & Color Palette

All three models adhere strictly to an extracted warm duotone palette derived from reference moodboards (free from pure black, pure white, or generic blues):

| Color Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Burgundy** | `#850E35` | Primary brand anchor, key headings, primary buttons |
| **Rose** | `#EE6983` | Interactive highlights, active progress scrubbers, badges |
| **Rose Deep** | `#D26777` | Gradient transitions, chat dialogue bubbles |
| **Rose Gold** | `#DA8393` | Badges, subtle borders, accent chips |
| **Mauve** | `#BD8E89` | Secondary chart series, subtle metadata |
| **Prune** | `#7F6269` | Subtitles, italicized statements |
| **Soft Pink** | `#FFC4C4` | Highlight containers, decorative rings |
| **Pink** | `#E5C5C1` | Card outlines, subtle separator lines |
| **Blush** | `#F4E1E0` | Surface cards, warm background tints |
| **Cream** | `#FFF5E4` | Primary light canvas, card interiors |
| **Navy** | `#0E1627` | High-contrast body text, footer, dark mode base |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Start the showcase server
npm start
```

Open your browser to:
- **Showcase Hub & Live Viewport:** [http://localhost:3000](http://localhost:3000)
- **Model 1 (Editorial):** [http://localhost:3000/model-1-editorial](http://localhost:3000/model-1-editorial)
- **Model 2 (Soft Glass):** [http://localhost:3000/model-2-soft-glass](http://localhost:3000/model-2-soft-glass)
- **Model 3 (Playful):** [http://localhost:3000/model-3-playful](http://localhost:3000/model-3-playful)

---

## 📁 Repository Structure

```
ai-study-podcast-showcase/
├── .env.example             # Environment template (safe for version control)
├── .gitignore               # Ensures local config & secrets stay untracked
├── package.json             # Application dependencies & npm scripts
├── server.js                # Secure Node.js + Express backend service
├── index.html               # Central showcase hub with interactive iframe previews
├── README.md                # Project documentation
│
├── data/                    # CENTRALIZED DATA LAYER (Edit content once)
│   ├── chapters.json        # 3 podcast chapters, audio metadata & transcripts
│   ├── survey.json          # 10 student cohort survey data & Chart.js figures
│   ├── prompts.json         # Prompt engineering library with role filter chips
│   ├── verification.json    # Hallucination audit log (ground truth vs generated)
│   ├── before-after.json    # Slide notes vs conversational script comparison
│   └── ethics.json          # Academic ethics cards (Privacy, Copyright, Honesty, Limits)
│
├── assets/                  # SHARED ASSETS
│   ├── audio/               # Chapter audio samples & two-speaker benchmarks
│   ├── images/              # Recoloured hero art, vector album covers, video preview
│   ├── css/
│   │   └── common.css       # Unified design tokens, resets, player & modal styling
│   └── js/
│       └── shared-app.js    # Data loader, Chart.js engine, audio player engine
│
├── model-1-editorial/       # MODEL 1: Boutique Magazine Edition
│   ├── index.html
│   └── style.css
│
├── model-2-soft-glass/      # MODEL 2: Frosted Soft Glass Edition
│   ├── index.html
│   └── style.css
│
└── model-3-playful/         # MODEL 3: Creative Studio Edition
    ├── index.html
    └── style.css
```

---

## ⚙️ Configuration & Content Customization

### Local Configuration
To configure local environment parameters, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
> Note: `.env` is ignored by `.gitignore` and will never be tracked by git or pushed to GitHub.

### Modifying Showcase Content
All content is decoupled into the `/data/` directory so updates automatically propagate across all three design models:
- **Audio Catalog:** Update `data/chapters.json` and place audio files in `assets/audio/`.
- **Survey Findings:** Update `data/survey.json` with evaluation scores and cohort quotes.
- **Prompt Library:** Add or refine prompts in `data/prompts.json`.
- **Factual Verification:** Document fact-checks in `data/verification.json`.

---

## ☁️ Deployment

For online deployment, deploy to any standard Node.js hosting platform (such as [Render](https://render.com), [Railway](https://railway.app), or [Vercel](https://vercel.com)):

1. Push your repository to GitHub (secrets in `.env` are automatically excluded).
2. Connect the repository to your hosting provider.
3. Configure the standard build and start commands:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set any required environment variables in your host's dashboard settings.

---

## 🎓 Capstone Academic Attribution

- **Program:** B.Tech Information Technology
- **Project Title:** AI Study Podcast Creator
- **Tagline:** *"Notes, but make them listenable."*
- **Research Scope:** Generative dialogue transformation, synthetic voice pacing, peer cohort recall testing, and hallucination reduction.
