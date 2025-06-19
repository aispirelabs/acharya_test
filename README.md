# Gemini Live API Voice Interface

A real-time voice conversation interface built with Next.js that leverages Google's Gemini Live API for natural, interrupt-capable AI interactions. Experience human-like conversations with sub-100ms latency and advanced audio processing.

## Features

- **Real-time Voice Conversations**: Stream audio directly to and from Gemini AI
- **Interrupt Capability**: Naturally interrupt AI responses like human conversations
- **Low Latency**: Sub-100ms response times with optimized audio pipelines
- **Text & Voice Input**: Dual input modes for flexible interaction
- **Volume Visualization**: Real-time audio level monitoring with visual feedback
- **Worklets Integration**: Advanced audio processing using AudioWorklets for real-time performance

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │   Audio Engine   │    │  Gemini Live    │
│                 │    │                  │    │      API        │
│ • Text Input    │◄──►│ • AudioStreamer  │◄──►│                 │
│ • Voice Button  │    │ • AudioWorklet   │    │ • WebSocket     │
│ • Volume Meter  │    │ • Volume Monitor │    │ • Streaming     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for end-to-end type safety
- **Styling**: Tailwind CSS with custom components
- **Audio**: Web Audio API with AudioWorklet processing
- **AI Integration**: Google Gemini Live API
- **State Management**: React Context with custom hooks
- **Real-time Communication**: WebSocket connections

## 🔧 Configuration

### API Configuration

Modify the Live API configuration in `src/hooks/use-live-api.ts`:

```typescript
const [config, setConfig] = useState<LiveConnectConfig>({
  tools: [{ googleSearch: {} }], // Enable Google Search
  // Add more configuration options
});
```

### Model Selection

Change the default model:

```typescript
const [model, setModel] = useState<string>("models/gemini-2.0-flash-exp");
```

### Audio Settings

Customize audio processing in `src/lib/utils.ts`:

```typescript
export const audioContext: (
  options?: GetAudioContextOptions
) => Promise<AudioContext>;
```


## 🔊 Audio Processing Pipeline

### AudioStreamer Class

- **PCM16 Decoding**: Converts Gemini's audio format
- **Real-time Playback**: Zero-latency audio rendering
- **Buffer Management**: Efficient audio buffer handling

### AudioWorklet Integration

- **Volume Monitoring**: Real-time audio level analysis
- **Dedicated Thread**: Off-main-thread audio processing
- **Visual Feedback**: Dynamic volume visualization

### Audio Context Management

- **Singleton Pattern**: Efficient AudioContext reuse
- **Browser Compliance**: Handles autoplay policies
- **Cross-browser Support**: Fallback mechanisms

## API Integration

### WebSocket Connection

- **Real-time Communication**: Bidirectional streaming
- **Connection Management**: Automatic reconnection
- **Error Handling**: Graceful failure recovery

### Gemini Live API Features

- **Streaming Audio**: Real-time voice processing
- **Context Awareness**: 32,768 token context window
- **Tool Integration**: Google Search capabilities
- **Interrupt Handling**: Natural conversation flow

## 🚀 Performance Optimization

### Audio Performance

- **AudioWorklet Threading**: Off-main-thread processing
- **Buffer Optimization**: Efficient memory management
- **Stream Processing**: Minimal latency audio pipeline

### Network Efficiency

- **Connection Reuse**: Persistent WebSocket connections
- **Binary Protocol**: Efficient audio transmission

### Test Audio Functionality

1. **Microphone Test**: Check browser permissions
2. **Speaker Test**: Verify audio output
3. **Connection Test**: Test WebSocket connectivity
4. **Latency Test**: Measure response times

## Prerequisites

- Node.js 18+
- npm or yarn package manager
- Modern browser with Web Audio API support
- Google AI Studio API key
- Microphone and speaker access

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Gokul-Nath-27/gemini-live-suite
cd gemini-live-suite
```

### 2. Install Dependencies

```bash
pnpm i
# or
npm i
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_LIVE_API_KEY=your_gemini_api_key_here
```

> **Get your API key**: Visit [Google AI Studio](https://aistudio.google.com/) to generate your Gemini API key.

### 4. Run Development Server

```bash
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Start Conversation

1. **Grant Permissions**: Allow microphone access when prompted
2. **Connect**: Click the connect button to establish WebSocket connection
3. **Interact**: Use text input or voice button to start conversation
4. **Interrupt**: Speak naturally to interrupt AI responses

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Debug Mode

Enable debug logging:

```typescript
const client = new GenAILiveClient({
  ...options,
  debug: true,
});
```

---

**Built with ❤️ using Next.js and Google Gemini Live API**

_Experience the future of AI conversation today._
