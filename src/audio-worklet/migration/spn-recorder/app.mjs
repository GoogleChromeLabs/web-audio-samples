'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

const context = new AudioContext();

// Arbitrary buffer size chosen
const BUFFER_SIZE = 256;
let isRecording = false;
let isMonitoring = false;
let visualizationEnabled = true;
let currentSample = [];
let currentSampleGain = 0;
let recordingLength = 0;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (context.state === 'suspended') {
    await context.resume();
  }

  // Setup mic stream
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      latency: 0,
    },
  });
  const micSourceNode = context.createMediaStreamSource(micStream);

  // Setup ScriptProcessorNode
  const recordBuffer = context.createBuffer(
      2,
      context.sampleRate * 5,
      context.sampleRate,
  );
  const spNode = setupScriptProcessor(recordBuffer);

  // Create intermediary nodes
  const monitorNode = context.createGain();
  const inputGain = context.createGain();
  const medianEnd = context.createGain();
  const liveAnalyserNode = new AnalyserNode(context, {
    fftSize: 128,
  });

  // Setup components
  setupMonitor(monitorNode);
  setupRecording(recordBuffer);
  setupVisualizers(liveAnalyserNode);

  // Setup node chain
  micSourceNode
      .connect(inputGain)
      .connect(medianEnd)
      .connect(liveAnalyserNode)
      .connect(spNode)
      .connect(monitorNode)
      .connect(context.destination);
}

/**
 * Creates script processor and defines callback
 * @param {AudioBuffer} recordBuffer
 * @return {ScriptProcessorNode} script processor node
 */
function setupScriptProcessor(recordBuffer) {
  const processor = context.createScriptProcessor(BUFFER_SIZE);
  currentSample = new Array(recordBuffer.numberOfChannels).fill({});

  processor.onaudioprocess = function(event) {
    // For all channels
    for (let channel = 0; channel < currentSample.length; channel++) {
      const inputData = event.inputBuffer.getChannelData(channel);

      if (channel === 0) {
        // Find average gain (for visualizers).
        // First channel only, for simplicity
        let sumSamples = 0;
        for (let sample = 0; sample < inputData.length; sample++) {
          sumSamples+=inputData[sample];
        }
        currentSampleGain = sumSamples / BUFFER_SIZE;
      }

      // Set data for live gain visualizer to interpret from
      currentSample[channel] = inputData;

      // If recording, feed data to recording buffer
      if (isRecording) {
        recordBuffer.copyToChannel(currentSample[channel], channel, recordingLength);
      }

      // Pass audio data through to output
      event.outputBuffer.copyToChannel(inputData, channel, 0);
    }

    // Update tracked recording length
    if (isRecording) {
      recordingLength += BUFFER_SIZE;
    }
  };

  return processor;
}

/**
 * Sets up monitor feature (listen to mic live) and handles gain changes
 * @param {GainNode} monitorNode Gain node to adjust for monitor gain.
 */
function setupMonitor(monitorNode) {
  monitorNode.gain.value = 0;

  const updateMonitorGain = (enabled) => {
    const newVal = enabled ? 1 : 0;
    monitorNode.gain.setTargetAtTime(newVal, context.currentTime, 0.01);
  };

  const monitorButton = document.querySelector('#monitor');
  const monitorText = monitorButton.querySelector('span');

  monitorButton.addEventListener('click', (event) => {
    isMonitoring = !isMonitoring;
    updateMonitorGain(isMonitoring);
    monitorText.innerHTML = isMonitoring ? 'off' : 'on';
  });
}

/**
 * Set events and define callbacks for recording start/stop events
 * @param {AudioBuffer} recordBuffer Buffer of the current recording.
 */
