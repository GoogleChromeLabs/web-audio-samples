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

  Test.startAudioButton.disabled = true;
  logMessage('Test started.');

  const audioContext = new AudioContext();
  const source = new ConstantSourceNode(audioContext, {offset: 0.5});
  // Intentionally using a low gain value so we ensure there's no clipping.
  const gain = new GainNode(audioContext, {gain: 0.25});
  const panner = new PannerNode(audioContext, {panningModel: 'HRTF'});

  source.connect(gain).connect(panner).connect(audioContext.destination);
  source.start();

  // Each sub test runs for 3 seconds.
  const testDuration = 3.0;

  // This is to avoid a sudden position change while panning. Values that are
  // lower than this will cause a sudden change for all axis.
  const nonZero = 0.1;

  // For the details on spatialization, see:
  // https://webaudio.github.io/web-audio-api/#Spatialization

  // X-axis: from left (-1) to right (1)
  let now = audioContext.currentTime;
  let later = now + testDuration;
  panner.positionX.setValueAtTime(-1.0, now);
  panner.positionY.setValueAtTime(nonZero, now);
  panner.positionZ.setValueAtTime(nonZero, now);
  panner.positionX.linearRampToValueAtTime(1.0, later);
  logMessage('Test X-axis: From left to right over 3 seconds.');

  // Y-axis: from bottom (-1) to top (1)
  now += testDuration;
  later = now + 3.0;
  panner.positionX.setValueAtTime(nonZero, now);
  panner.positionY.setValueAtTime(-1.0, now);
  panner.positionZ.setValueAtTime(nonZero, now);
  panner.positionY.linearRampToValueAtTime(1.0, later);
  logMessage('Test Y-axis: From top to bottom over 3 seconds.', testDuration);

  // Z-axis: from front (-1) to back (1)
  now += testDuration;
  later = now + 3.0;
  panner.positionX.setValueAtTime(nonZero, now);
  panner.positionY.setValueAtTime(nonZero, now);
  panner.positionZ.setValueAtTime(-1.0, now);
  panner.positionZ.linearRampToValueAtTime(1.0, later);
  logMessage('Test Z-axis: From front to back over 3 seconds.',
             2 * testDuration);

  source.stop(later);
  logMessage('Test finished.', 3 * testDuration);
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
