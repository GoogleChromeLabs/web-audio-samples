const Test = {};

const logMessage = (message, delayInSecond = 0) => {
  console.assert(Test.log);

  setTimeout(() => {
    Test.log.textContent +=
      '[' + performance.now().toFixed(2) + '] ' + message + '\r\n';
  }, delayInSecond * 1000);
};

const startAudio = () => {
  const audioElementA = new Audio();
  audioElementA.src = '../../sounds/fx/human-voice.mp3';
  audioElementA.loop = true;

  const audioElementB = new Audio();
  audioElementB.src = '../../sounds/fx/human-voice.mp3';
  audioElementB.loop = true;
  audioElementB.volume = 1.0;

  const contextA = new AudioContext({ sampleRate: 8000 });
  const elementSourceA = new MediaElementAudioSourceNode(contextA, {
    mediaElement: audioElementA,
  });
  const gainA = new GainNode(contextA, { gain: 0.0 });
  elementSourceA.connect(gainA).connect(contextA.destination);

  contextA.resume();
  audioElementA.play();
  audioElementB.play();

  Test.contextGain = gainA;
  Test.element = audioElementB;

  logMessage('Test started: context samplerate = ' + contextA.sampleRate);
  logMessage('Test started: context baseLatency = ' + contextA.baseLatency);
  logMessage(
    'Test started: context buffer size = ' +
      contextA.baseLatency * contextA.sampleRate
  );
  Test.startAudioButton.disabled = true;
  myToggle.disabled = false;
};

const onToggle = () => {
  if (myToggle.checked) {
    Test.contextGain.gain.value = 1.0;
    Test.element.volume = 0.0;
    logMessage('Playing AudioContext (reampled)');
  } else {
    Test.contextGain.gain.value = 0.0;
    Test.element.volume = 1.0;
    logMessage('Playing AudioElement (original)');
  }
};

const intialize = async () => {
  Test.log = document.getElementById('log');
  Test.inspector = document.getElementById('inspector');
  Test.startAudioButton = document.getElementById('btn-start-test');
  Test.startAudioButton.onclick = startAudio;
  Test.startAudioButton.disabled = false;

  const myToggle = document.getElementById('myToggle');
  myToggle.disabled = true;
  myToggle.addEventListener('change', onToggle);

  logMessage('Test initialized. Press "Start Audio" to begin.');
};

window.addEventListener('load', intialize);
