<div align="center">

# Yuki

**An AI Personal Growth Assistant Powered by Multi-Agent Collaboration**

*Three minds, one growth.   Let every day of growth be seen.*

[![License: MIT](https://img.shields.io/badge/License-MIT-c69b4f.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-18.3-1f4e79.svg)](https://react.dev)
[![Status](https://img.shields.io/badge/status-MVP%20v0.1-success.svg)](#)
[![中文](https://img.shields.io/badge/lang-中文-red.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)

[**🌐 Live Demo**](#) ·
[**📐 Figma Prototypes**](./prototypes.html) ·
[**🖼 Design**](./design.html) ·
[**💬 Product Demo**](./app.html) ·
[**📄 Full PRD**](./docs.html) ·
[**📊 Eval Report**](./docs/EVAL_REPORT.md)

</div>

---

Yuki is an AI personal growth assistant designed for **university students**.
Three independent AI agents — **Planner / Executor / Reviewer** — collaborate via a Shared Memory to complete the full loop of *set goal → break down → daily execution → weekly review*.

> **Key results**: Average LLM-as-Judge score **4.3/5** across 50 evaluation scenarios; task completion rate **+38%** vs single-agent baseline; goal-achievement satisfaction **86%**.

---

## ✨ Highlights

- **🎯 Three-Agent collaboration** — Planner / Executor / Reviewer with distinct roles, decoupled via Shared Memory
- **🧠 Real LLM-driven** — Each agent uses its own system prompt to call a real LLM, not scripted
- **🔌 Multi-provider** — Demo mode works out-of-the-box; bring your own key for Anthropic / OpenAI / DeepSeek
- **🔄 Shared Memory** — Centralized state, observable in real time via the bottom-right Memory Inspector
- **📊 LLM-as-Judge + Bad Case Library** — Automated grading on 50 scenarios; bad cases feed back to prompt iteration
- **🎨 World-class visual design** — OKLCH color space, light/dark themes, references Apple / Anthropic
- **⚡ Zero-build** — Pure static + React CDN + Babel Standalone. Clone and deploy anywhere.

---

## 🚀 Quick Start

### Option 1: Run Locally

```bash
git clone https://github.com/SAMSUNGApple7/Yuki.git
cd Yuki

# Start any local server (cannot open .html directly due to CORS)
python -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000` in your browser.

### Option 2: One-Click Deploy

| Platform | Setup |
|---|---|
| **Vercel** | Import the repo at [vercel.com/new](https://vercel.com/new), no config needed |
| **Netlify** | Connect repo at [app.netlify.com](https://app.netlify.com/start) |
| **Cloudflare Pages** | Framework: `None` · Build command: empty · Output directory: `/` |
| **GitHub Pages** | Settings → Pages → Source: `main` branch, `/` (root) |

---

## 🔑 Bring Your Own LLM API Key

By default, Yuki runs in **Demo mode** with structured stub responses — first-time visitors get the full product flow without any setup.

To switch to a real LLM:

1. Open **Demo page → Settings (top-right)**
2. Pick a provider: **Anthropic / OpenAI / DeepSeek**
3. Paste your API key (stored only in browser localStorage, never uploaded)
4. Optionally choose a model version (defaults: `claude-haiku-4-5` / `gpt-4o-mini` / `deepseek-chat`)

### Agent Prompts

| Agent | Role | Key Constraint |
|---|---|---|
| 🎯 **Planner** | Strategist | Outputs strict JSON task tree: `{title / day / est / priority}` |
| ⚡ **Executor** | Coach | Reads today's tasks from Memory, detects blockers, pushes guidance |
| 📊 **Reviewer** | Advisor | Aggregates a week's events, outputs `summary / insights[3] / next_week[3]` |

Full system prompts in [`app/agent-engine.js`](./app/agent-engine.js) under `PROMPTS`.

---

## 📊 Evaluation

See [`docs/EVAL_REPORT.md`](./docs/EVAL_REPORT.md).

| Metric | Single-Agent Baseline | Yuki Three-Agent | Δ |
|---|---|---|---|
| LLM-as-Judge composite | 3.4 / 5 | **4.3 / 5** | +26% |
| Task completion (21-day avg) | 51% | **70.4%** | **+38%** |
| Goal-achievement satisfaction | — | **86%** | — |

---

## 🗺️ Roadmap

- [x] v0.1 · Three-agent core loop
- [x] v0.1 · Multi-LLM adapter (Claude / OpenAI / DeepSeek)
- [x] v0.1 · 50-scenario eval set + LLM-as-Judge + Bad Case library
- [x] v0.1 · Full design system + 15 Figma-style high-fidelity prototypes
- [ ] v0.2 · Mobile responsive + PWA
- [ ] v0.3 · LLM router + Cloudflare Workers proxy
- [ ] v0.5 · Habit-building agent (4th agent, long-term horizon)
- [ ] v1.0 · Cross-device sync · iOS app

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs welcome.

---

## 📄 License

[MIT](./LICENSE) © 2025 Gao Yihang
