'use strict';

import createLinkFromAudioBuffer from './exporter.mjs';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

let isRecording = false;
let isMonitoring = false;
let visualizationEnabled = true;

const BUFFER_SIZE = 256;

// TODO: Refactor as buffers
let streamSampleRate;
const currData = new Array(2).fill([]);
let currDataGain = 0;
let recordLength = 0;

const ls = async (x) => console.log(await x);

document.addEventListener('DOMContentLoaded', init);

// TODO comment as necessary
async function init() {
  if (context.state === 'suspended') {
    await context.resume();
  }

  // Create intermediary nodes
  // TODO remove medians?
  const liveAnalyserNode = await new AnalyserNode(context, {
    fftSize: 128,
  });

  const monitorNode = context.createGain();
  const inputGain = context.createGain();
  const medianEnd = context.createGain();

  // Setup mic and processor
  const micStream = await setupMic();
  streamSampleRate = context.sampleRate;

  const recordBuffer = context.createBuffer(
      2,
      context.sampleRate * 5,
      context.sampleRate,
  );

  const spNode = setupScriptProcessor(micStream, recordBuffer);

  // Setup components
  setupMonitor(monitorNode);
  setupRecording(recordBuffer);
  setupVisualizers(liveAnalyserNode);


  const micSourceNode = context.createMediaStreamSource(micStream);

  // Setup node chain
  micSourceNode
      .connect(inputGain)
      .connect(medianEnd)
      .connect(liveAnalyserNode)
      .connect(spNode)
      .connect(monitorNode)
      .connect(context.destination);

  // Watch Context Status
  const setStatusText = (text) =>
    (document.querySelector('#ctx-status').innerHTML = text);
  context.addEventListener('statechange', (e) =>
    setStatusText(context.state),
  );
  setStatusText(context.state);
}

function setupScriptProcessor(stream, recordBuffer) {
  const processor = context.createScriptProcessor(BUFFER_SIZE);

  // Callback for ScriptProcessorNode.
  processor.onaudioprocess = function(e) {
    for (let channel = 0; channel < currData.length; channel++) {
      const inputData = e.inputBuffer.getChannelData(channel);
      const outputData = e.outputBuffer.getChannelData(channel);

      // Set data for live gain visualizer to interpret from
      currData[channel] = inputData;

      // If recording, feed data to recording buffer
      if (isRecording) {
        recordBuffer.copyToChannel(currData[channel], channel, recordLength);

        // Update recording length as necessary
        recordLength += inputData.length;
      }

      // Track and create sum for visualizers
      let sumSamples = 0;

      // Pass data through SPN's output to dest
      for (let sample = 0; sample < inputData.length; sample++) {
        const sampVal = inputData[sample];
        outputData[sample] = sampVal;
        sumSamples+=sampVal;
      }

      currDataGain = sumSamples / BUFFER_SIZE;
    }
  };

  return processor;
}

async function setupMic() {
  return await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      latency: 0,
    },
  });
}
// AUDIO

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

  // Controls
  const monitorButton = document.querySelector('#monitor');
  const monitorText = monitorButton.querySelector('span');

  monitorButton.addEventListener('click', (e) => {
    isMonitoring = !isMonitoring;
    updateMonitorGain(isMonitoring);
    monitorText.innerHTML = isMonitoring ? 'off' : 'on';
  });
}

/**
 * Set events and define callbacks for recording start/stop events
 * @param {AudioBuffer} recordBuffer recording buffer
 */
function setupRecording(recordBuffer) {
  const recordButton = document.querySelector('#record');
  const recordText = recordButton.querySelector('span');
  const player = document.querySelector('#player');
  const downloadButton = document.querySelector('#download');

  recordButton.addEventListener('click', (e) => {
    isRecording = !isRecording;

    recordText.innerHTML = isRecording ? 'Stop' : 'Start';

    // Called when recording is paused
    if (!isRecording) {
      const wavUrl = createLinkFromAudioBuffer(recordBuffer, true);

      // drawRecordingVis(recordBuffer);

      document.querySelector('#data-len').innerHTML =
        Math.round(recordLength / streamSampleRate * 100)/100;
      player.src = wavUrl;
      downloadButton.src = wavUrl;
      downloadButton.download = 'recording.wav';
    }
  });
}

/** Setup all visualizers.
 * @param {AnalyserNode} liveAnalyser Live Analyser node to
 * render live frequency graph from
 * @param {AudioBuffer} recordBuffer recording buffer
  */
function setupVisualizers(liveAnalyser, recordBuffer) {
  setupLiveGainVis();
  setupLiveAnalyserVis(liveAnalyser);
  setupRecordingVis();

  const visToggle = document.querySelector('#viz-toggle');
  visToggle.addEventListener('click', (e) => {
    visualizationEnabled = !visualizationEnabled;
    visToggle.querySelector('span').innerHTML = visualizationEnabled ?
            'Pause' :
            'Play';
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

  // save buffer as data
  const drawStart = width-1;

  const draw = () => {
    requestAnimationFrame(draw);
    if (!visualizationEnabled || !currData) return;

    const centerY = ((1 - currDataGain) * height) / 2;
    const gainHeight = currDataGain * height;

    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(drawStart, centerY, 1, gainHeight);

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

  const width = canvas.width;
  const height = canvas.height;
  const barWidth = width / bufferLength;

  function draw() {
    requestAnimationFrame(draw);
    if (!visualizationEnabled) return;

    canvasContext.clearRect(0, 0, width, height);

    // save buffer as data

    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    dataArray.forEach((item, index) => {
      const y = (item / 255) * height * 0.9;
      const x = barWidth * index;

      canvasContext.fillStyle = `hsl(${
        (y / height) * 2 * 200
      }, 100%, 50%)`;
      canvasContext.fillRect(x, height - y, barWidth, y);
    });
  }

  draw();
}

function setupRecordingVis(recordBuffer) {
  const canvas = document.querySelector('#recording-canvas');
  const canvasContext = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  // save buffer as data

  // draw first red bar
  canvasContext.fillStyle = 'red';
  canvasContext.fillRect(0, 0, 1, 1);

  let currX = 0;

  function draw() {
    requestAnimationFrame(draw);
    if (!isRecording || !visualizationEnabled || !currData) return;

    const centerY = ((1 - currDataGain) * height) / 2;
    const gainHeight = currDataGain * height;

    // clear current
    canvasContext.fillStyle = 'white';
    canvasContext.fillRect(currX, 0, 1, height);

    // draw red bar 1 ahead
    canvasContext.fillStyle = 'red';
    canvasContext.fillRect(currX+1, 0, 1, height);

    // draw current gain
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(currX, centerY, 1, gainHeight);

    if (currX < width - 2) {
      currX++;
    } else {
      // If the waveform fills the canvas, move it by one pixel to the left to
      // make room.
      canvasContext.globalCompositeOperation = 'copy';
      canvasContext.drawImage(canvas, -1, 0);
      canvasContext.globalCompositeOperation = 'source-over';
    }
  }

  draw();
}
