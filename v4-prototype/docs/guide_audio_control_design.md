# GuideAudioControl Design Specification

## 1. Overview & Objectives

The `GuideAudioControl` is a supportive, floating audio transport and telemetry
dock designed for interactive developer guide pages in Web Audio Samples
(starting with `hello-audio-worklet`).

### Key Goals
1. **Unobtrusive & Supportive**: Runs quietly in the background without
   polluting sample code. Sample code remains 100% pure, canonical Web Audio API
   that developers can copy and paste directly into their own projects.
2. **Universal Transport & Safety**: Solves the "runaway audio" problem when
   users scroll through long guides and code blocks. Users can always
   pause, resume, stop, or mute audio from a fixed screen location.
3. **Deep Real-Time Diagnostics**: Gives developers and audio engineers insight
   into hardware latency, sample rate, rendering load, and glitch/underrun
   metrics.

---

## 2. Lifecycle State Machine

`GuideAudioControl` adopts a 4-state lifecycle aligned with the W3C Web Audio
API specification:

```
  ┌─────────────┐
  │ not-started │ ──(start)──> ┌─────────┐
  └─────────────┘              │ running │ <──(resume)──┐
         ▲                     └─────────┘              │
         │                          │                   │
      (reset)                   (suspend)               │
         │                          │                   │
  ┌─────────────┐                   ▼                   │
  │   closed    │ <──(close)── ┌───────────┐ ───────────┘
  └─────────────┘              │ suspended │
                               └───────────┘
```

### State Definitions

- **`not-started`** (`null` / uninitialized):
  Page loaded, waiting for user gesture (`⚪ Not Started`).
- **`running`** (`context.state === 'running'`):
  Audio graph active, processing render quanta (`🟢 Running`).
- **`suspended`** (`context.state === 'suspended'`):
  Audio clock halted, zero audio CPU load (`⏸ Suspended`).
- **`closed`** (`context.state === 'closed'`):
  AudioContext terminated, graph destroyed (`⏹ Closed`).

### State Transitions

- **`start()`**: Initiates `new AudioContext()`, constructs audio graph, and
  transitions from `not-started` to `running`.
- **`suspend()`**: Invokes `audioContext.suspend()`, transitioning `running` to
  `suspended`. Halts the hardware audio stream.
- **`resume()`**: Invokes `audioContext.resume()`, transitioning `suspended` to
  `running`. Resumes hardware playback.
- **`close()` / `reset()`**: Tears down active nodes, halts context, and resets
  state for a clean restart.

---

## 3. UI / UX Specification

The control is positioned at the **bottom-right corner** of the viewport with a
fixed, high z-index layout.

### 3.1 Minimized State (Default Dock)
A compact floating pill that remains accessible without obstructing guide text
or code snippets:

```
┌────────────────────────────────────────────────────────┐
│  🟢 Running  │  ⏸ Pause  │  🔊 80%  │  ⌃ Inspect      │
└────────────────────────────────────────────────────────┘
```

- **Status Indicator**: Colored dot and label reflecting the current state.
- **Quick Action**: Single-click toggle between Play, Pause, and Resume.
- **Volume & Mute**: Speaker button to mute/unmute instantly.
- **Expand Trigger**: Clicking the pill or chevron expands the telemetry card.

### 3.2 Expanded State (Telemetry & Diagnostics Drawer)
An inspector panel that slides upward to reveal hardware and performance data:

```
┌────────────────────────────────────────────────────────┐
│ 🎧 Guide Audio Control & Diagnostics            [✕]    │
├────────────────────────────────────────────────────────┤
│ State: 🟢 RUNNING           Audio Time: 00:12.45       │
├────────────────────────────────────────────────────────┤
│ 📊 AUDIO HARDWARE & LATENCY                            │
│  • Sample Rate:     48,000 Hz                          │
│  • Base Latency:    5.33 ms (buffer processing)        │
│  • Output Latency:  12.50 ms (device / OS output)      │
│  • Total Latency:   ~17.83 ms                          │
├────────────────────────────────────────────────────────┤
│ ⚡ REAL-TIME PERFORMANCE & GLITCHES                    │
│  • Audio Load:      3.2% (Peak: 6.8%)                  │
│  • Render Quantum:  128 frames (2.67 ms)               │
│  • Underruns:       0 glitches detected                │
├────────────────────────────────────────────────────────┤
│ 🎛️ MASTER CONTROLS                                    │
│  [ ▶ Resume ]   [ ⏸ Suspend ]   [ ⏹ Reset ]            │
│  Master Gain: [ 🔉 ══════════●═══ 80% ]                │
└────────────────────────────────────────────────────────┘
```

