import FreeQueue from "../../src/free-queue.js";
import exampleModule from "./build/example.js";

const toogleButton = document.getElementById("toogle");
toogleButton.disabled = false;

let audioContext;
let isPlaying = false;

/**
 * Function to create and initialize AudioContext.
 * @param {FreeQueue} queue FreeQueue instance to pass to AudioWorklet.
 * @returns {Promise<AudioContext>}
 */
const createAudioContext = async (queue) => {
  const audioContext = new AudioContext({
      sampleRate: 44100
  });
  await audioContext.audioWorklet.addModule("sink-processor.js");
  const oscillator = new OscillatorNode(audioContext);
  // Create AudioWorkletNode, while passing queue in parameter options
  const processorNode =
      new AudioWorkletNode(audioContext, 'sink-processor', {
          processorOptions: {
              queue,
          },
          outputChannelCount: [2],
      });
  oscillator.connect(processorNode).connect(audioContext.destination);
  audioContext.suspend();
  oscillator.start();
  console.log("AudioContext created.");
  return audioContext;
}

(async () => {
  // Load WebAssembly Module
  const Module = await exampleModule({
    locateFile: (path, prefix) => {
      if (path.endsWith(".data")) return "./build/" + path;
      return prefix + path;
    }
  });

  // Get FreeQueue address from WebAssembly Module.
  const queuePointer = Module._getFreeQueue();
  
  // Get addresses of data members of queue.
  let getFreeQueuePointerByMember = Module.cwrap(
      "GetFreeQueuePointerByMember", 
      "number", 
      ["number", "string"]
  );

  let bufferLengthPointer = 
      getFreeQueuePointerByMember(queuePointer, "buffer_length");
  let channelCountPointer = 
      getFreeQueuePointerByMember(queuePointer, "channel_count");
  let statePointer = 
      getFreeQueuePointerByMember(queuePointer, "state");
  let channelsPointer = 
      getFreeQueuePointerByMember(queuePointer, "channel_data");

  const pointers = {
    memory: Module.wasmMemory,
    bufferLengthPointer,
    channelCountPointer,
    statePointer,
    channelsPointer
  }

  // Create queue from pointers.
  const queue = FreeQueue.fromPointers(pointers);
  /**
   * Function to run, when toogle button is clicked.
   * It creates AudioContext, first time button is clicked.
   * It toogles audio state between playing and paused.
   */
  const toogleButtonClickHandler = async () => {
    if (!audioContext) {
      try {
        audioContext = await createAudioContext(queue);
      } catch (error) {
        console.error(error);
        return;
      }
    }

    if (!isPlaying) {
      audioContext.resume();
      isPlaying = true;
      toogleButton.style.backgroundColor = 'red';
      toogleButton.innerHTML = 'STOP';
    } else {
      audioContext.suspend();
      isPlaying = false;
      toogleButton.style.backgroundColor = 'green';
      toogleButton.innerHTML = 'START';
    }
  }

  toogleButton.onclick = toogleButtonClickHandler;

})();
