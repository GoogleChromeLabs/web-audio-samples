"use strict";

const recordButton = document.querySelector("#record");
const recordOutlineEl = document.querySelector("#record-outline");
const soundClips = document.querySelector(".sound-clips");
const clipTemplate = document.querySelector("#clip-template");

new mdc.iconButton.MDCIconButtonToggle(recordButton);
recordButton.onclick = startRecording;

async function getAudioStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function startRecording() {
  const chunks = [];
  const stream = await getAudioStream();
  if (!stream) {
    return;
  }

  const mediaRecorder = new MediaRecorder(stream);

  const clipContainer = clipTemplate.content.firstElementChild.cloneNode(true);
  clipContainer.querySelector(".delete-button").onclick = () => {
    clipContainer.parentNode.removeChild(clipContainer);
  };
  soundClips.prepend(clipContainer);

  mediaRecorder.onstop = () => {
    onRecordingStopped({ clipContainer, chunks });
  };
  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };

  recordButton.onclick = () => mediaRecorder.stop();
  mediaRecorder.start();
  visualizeRecording({ stream, clipContainer, mediaRecorder });
}

function onRecordingStopped({ clipContainer, chunks }) {
  const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
  chunks = [];

  clipContainer.querySelector("audio").src = URL.createObjectURL(blob);
  clipContainer.classList.remove("clip-recording");
  recordButton.onclick = startRecording;
}

function visualizeRecording({ stream, clipContainer, mediaRecorder }) {
  const canvas = clipContainer.querySelector("canvas");
  canvas.width = clipContainer.offsetWidth;

  const canvasCtx = canvas.getContext("2d");
  canvasCtx.fillStyle = "#263238";
  canvasCtx.setLineDash([2, 5]);

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 32;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  let x = -1;

  function draw() {
    const width = canvas.width;
    const height = canvas.height;

    analyser.getByteFrequencyData(dataArray);
    const volume = Math.max(...dataArray) / 255;

    if (mediaRecorder.state !== "recording") {
      recordOutlineEl.style.boxShadow = "none";
      return; // Stop drawing loop.
    }

    recordOutlineEl.style.boxShadow = `0 0 0 ${
      volume * 20
    }px rgba(0, 0, 0, 0.2)`;

    x = Math.min(x + 1, width - 1);

    if (x <= 0) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, height / 2);
      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    }

    if (x >= width - 1) {
      canvasCtx.globalCompositeOperation = "copy";
      canvasCtx.drawImage(canvas, -1, 0);
      canvasCtx.globalCompositeOperation = "source-over";
    }

    canvasCtx.fillRect(x, ((1 - volume) * height) / 2, 1, volume * height);

    requestAnimationFrame(draw);
  }

  draw();
}
