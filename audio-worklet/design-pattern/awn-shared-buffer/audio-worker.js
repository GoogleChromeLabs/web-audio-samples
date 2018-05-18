// Create 2 SAB
// - SAB1 Int32Array (info)
//    - [1] # frames available
//    - [2] who touched last? (agent id = )
//    - [3] last access timestamp
// - SAB2 2xFloat32Array (payload)

const AGENT_ID = 1;

const BYTES_PER_FIELD = 4;
const infoFieldCount = 4;

const BYTES_PER_SAMPLES = 4;
const bufferLength = 1024;
const channelCount = 1;

const infoSAB = new SharedArrayBuffer(infoFieldCount * BYTES_PER_FIELD);
const bufferSAB = new SharedArrayBuffer(bufferLength * channelCount *
                                        BYTES_PER_SAMPLES);
const infoArray = new Int32Array(infoSAB);
const bufferArray = [
  new Float32Array(bufferSAB)
];

let counter = 0;


function waitAndRender() {
  // As long as [0] === 0, wait here.
  if (Atomics.wait(infoArray, 0, 0, 10000) === 'ok') {
    bufferArray[0].fill(1);
    Atomics.store(infoArray, 1, AGENT_ID);
    Atomics.store(infoArray, 2, performance.now());
    Atomics.store(infoArray, 0, 0);

    console.log('waitAndRender', infoArray);
    waitAndRender();
  }
}


function initialzeWorker() {
  console.log('initializing worker...');
  postMessage({
    state: 'started',
    infoSAB: infoSAB,
    bufferSAB: bufferSAB
  });
  waitAndRender();
}

onmessage = (event) => {
  if (event.data.command === 'start') {
    initialzeWorker();
  }
};
