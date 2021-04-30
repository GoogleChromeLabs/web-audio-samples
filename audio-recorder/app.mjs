"use strict";

import { IndexedDBStorage } from "./indexeddb-storage.mjs";

const DELETE_BUTTON_SELECTOR = ".delete-button";

const recordButton = document.querySelector("#record");
const recordOutlineEl = document.querySelector("#record-outline");
const soundClips = document.querySelector(".sound-clips");
const clipTemplate = document.querySelector("#clip-template");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  new mdc.iconButton.MDCIconButtonToggle(recordButton);
  recordButton.onclick = () => startRecording({ storage });

  const storage = new IndexedDBStorage();
  await storage.open();

  for await (const [id, blob] of storage.readAll()) {
    const clipContainer = insertClip();
    finalizeClip({ clipContainer, id, blob, storage });
  }
}

/** Inserts a new audio clip at the top of the list. */
function insertClip() {
  const clipContainer = clipTemplate.content.firstElementChild.cloneNode(true);
  soundClips.prepend(clipContainer);
  return clipContainer;
}

/** Finalizes the audio clip card by replacing the visualization with the audio element. */
function finalizeClip({ clipContainer, blob, id, storage }) {
  clipContainer.querySelector(DELETE_BUTTON_SELECTOR).onclick = () => {
    clipContainer.parentNode.removeChild(clipContainer);
    storage.delete(parseInt(id));
  };
  clipContainer.querySelector("audio").src = URL.createObjectURL(blob);
  clipContainer.classList.remove("clip-recording");
}

/** Accesses the device's microphone and returns an audio stream (or null on error). */
async function getAudioStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Starts recording an audio snippet in-memory and visualizes the recording waveform.  */
async function startRecording({ storage }) {
  const chunks = [];
  const stream = await getAudioStream();
  if (!stream) {
    return; // Permissions have not been granted or an error occurred.
  }

  const clipContainer = insertClip();

  // Start recording the microphone's audio stream in-memory.
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = ({ data }) => {
    chunks.push(data);
  };
  mediaRecorder.onstop = async () => {
    recordButton.onclick = () => startRecording({ storage });
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
    const id = await storage.save(blob);
    finalizeClip({ clipContainer, id, blob, storage });
  };
  mediaRecorder.start();

  recordButton.onclick = () => {
    // Stop the audio track to remove the browser's recording indicator and stop the MediaRecorder.
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  };
  visualizeRecording({ stream, clipContainer });
}

/** Visualizes the audio with a waveform and a loudness indicator. */
function visualizeRecording({ stream, clipContainer }) {
  const canvas = clipContainer.querySelector("canvas");
  canvas.width = clipContainer.offsetWidth;

  const canvasCtx = canvas.getContext("2d");
  canvasCtx.fillStyle = "#263238";
  canvasCtx.setLineDash([2, 5]);

  // Use AnalyserNode to compute the recorded audio's power to visualize loudness.
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 32; // Smallest possible FFT size for cheaper computation.
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  // Horizontal position in the canvas for drawing the waveform.
  let x = 0;

  /** Repeatedly draws the waveform and loudness indicator. */
  function draw() {
    if (!stream.active) {
      recordOutlineEl.style.boxShadow = "none";
      return; // Stop drawing loop once the recording stopped.
    }

    const width = canvas.width;
    const height = canvas.height;

    // Read the maximum power from the FFT ana
    analyser.getByteFrequencyData(dataArray);
    const volume = Math.max(...dataArray) / 255;

    // Visualize current loudness through a ring around the record button.
    const radius = volume * 20;
    recordOutlineEl.style.boxShadow = `0 0 0 ${radius}px rgba(0, 0, 0, 0.2)`;

    // Before drawing the first waveform, draw a horizontal, dashed line in the center of the canvas.
    if (x == 0) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, height / 2);
      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    }

    // Append a vertical line on the right of the waveform, that indicates the loudness.
    canvasCtx.fillRect(x, ((1 - volume) * height) / 2, 1, volume * height);

    if (x < width - 1) {
      x++;
    } else {
      // If the waveform fills the canvas, move it by one pixel to the left to make room.
      canvasCtx.globalCompositeOperation = "copy";
      canvasCtx.drawImage(canvas, -1, 0);
      canvasCtx.globalCompositeOperation = "source-over";
    }

    requestAnimationFrame(draw);
  }

  draw();
}
