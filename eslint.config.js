import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: new URL('.', import.meta.url).pathname,
});

export default [
  // Use Google's style guide via compat bridge (no package.json changes).
  ...compat.extends('google'),

  // Project-wide language options and globals.
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        requestAnimationFrame: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        XMLHttpRequest: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',

        // Web Audio API (expanded)
        AudioContext: 'readonly',
        OfflineAudioContext: 'readonly',
        BaseAudioContext: 'readonly',
        AudioNode: 'readonly',
        AudioParam: 'readonly',
        AudioBuffer: 'readonly',
        AudioBufferSourceNode: 'readonly',
        OscillatorNode: 'readonly',
        GainNode: 'readonly',
        BiquadFilterNode: 'readonly',
        DelayNode: 'readonly',
        DynamicsCompressorNode: 'readonly',
        IIRFilterNode: 'readonly',
        PannerNode: 'readonly',
        StereoPannerNode: 'readonly',
        ConvolverNode: 'readonly',
        WaveShaperNode: 'readonly',
        ChannelMergerNode: 'readonly',
        ChannelSplitterNode: 'readonly',
        ConstantSourceNode: 'readonly',
        AnalyserNode: 'readonly',
        PeriodicWave: 'readonly',
        MediaElementAudioSourceNode: 'readonly',
        MediaStreamAudioSourceNode: 'readonly',
        MediaStreamTrackAudioSourceNode: 'readonly',
        MediaStreamAudioDestinationNode: 'readonly',
        ScriptProcessorNode: 'readonly',
        AudioWorkletNode: 'readonly',
        AudioWorkletProcessor: 'readonly',
        registerProcessor: 'readonly',

        // WebAssembly
        WebAssembly: 'readonly',

        // TextDecoder/TextEncoder
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',

        // ES2021+ globals
        Promise: 'readonly',
        Symbol: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        globalThis: 'readonly',

        // Common
        arguments: 'readonly',
      },
    },
    rules: {
      // Ensure 80-col wrap per Google's style (explicit for clarity).
      'max-len': ['error', {
        code: 80,
        tabWidth: 2,
        ignoreUrls: true,
      }],
    },
  },

  // Worker files
  {
    files: ['**/*worker*.js', '**/*Worker*.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        Worker: 'readonly',
        postMessage: 'readonly',
        onmessage: 'readonly',
        importScripts: 'readonly',
        close: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },

  // Service worker files
  {
    files: ['**/*serviceworker*.js', '**/*service-worker*.js', '**/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        clients: 'readonly',
        registration: 'readonly',
        skipWaiting: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        console: 'readonly',
        caches: 'readonly',
        indexedDB: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },
  },

  // Global ignores
  {
    ignores: [
      // Archive and build directories
      '_site/archive/**',
      '_site/**/build/**',

      // All WASM related files
      '_site/**/*.wasm.js',
      '_site/**/*.wasmmodule.js',
      '_site/**/variable-buffer-kernel.wasmmodule.js',
      '_site/**/simple-kernel.wasmmodule.js',
      '_site/**/synth.wasm.js',

      // Service workers
      '_site/**/coi-serviceworker.js',
      '_site/**/*serviceworker*.js',

      // Generated/problematic files
      '_site/**/free-queue.js',
      '_site/**/wasm-worklet-processor.js',

      // Node modules and other build artifacts
      'node_modules/**',
      '_site/node_modules/**',

      // Specific problematic files that are likely generated
      '_site/**/design-pattern/wasm/**/*.js',
      '_site/**/design-pattern/wasm-ring-buffer/**/*.wasmmodule.js',
      '_site/**/design-pattern/wasm-supersaw/**/*.wasm.js',

      // Any file with "wasm" in the path that's likely generated
      '_site/**/*wasm*/**/*.js',

      // Free queue library files
      '_site/**/free-queue/**/*.js',
    ],
  },
];