"use strict";

const DELETE_BUTTON_SELECTOR = ".delete-button";

const recordButton = document.querySelector("#record");
const recordOutlineEl = document.querySelector("#record-outline");
const soundClips = document.querySelector(".sound-clips");
const clipTemplate = document.querySelector("#clip-template");

new mdc.iconButton.MDCIconButtonToggle(recordButton);
recordButton.onclick = startRecording;

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
async function startRecording() {
  const chunks = [];
  const stream = await getAudioStream();
  if (!stream) {
    return; // Permissions have not been granted or an error occurred.
  }

  // Insert a new audio clip at the top of the list.
  const clipContainer = clipTemplate.content.firstElementChild.cloneNode(true);
  clipContainer.querySelector(DELETE_BUTTON_SELECTOR).onclick = () => {
    clipContainer.parentNode.removeChild(clipContainer);
  };
  soundClips.prepend(clipContainer);

  // Start recording the microphone's audio stream in-memory.
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = ({ data }) => {
    chunks.push(data);
  };
  mediaRecorder.onstop = () => {
    onRecordingStopped({ clipContainer, chunks });
  };
  mediaRecorder.start();

  recordButton.onclick = () => {
    mediaRecorder.stop();
  };
  visualizeRecording({ stream, clipContainer, mediaRecorder });
}

/** Finalizes the audio recording.. */
function onRecordingStopped({ clipContainer, chunks }) {
  const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
  chunks = [];

  clipContainer.querySelector("audio").src = URL.createObjectURL(blob);
  clipContainer.classList.remove("clip-recording");
  recordButton.onclick = startRecording;
}

/** Visualizes the audio with a waveform and a loudness indicator. */
function visualizeRecording({ stream, clipContainer, mediaRecorder }) {
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
    const width = canvas.width;
    const height = canvas.height;

    // Read the maximum power from the FFT ana
    analyser.getByteFrequencyData(dataArray);
    const volume = Math.max(...dataArray) / 255;

    if (mediaRecorder.state !== "recording") {
      recordOutlineEl.style.boxShadow = "none";
      return; // Stop drawing loop once MediaRecorder stopped.
    }

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
