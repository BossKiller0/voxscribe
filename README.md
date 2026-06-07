# VoxScribe Windows

> System-wide voice dictation for Windows — inspired by Wispr Flow

A production-grade Electron + React + TypeScript desktop app that lets you dictate text **anywhere** on Windows using AI-powered transcription via Groq.

---

## ✨ Features

- 🎙️ **Global Hotkey**: Press `Ctrl+Shift` anywhere to start/stop dictating
- 🌐 **Universal Text Insertion**: Works in VS Code, Chrome, Word, Slack, Discord, Notepad — any text field
- 🤖 **AI Cleanup**: Removes filler words (um, uh, like), fixes grammar and punctuation
- 🖊️ **Writing Styles**: Casual, Professional, Technical, Executive, Friendly
- 🌍 **Multi-Language**: English, Hindi, Kannada, Tamil, Telugu, Malayalam
- 📚 **Custom Vocabulary**: Add names, brands, technical terms — AI always spells them right
- 📋 **Snippets**: Say "my email" → expands to your email address
- 🎯 **Voice Commands**: "Rewrite professionally", "Translate to Hindi", "Make shorter", etc.
- 📊 **History**: Searchable transcription history stored locally
- 🔒 **Privacy-First**: No telemetry, all data stored locally
- 🔇 **Silence & Mic Error Handling**: Smart microphone level monitoring shows a "Mic is not working" warning and prevents API transcription hallucinations (e.g. inserting "Thank you") if the mic is silent or disconnected.

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- npm 9+
- A [Groq API key](https://console.groq.com) (free tier works great)

### 2. Clone & Install

```bash
git clone <your-repo>
cd VoicetoText
npm install
```

### 3. Configure Environment (Optional)

Creating a `.env` file is completely optional. By default, the application will ask for your **Groq API Key** in the user interface when it first launches, so no technical file configuration is required.

If you wish to override the default model selections for transcription or AI cleanup, create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` to override any models:

```env
GROQ_SPEECH_MODEL_FAST=whisper-large-v3-turbo
GROQ_SPEECH_MODEL_ACCURATE=whisper-large-v3
GROQ_EDITOR_MODEL_FAST=llama-3.1-8b-instant
GROQ_EDITOR_MODEL_ACCURATE=llama-3.3-70b-versatile
```

### 4. Run in Development

```bash
npm run dev
```

The app launches and appears in your **system tray** (bottom-right of taskbar). On first launch, it will guide you to input your Groq API key.

---

## 🎙️ How to Use

1. **Click inside any text field** in any app (VS Code, Chrome, Word, Slack...)
2. **Press `Ctrl+Shift`** — the floating overlay appears and recording starts
3. **Speak** — the overlay shows a live waveform while listening
4. **Press `Ctrl+Shift` again** to stop recording
5. Your speech is transcribed, cleaned by AI, and typed at your cursor — done! ⚡

### AI Command Palette

Press `Ctrl+Shift+Enter` to open the AI command palette:
- "Rewrite professionally"
- "Summarize this"
- "Translate to Hindi"
- "Convert to bullet points"
- And more...

---

## 📁 Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # App entry, window creation
│   ├── tray.ts              # System tray
│   ├── hotkeys.ts           # Global hotkeys (Ctrl+Shift)
│   ├── logger.ts            # Winston logging
│   ├── store.ts             # electron-store settings
│   ├── ipc/                 # IPC handlers
│   │   ├── audio.ipc.ts     # Transcription pipeline
│   │   ├── settings.ipc.ts
│   │   ├── history.ipc.ts
│   │   ├── snippets.ipc.ts
│   │   ├── vocabulary.ipc.ts
│   │   └── window.ipc.ts
│   └── services/            # Core services
│       ├── interfaces.ts    # ITranscriptionProvider, IAIEditor, ICommandProcessor
│       ├── GroqSpeechService.ts    # Whisper transcription
│       ├── AIEditorService.ts      # LLM cleanup & commands
│       ├── TextInsertionService.ts # Clipboard + Ctrl+V insertion
│       ├── AudioRecordingService.ts
│       └── DatabaseService.ts     # SQLite (better-sqlite3)
├── preload/
│   ├── index.ts             # contextBridge API (window.voxScribeAPI)
│   └── types.d.ts
├── renderer/                # React frontend
│   ├── src/
│   │   ├── apps/            # Window entry apps
│   │   │   ├── DashboardApp.tsx
│   │   │   └── CommandPaletteApp.tsx
│   │   ├── pages/           # Dashboard pages
│   │   │   ├── HomePage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── SnippetsPage.tsx
│   │   │   ├── VocabularyPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── PrivacyPage.tsx
│   │   ├── components/      # Reusable components
│   │   │   ├── FloatingMicOverlay.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── HotkeyBadge.tsx
│   │   ├── store/           # Zustand stores
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # Global CSS
│   ├── index.html           # Dashboard window
│   ├── overlay.html         # Floating mic window
│   └── command-palette.html # AI command window
└── shared/
    └── types.ts             # Shared types, IPC channels, defaults
```

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_SPEECH_MODEL_FAST` | ❌ | `whisper-large-v3-turbo` | Fast transcription model |
| `GROQ_SPEECH_MODEL_ACCURATE` | ❌ | `whisper-large-v3` | Accurate transcription model |
| `GROQ_EDITOR_MODEL_FAST` | ❌ | `llama-3.1-8b-instant` | Fast AI cleanup model |
| `GROQ_EDITOR_MODEL_ACCURATE` | ❌ | `llama-3.3-70b-versatile` | Accurate AI cleanup model |

---

## 🧪 Running Tests

```bash
npm test
```

---

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in development mode |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |

---

## 🔌 Extensibility

VoxScribe is designed for future provider swapping:

- **`ITranscriptionProvider`** — Swap Groq for OpenAI, Gemini, or local Whisper
- **`IAIEditor`** — Swap LLM backend for any model
- **`ICommandProcessor`** — Add custom voice command handlers

---

## 🔒 Privacy

- ✅ Audio is sent to Groq API for transcription only
- ✅ Raw audio files deleted immediately after transcription
- ✅ All history stored locally in SQLite
- ✅ No telemetry or analytics
- ✅ Clipboard restored within 300ms after text insertion

---

## 📝 License

MIT