---

## 4. Telemetry & Glitch Metrics Engine

The diagnostic engine extracts metrics directly from standard and modern
Chromium Web Audio APIs:

### 4.1 Latency Metrics
- **Base Latency (`audioContext.baseLatency`)**: Processing delay incurred by
  the audio graph before passing buffers to the audio hardware.
- **Output Latency (`audioContext.outputLatency`)**: OS/driver delay between the
  audio output buffer and actual acoustic emission from the speakers.
- **Total Latency**: Calculated as `(baseLatency + outputLatency) * 1000` ms.

### 4.2 Glitch & Underrun Detection
1. **Primary: Chromium `AudioRenderCapacity`**:
   When available, the inspector starts listening to capacity updates:
   ```javascript
   if (audioContext.renderCapacity) {
     audioContext.renderCapacity.start({ updateInterval: 0.5 });
     audioContext.renderCapacity.addEventListener('update', (e) => {
       const avgLoad = (e.averageLoad * 100).toFixed(1);
       const peakLoad = (e.peakLoad * 100).toFixed(1);
       const underruns = e.underrunSuccessCount;
     });
   }
   ```
2. **Fallback: Clock-Drift Estimation**:
   For browsers without `renderCapacity`, the control monitors drift between
   `audioContext.currentTime` and `performance.now()`. If audio time slips
   behind wall-clock time by more than a render quantum, an underrun is logged.

### 4.3 Render Quantum Duration
Calculated from the fixed Web Audio quantum size (128 frames):
```
quantum_duration_ms = (128 / audioContext.sampleRate) * 1000
```
At 48 kHz, each render quantum lasts 2.67 ms.

---

## 5. API Surface & Integration Contract

To maintain pure, presentable code for learners, sample scripts do not import
any proprietary classes. Instead, they interact via a lightweight optional
bridge:

### 5.1 Sample Attachment Contract
In the sample's `main.js`:

```javascript
// main.js - 100% Vanilla Web Audio
let audioContext = null;
let osc = null;
let bypasser = null;

const startAudio = async () => {
  if (!audioContext) audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('bypass-processor.js');

  osc = new OscillatorNode(audioContext, { frequency: 440 });
  bypasser = new AudioWorkletNode(audioContext, 'bypass-processor');

  osc.connect(bypasser).connect(audioContext.destination);
  osc.start();
  await audioContext.resume();
};

const stopAudio = async () => {
  if (audioContext && audioContext.state === 'running') {
    await audioContext.suspend();
  }
};

// Explicit, 1-line connection to the guide's transport
window.guideAudioControl?.attach({
  start: startAudio,
  stop: stopAudio,
  getContext: () => audioContext,
});
```

### 5.2 `GuideAudioControl` Public API

```typescript
interface GuideAudioAttachment {
  start: () => Promise<void> | void;
  stop: () => Promise<void> | void;
  getContext: () => AudioContext | null;
}

class GuideAudioControl {
  // Attaches a sample to the transport
  attach(attachment: GuideAudioAttachment): void;

  // Remote transport triggers
  start(): Promise<void>;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  reset(): Promise<void>;

  // Master volume
  setMasterVolume(level: number): void;
  toggleMute(): void;

  // State inspection
  readonly state: 'not-started' | 'running' | 'suspended' | 'closed';
  readonly telemetry: TelemetrySnapshot;
}
```

---

## 6. Implementation Plan for `hello-audio-worklet`

1. **Create `GuideAudioControl.astro`**:
   - Implements the floating bottom-right dock and expandable inspector card.
   - Built with Tailwind CSS v4.
2. **Mount in Layout**:
   - Embed `<GuideAudioControl />` in `src/layouts/Layout.astro` so all guide
     pages inherit it automatically.
3. **Wire into `hello-audio-worklet/main.js`**:
   - Update `main.js` with `window.guideAudioControl?.attach(...)`.
4. **Remove Ad-Hoc Page Buttons**:
   - Clean up arbitrary start buttons from `hello-audio-worklet.md`, leaving a
     clean interactive card and direct focus on the source code.
