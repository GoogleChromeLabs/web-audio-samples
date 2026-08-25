# Stanford CCRMA Music 220A Intake & Integration Plan

## 1. Overview & Curriculum Value

The [ccrma/music220a](https://github.com/ccrma/music220a) repository contains a
comprehensive, university-grade computer music curriculum designed for Stanford
University's **Music 220A (Fundamentals of Computer-Generated Sound)** course.

### Curriculum Scope
- `01-orientation`: Web Audio & dev environment setup
- `02-waa-basics`: AudioContext, OscillatorNode, GainNode, audio graph basics
- `03-additive`: Harmonic series, additive synthesis, Bell & Clarinet models
- `04-subtractive`: Biquad filters, white/pink noise, subtractive synthesis
- `05-modulation`: AM (Amplitude), RM (Ring), and FM (Frequency Modulation)
- `06-sample-and-synthesis`: BufferSource, granular synthesis, wavetables
- `07-time-and-space`: Delay lines, ConvolverNode, spatial panning
- `08-user-interaction`: Keyboard, mouse, MIDI event triggers, envelopes
- `09-nonlinear-effects`: WaveShaperNode, distortion curves, compression
- `webchuck`: WebChuck / ChucK integration in Web Audio
- `starters/`: Starter project templates for assignments

---

## 2. Integration Approaches

### Option 1 (Recommended): Integrated "Learn" Curriculum in `dev-portal`

Transform the 9 course modules into a first-class **"Learn" / "Curriculum"**
section inside `dev-portal/`:

```
dev-portal/src/
├── content/
│   ├── docs/                   # API reference & Worklet patterns
│   └── learn/                  # Stanford CCRMA Music 220a Curriculum
│       ├── 01-orientation/
│       ├── 02-waa-basics/
│       ├── 03-additive/
│       ├── 04-subtractive/
│       ├── 05-modulation/
│       ├── 06-sample-and-synthesis/
│       ├── 07-time-and-space/
│       ├── 08-user-interaction/
│       └── 09-nonlinear-effects/
```

#### Why This is the Best Approach:
1. **Fills the Educational Gap**: While `web-audio-samples` has great advanced
   demos and Worklet patterns, it currently lacks a structured, progressive
   pedagogical curriculum for beginners and students.
2. **Deep Synergy with Rainfly**: Each lesson example can feature an **"Open in
   Rainfly Playground"** button, letting learners immediately edit code, tweak
   parameters, and hear changes in real-time.
3. **Template Starters**: The `starters/` templates from Music 220A can serve
   as pre-bundled starter templates in Rainfly.

---

### Option 2: Standalone Course Portal in `projects/music220a/`

Host Music 220A as an autonomous standalone SPA tool at
`https://.../music220a/` alongside Rainfly and Canopy.

- **Pros**: Preserves 100% of the standalone course identity.
- **Cons**: Fragments the developer portal documentation and search indexing.

---

## 3. Recommended Implementation Plan (The Hybrid Model)

1. **Host Lessons in `dev-portal/learn/music220a/`**:
   - Convert course markdown and HTML examples to Astro Content Collections.
   - Embed interactive audio preview controls directly in each lesson page.
2. **One-Click "Open in Rainfly IDE"**:
   - Provide a deep-link mechanism: `/rainfly?template=music220a-05-fm-synth`.
3. **Consolidate Audio Assets**:
   - Move sample assets from `music220a/sound/` into
     `dev-portal/public/sounds/music220a/`.
4. **WebChuck Integration**:
   - Place WebChuck examples under `dev-portal/learn/music220a/webchuck/` and
     `tests/latency/chuck-realtime-sine.html`.
