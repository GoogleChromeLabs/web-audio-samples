// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let audioContext = null;
let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let oscillatorNode = null;

const loadGraph = (context) => {
  oscillatorNode = new OscillatorNode(context);
  const bypasser = new AudioWorkletNode(context, 'bypass-processor');
  oscillatorNode.connect(bypasser).connect(context.destination);
  oscillatorNode.start();
};

const startAudio = async (context) => {
  if (!isModuleLoaded) {
    const processorUrl =
      new URL('bypass-processor.js', import.meta.url).href;
    await context.audioWorklet.addModule(processorUrl);
    isModuleLoaded = true;
  }
  if (!isGraphReady) {
    loadGraph(context);
    isGraphReady = true;
  }
};

const updateUI = (context) => {
  const pillGroup = document.getElementById('demo-pill-group');
  const button = document.getElementById('button-start');
  const sampleRateEl = document.getElementById('telemetry-sample-rate');
  const baseLatencyEl = document.getElementById('telemetry-base-latency');
  const outputLatencyEl = document.getElementById('telemetry-output-latency');
  const glitchEl = document.getElementById('telemetry-glitch-status');
  const contextStateEl = document.getElementById('telemetry-context-state');

  if (pillGroup && button) {
    if (!isGraphReady) {
      button.textContent = 'START';
      pillGroup.className =
        'inline-flex items-stretch rounded-full bg-blue-600 shadow-sm ' +
        'text-white transition-colors duration-150 overflow-hidden';
    } else if (isPlaying) {
      button.textContent = 'PAUSE';
      pillGroup.className =
        'inline-flex items-stretch rounded-full bg-amber-600 shadow-sm ' +
        'text-white transition-colors duration-150 overflow-hidden';
    } else {
      button.textContent = 'RESUME';
      pillGroup.className =
        'inline-flex items-stretch rounded-full bg-emerald-600 shadow-sm ' +
        'text-white transition-colors duration-150 overflow-hidden';
    }
  }

  if (context) {
    if (sampleRateEl) {
      sampleRateEl.textContent = `${context.sampleRate.toLocaleString()} Hz`;
    }
    if (baseLatencyEl) {
      baseLatencyEl.textContent =
        typeof context.baseLatency === 'number'
          ? `${(context.baseLatency * 1000).toFixed(2)} ms`
          : 'N/A';
    }
    if (outputLatencyEl) {
      outputLatencyEl.textContent =
        typeof context.outputLatency === 'number'
          ? `${(context.outputLatency * 1000).toFixed(2)} ms`
          : 'N/A';
    }
    if (glitchEl && !glitchEl.dataset.initialized) {
      glitchEl.dataset.initialized = 'true';
      if ('renderCapacity' in context) {
        context.renderCapacity.start({ updateInterval: 0.5 });
        context.renderCapacity.onupdate = (event) => {
          const loadPercent = Math.round(event.averageLoad * 100);
          if (event.underrunRatio > 0) {
            glitchEl.textContent = `Glitch (${loadPercent}% load)`;
            glitchEl.className = 'font-mono text-red-600 font-semibold';
          } else {
            glitchEl.textContent = `0 detected (${loadPercent}% load)`;
            glitchEl.className = 'font-mono text-emerald-600';
          }
        };
      }
    }

    if (contextStateEl) {
      contextStateEl.textContent = context.state;
      if (context.state === 'running') {
        contextStateEl.className =
          'font-semibold text-emerald-700 font-mono';
      } else if (context.state === 'suspended') {
        contextStateEl.className =
          'font-semibold text-amber-700 font-mono';
      } else {
        contextStateEl.className =
          'font-semibold text-slate-700 font-mono';
      }
    }
  } else if (contextStateEl) {
    contextStateEl.textContent = 'uninitialized';
    contextStateEl.className = 'font-semibold text-slate-500 font-mono';
  }
};

const setupDemo = () => {
  const buttonEl = document.getElementById('button-start');
  const telemetryBtn = document.getElementById('button-toggle-telemetry');
  const telemetryPanel = document.getElementById('telemetry-panel');

  if (telemetryBtn && telemetryPanel) {
    telemetryBtn.addEventListener('click', () => {
      telemetryPanel.classList.toggle('hidden');
      telemetryBtn.classList.toggle('bg-black/20');
    });
  }

  if (!buttonEl) return;

  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    if (!audioContext) {
      audioContext = new AudioContext();
      audioContext.onstatechange = () => {
        if (audioContext.state === 'running') {
          isPlaying = true;
        } else if (audioContext.state === 'suspended') {
          isPlaying = false;
        }
        updateUI(audioContext);
      };
    }

    if (!isPlaying) {
      await startAudio(audioContext);
      await audioContext.resume();
      isPlaying = true;
    } else {
      await audioContext.suspend();
      isPlaying = false;
    }

    updateUI(audioContext);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDemo);
} else {
  setupDemo();
}
