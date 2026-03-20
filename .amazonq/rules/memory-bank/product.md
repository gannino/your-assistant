# Product Overview — Your Assistant

## Purpose
A web/desktop application that acts as a real-time AI-powered assistant. It listens to live audio, transcribes speech to text, and generates intelligent AI responses to help users during any live session.

## Value Proposition
- Works cross-platform (Windows, Mac, iOS, Android, browser) — unlike competitors (Cheetah = Mac only, Ecoute = Windows only)
- Fully serverless: all API keys stored locally in the browser (no backend required)
- Free tier available: Web Speech API + Ollama/MLX requires no API keys
- Supports multiple AI and transcription providers with easy switching

## Key Features

### Core Workflow
1. User starts a session → transcription provider begins listening
2. Speech is transcribed in real-time and displayed in the Speech Recognition panel
3. User clicks "Ask AI" (or Auto Mode fires automatically) → AI generates a response
4. AI response streams into the AI Response panel with markdown rendering

### Multi-Provider Architecture
- 6 AI providers: OpenAI (GPT-3.5/4/4-Turbo), Z.ai (GLM-4), Ollama (local), MLX (Apple Silicon local), Anthropic (Claude 3), Gemini
- 4 transcription providers: Whisper (95-98% accuracy), Azure (90-95%), Deepgram (90-95%), Web Speech API (free, no key)

### Context Enrichment
- Upload PDF documents or scrape websites as reference material
- Context is pre-summarized before the session for instant responses
- Context auto-summarized via AI when it exceeds platform limits (100k chars desktop, 50k mobile)

### Auto Mode
- Automatically fires AI responses after a configurable silence delay (default 2500ms)
- Optional screenshot polling: captures screen every N ms, fires AI if content changed beyond a pixel diff threshold
- Toggle with ⚡ button; status shown in header

### Electron Desktop Overlay
- Runs as a transparent, always-on-top overlay window
- Global keyboard shortcuts (show/hide, mini mode, move window)
- Configurable opacity, blur, window size
- Screenshot capture for vision-capable models (Gemini, GPT-4V)

### Mobile Support
- Responsive layout with tab-based navigation (Speech / AI tabs)
- Session persistence via localStorage (restored within 1 hour)
- Platform-specific memory limits (10k transcript, 30k AI response on mobile)
- iOS-specific fixes: prevents auto-activation, touch-friendly buttons (44px min)

### Conversation History
- Rolling compacted history: each Q&A exchange is summarized into bullet points by the AI
- History included in subsequent requests for context continuity
- Incremental transcript processing: only new speech since last response is sent

## Target Users
- Anyone who needs a real-time AI assistant during live sessions (meetings, research, technical discussions)
- Developers wanting a local, private AI assistant with no backend required
- Users who need cross-platform support without installing native apps

## Deployment
- Primary: GitHub Pages (static SPA, hash-based routing)
- Secondary: Electron desktop app (Mac DMG, Windows NSIS/portable, Linux AppImage/deb)
- CI/CD: GitHub Actions for automated build and deploy
