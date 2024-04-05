'use strict';

const Test = {
  initialized: false
};

const logMessage = (message, delayInSecond = 0) => {
  console.assert(Test.log);

  setTimeout(() => {
    Test.log.textContent +=
        '[' + performance.now().toFixed(2) + '] ' + message + '\r\n';
  }, delayInSecond * 1000);
};

const startAudio = async () => {
  console.assert(Test.initialized);

  testBody();

  Test.startAudioButton.disabled = true;
  logMessage('Test started.');
};

const testBody = async () => {
  const samplerate = 16000;
  const allSempl = 44100;
  const tele_checked = {
    checked: true,
  };
  

  // Creating an audio stream
  let audioCtx = new AudioContext({
    latencyHint: 'interactive',
    sampleRate: samplerate,
  });
  audioCtx.suspend();

  let myArrayBuffer = audioCtx.createBuffer(1 , allSempl * 3, samplerate);
  let nowBuffering = myArrayBuffer.getChannelData(0);

  // Filling nowBuffering in the view using Web Bluetooth:
  // nowBuffering[i] =
  // Create a playback object

  let source = audioCtx.createBufferSource();
  source.loop = true;
  source.buffer = myArrayBuffer;

  // let mediaStreamDestination = null;
  // if(tele_checked.checked) {
  //   mediaStreamDestination = audioCtx.createMediaStreamDestination();
  // }

  // *** INCOMPLETE CODE ***
  // let ratio_coeff = base_30/filter_save[0].gain_value;
  // for(var i=0; i < filter_save.length; i++) {
  //   filter[i] = audioCtx.createBiquadFilter();
  //   filter[i].type = "highshelf";
  //   filter[i].frequency.value = filter_save[i].frequency_value;
  //   filter[i].gain.value =
  //       (i==0)?base_30:filter_save[i].gain_value*ratio_coeff;

  //   if(i>0) {
  //     document.getElementById('fr-text-'+i).innerHTML =
  //         filter_save[i].frequency_value;
  //     document.getElementById('gain-text-'+i).innerHTML = 
  //         filter_save[i].gain_value;
  //   }
  // }

  let myAnalyser = audioCtx.createAnalyser();
  // myAnalyser.smoothingTimeConstant = smoothingTime;
  // myAnalyser.fftSize = fft_Size;

  let gainNode = audioCtx.createGain();
  // gainNode.gain.value = level_num.value/100. * ratio_level; // 0..1
  gainNode.gain.value = 0.25; // 0..1

  source.connect(gainNode);

  // *** INCOMPLETE CODE ***
  // let time_sempl = 0.2;
  // Adding a WorkProcessor
  // audioCtx.audioWorklet.addModule("worker_processor.js").then(() => {
  // worker_processor = new AudioWorkletNode(audioCtx, "worker_processor");
  // worker_processor.port.onmessage = (event) => {
  //   let worker_data = event.data;
  //   for(let i = 0; i < worker_data.length; i++) {
  //       time_sempl = time_sempl + 1./samplerate;
  //       ys.push({simpl_time:time_sempl, simpl_value:wavevolume - Math.floor(worker_data[i]*wavevolume) });
  //   }
  // };
  // gainNode.connect(worker_processor); // Data pack for graph and spectrogram

  // *** INCOMPLETE CODE ***
  // source.connect(filter[0]);
  // for(i=0; i<filter_save.length-1; i++) {
  //   filter[i].connect(filter[i+1]);
  // }
  // filter[filter_save.length-1].connect(gainNode);

  let osc = new OscillatorNode(audioCtx);
  osc.connect(gainNode);
  gainNode.connect(myAnalyser);
  gainNode.connect(audioCtx.destination);

  osc.start();
  audioCtx.resume();

  // *** INCOMPLETE CODE ***
  // setTimeout(function(){
  //   visualize_spectr(myAnalyser);
  // }, 300);
};

const initializeTest = async () => {
  Test.log = document.getElementById('log');
  Test.inspector = document.getElementById('inspector');
  Test.startAudioButton = document.getElementById('btn-start-test');

  Test.startAudioButton.onclick = startAudio;
  Test.startAudioButton.disabled = false;

  logMessage('Test initialized. Press "Start Audio" to begin.');
  Test.initialized = true;
};

// Entry point
window.addEventListener('load', initializeTest);
