# Rainfly
<div style="display: flex; justify-content: center">
  <img src="src/lib/assets/splash.svg" alt="Rainfly logo" />
</div>

**An AudioWorklet DSP Playground for Chromium Web Audio API Project (2024)**

## Developing
Install dependencies with `npm install` (or `pnpm install` or `yarn`), and then start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of Rainfly:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Using Parameters in Rainfly Examples

Rainfly supports defining parameters inside comments, which are automatically parsed and used in the execution.

### Sample Rate Parameter
To specify the sample rate for the AudioContext, use the following syntax:

```js
// @sampleRate = 48000
```

If not specified, the default sample rate of **48000 Hz** is used. This allows easy configuration without manually setting `AudioContextOptions.sampleRate`.