function setupRecording(recordBuffer) {
  const recordButton = document.querySelector('#record');
  const recordText = recordButton.querySelector('span');
  const player = document.querySelector('#player');
  const downloadButton = document.querySelector('#download');

  async function prepareClip() {
    // Get recording file URL
    const wavUrl = createLinkFromAudioBuffer(recordBuffer, true);

    // Calculate length
    document.querySelector('#data-len').innerHTML =
      Math.round(recordingLength / recordBuffer.sampleRate * 100)/100;

    // Set URL on player and download button
    player.src = wavUrl;
    downloadButton.src = wavUrl;
    downloadButton.download = 'recording.wav';
  }

  recordButton.addEventListener('click', (e) => {
    isRecording = !isRecording;

    // When recording is paused, process clip
    if (!isRecording) {
      prepareClip();
    }

    recordText.innerHTML = isRecording ? 'Stop' : 'Start';
  });
}

/**
 * Sets up all visualizers.
 * @param {AnalyserNode} liveAnalyser Live Analyser node to
 * render live frequency graph from
  */
function setupVisualizers(liveAnalyser) {
  setupLiveGainVis();
  setupLiveAnalyserVis(liveAnalyser);
  setupRecordingGainVis();

  const visToggle = document.querySelector('#viz-toggle');
  visToggle.addEventListener('click', (e) => {
    visualizationEnabled = !visualizationEnabled;
    visToggle.querySelector('span').innerHTML =
      visualizationEnabled ? 'Pause' : 'Play';
  });
}

/**
 * Script Processor Frequency Visualizer
 */
const setupLiveGainVis = () => {
  const canvas = document.querySelector('#live-canvas');
  const canvasContext = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  const drawStart = width-1;

  const draw = () => {
    requestAnimationFrame(draw);
    if (!visualizationEnabled || !currentSample) return;

    // Determine center and gain height
    const centerY = ((1 - currentSampleGain) * height) / 2;
    const gainHeight = currentSampleGain * height;

    // Fill gain
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(drawStart, centerY, 1, gainHeight);

    // Copy visualizer left
    canvasContext.globalCompositeOperation = 'copy';
    canvasContext.drawImage(canvas, -1, 0);
    canvasContext.globalCompositeOperation = 'source-over';
  };

  draw();
};

/**
 * Analyser Frequency Visualizer
 * @param {AnalyserNode} analyserNode Analyser node to
 * interpret frequency data from
 */
function setupLiveAnalyserVis(analyserNode) {
  const canvas = document.querySelector('#analyzer-vis');
  const canvasContext = canvas.getContext('2d');

  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const width = canvas.width;
  const height = canvas.height;
  const barWidth = width / bufferLength;

  function draw() {
    requestAnimationFrame(draw);
    if (!visualizationEnabled) return;

    canvasContext.clearRect(0, 0, width, height);
    analyserNode.getByteFrequencyData(dataArray);

    dataArray.forEach((item, index) => {
      // Determine bar height by gain
      const y = (item / 255) * height * 0.9;
      const x = barWidth * index;

      // Determine bar color by height
      canvasContext.fillStyle = `hsl(${
        (y / height) * 2 * 200
      }, 100%, 50%)`;
      canvasContext.fillRect(x, height - y, barWidth, y);
    });
  }

  draw();
}

/**
 * Sets up recording gain visualizer.
 */
function setupRecordingGainVis() {
  const canvas = document.querySelector('#recording-canvas');
  const canvasContext = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  // draw first red bar
  canvasContext.fillStyle = 'red';
  canvasContext.fillRect(0, 0, 1, 1);

  let currX = 0;

  function draw() {
    requestAnimationFrame(draw);
    if (!isRecording || !visualizationEnabled || !currentSample) return;

    const centerY = ((1 - currentSampleGain) * height) / 2;
    const gainHeight = currentSampleGain * height;

    // Clear current Y
    canvasContext.clearRect(currX, 0, 1, height);

    // Draw recording bar 1 ahead
    canvasContext.fillStyle = 'red';
    canvasContext.fillRect(currX+1, 0, 1, height);

    // Draw current gain
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(currX, centerY, 1, gainHeight);

    if (currX < width - 2) {
      currX++;
    } else {
      // If the waveform fills the canvas,
      // move it by one pixel to the left to make room
      canvasContext.globalCompositeOperation = 'copy';
      canvasContext.drawImage(canvas, -1, 0);
      canvasContext.globalCompositeOperation = 'source-over';
    }
  }

  draw();
}
