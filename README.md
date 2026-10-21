# EchoMesh — Web Client

Production-ready, audio-only ephemeral multi-user voice rooms and zero-persistence live text chat using an **Audio-Only Raw WebRTC P2P Mesh architecture**.

## 🚀 Features
- **Strictly Modern JavaScript (ES Modules / JSX):** No TypeScript, clean modern standard JavaScript.
- **Audio-Only Raw WebRTC P2P Mesh:** Direct peer-to-peer audio mesh network without media servers.
- **Real-Time Active Speaking Indicator:** Web Audio API (`AudioContext` and `AnalyserNode`) monitors mic levels to pulse speaking rings in real time.
- **Dynamic Microphone Device Selector:** Enumerate hardware input devices and swap microphones on the fly using `RTCRtpSender.replaceTrack()`.
- **Zero-Persistence Live Chat:** Real-time text chat relay streamed over Socket.io with auto-scroll and zero server database footprints.
- **Room Moderation Suite:** Host role transfer, capacity slider (2-10 peers), remote mute control, and kick actions.
- **Direct Link Sharing:** Instant room invitation links via query param `/?room=ROOM_ID`.
- **Dark Minimalist Aesthetic:** Slate/zinc dark palette with glassmorphism, responsive for mobile and desktop screens.

## 🛠️ Stack
- React 18
- Vite
- Tailwind CSS
- Lucide React
- Socket.io Client

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_SIGNALING_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates production bundle in `/dist` ready for hosting on Vercel, Netlify, or any static provider.