# Preparation of Liquid Detergent — Educational Chemistry Laboratory Website

> **Institution:** MIT Academy of Engineering  
> **Academic Unit:** Department of Engineering Chemistry  
> **Batch & Division:** Division B, Batch B3  
> **Investigation Team:** Kartik Dhote, Sumedh Warade, Prem Belote, Suraj Maske, Yash Sabe, Viraj Shinde  

---

## 🧪 Project Overview

This is an award-quality, multi-page educational web platform custom-built to showcase the college chemistry lab experiment: **"Preparation of Liquid Detergent"**. 

It features:
- **Concept:** "A lab notebook under glass" — serene, clean, scientific design token architecture (`--ink`, `--deep`, `--aqua`, `--foam`, `--sun`, `--alert`).
- **Signature Interactive Moment:** A fixed vertical borosilicate beaker meter on the `/process` page that dynamically fills with liquid as you scroll or step through the 7 chemical synthesis scenes, shifting its tint from crystal-clear distilled solvent to deep, foaming liquid detergent.
- **Canva Flowsheet + Native Reactive Convergence Map:** Visualizing the converging addition of 7 raw materials into the 4 core unit operations (Mixing $\to$ Heating $\to$ Filtration $\to$ Final Product).
- **Secure Server-Scored Quiz Engine:** 10 multiple-choice questions with answers strictly withheld on the server side (`/api/quiz` scrubs answers; `/api/score` computes score and returns pedagogical explanations).
- **Ambient Laboratory Audio Controller:** Floating audio button featuring an academic ambient synthesizer with localStorage memory that **never autoplays** without user interaction.
- **Safety Precaution Banner:** Highlighting PPE standards (gloves, goggles, buttoned lab coat) and specific reagent warnings for corrosive $\text{NaOH}$ and aquatic toxin $\text{CuSO}_4$.

---

## 🚀 Quickstart & Setup

### 1. Requirements
- Python 3.11+ (Tested on Python 3.13)
- `pip`

### 2. Installation
Clone or navigate to the repository directory and install the lightweight dependencies:
```bash
pip install -r requirements.txt
```

### 3. Running the Server
Launch the Flask development server on port 5000:
```bash
python app.py
```
Open your browser and navigate to:
**[http://localhost:5000](http://localhost:5000)**

### 4. Running the Test Suite
Execute the automated pytest suite:
```bash
pytest -v
```

---

## 🗂️ Application Structure

```
final Chemical Prototyping/
├── app.py                      # Flask server, route controllers, context processor & secure APIs
├── requirements.txt            # Python dependencies (Flask, pytest)
├── README.md                   # This documentation guide
├── data/
│   └── content.json            # Centralized content store (all text, steps, team, quiz, FAQs)
├── templates/
│   ├── base.html               # Master layout shell (glass nav, tokens, audio pill, footer)
│   ├── 404.html                # Custom reaction error page
│   ├── index.html              # Landing page with hero, wave SVG, bubbles canvas & team grid
│   ├── home.html               # Aim, 3-sentence detergent theory, stats & team cards
│   ├── ingredients.html        # 7 ingredient cards, category filter chips & reaction diagrams
│   ├── process.html            # 7 animated SVG scenes with signature reactive filling beaker
│   ├── flowchart.html          # Canva diagram zoom modal + native animated convergence map
│   ├── gallery.html            # Masonry lab photo grid, lightbox & video showcase
│   ├── applications.html       # 5 application domains & animated balance scale
│   ├── quiz.html               # 10-question quiz runner + accordion FAQ
│   └── partials/
│       ├── navbar.html         # Glassmorphism header with scroll progress bar
│       ├── footer.html         # Institutional credits & team PRN directory
│       ├── music-toggle.html   # Floating ambient sound pill
│       └── safety-banner.html  # Standard PPE & hazardous reagent warnings
├── static/
│   ├── css/
│   │   ├── tokens.css          # Design tokens (colors, typography, radii, shadows)
│   │   ├── base.css            # Base typography, reset, focus-visible & reduced motion
│   │   ├── components.css      # Reusable UI component library
│   │   └── pages.css           # Page-specific layouts and interactive animations
│   ├── js/
│   │   ├── main.js             # Navbar scroll shadow & global scroll progress bar
│   │   ├── music.js            # Ambient Web Audio synthesizer + audio fallback
│   │   ├── reveal.js           # IntersectionObserver scroll reveal system
│   │   ├── process-scenes.js   # 7-stage scene animations & reactive beaker controller
│   │   ├── flow.js             # Flowchart node tooltips & Canva lightbox modal
│   │   ├── gallery.js          # Masonry category filters & image lightbox
│   │   └── quiz.js             # Quiz runner communicating with /api/quiz and /api/score
│   └── media/
│       ├── group.jpg           # Team photo background on landing page
│       ├── canva-flow.png      # High-resolution Canva flowchart graphic
│       ├── music.mp3           # Ambient background audio loop
│       ├── photos/             # Lab photo records (photo1.svg - photo6.svg)
│       ├── videos/             # Benchtop video clips and poster frames
│       └── reactions/          # Reaction video clips and SVG fallback diagrams
└── tests/
    └── test_api.py             # Pytest test suite for routes, quiz security & validation
```

---

## ✏️ How to Customize and Replace Media Files

All text copy, team PRNs, and chemical descriptions are kept in **one centralized file**:
`data/content.json`

### 1. Setting Faculty Guide and Subject
Open `data/content.json` and locate the `"site"` object:
```json
"site": {
  "guide": "Prof. [Insert Faculty Name Here]",
  "subject": "Engineering Chemistry Laboratory (CH-102)"
}
```

### 2. Replacing the Landing Page Team Photo
- Replace `static/media/group.jpg` with your team's photo (recommended resolution: `1920x1080px`, landscape, under 300 KB).
- If absent, a clean gradient overlay will gracefully render with no console errors.

### 3. Replacing the Canva Flowchart
- Replace `static/media/canva-flow.png` with your exported Canva image (recommended width: `1600px`+).
- *Optional:* If you have an active Canva View Embed link, paste the URL into `content.json` under `"canva_embed_url"`. The site will automatically embed the live Canva canvas!

### 4. Updating Lab Photos & Benchtop Videos
- **Photos:** Place team experiment photos in `static/media/photos/` (e.g., `photo1.jpg`, `photo2.jpg`) and update the filenames in `templates/gallery.html`.
- **Videos:** Place short demonstration clips in `static/media/videos/` (`mixing-clip.mp4`, `viscosity-clip.mp4`).

### 5. Custom Background Audio
- Replace `static/media/music.mp3` with your preferred soft instrumental track.
- If no MP3 is supplied, the built-in Web Audio API generative synthesizer automatically plays calm 432 Hz atmospheric drone chords.

---

## 🔒 Security & Quiz Integrity
- Correct quiz answers are **never** bundled into the client bundle or returned by `GET /api/quiz`.
- Question grading occurs exclusively on the server in `POST /api/score`.
- HTTP response headers automatically include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## ♿ Accessibility & Performance Compliance
- **WCAG AA Contrast:** Strict color token ratios for all text against backgrounds.
- **Prefers-Reduced-Motion:** Static states automatically activate if reduced motion is preferred by the user's OS.
- **Keyboard Navigation:** Stepper supports Left/Right arrow keys; modals close with Escape; skip-to-content links provided.
