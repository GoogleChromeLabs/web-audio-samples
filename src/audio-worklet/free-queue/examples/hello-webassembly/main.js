import FreeQueue from "../../src/free-queue.js";
import ExampleModule from "./build/example.js";

const toogleButton = document.getElementById("toogle");
toogleButton.disabled = false;

let audioContext;
let playing = false;

/**
 * Function to create and initialize AudioContext.
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
  const Module = await ExampleModule({
    locateFile: (path, prefix) => {
      if (path.endsWith(".data")) return "./build/" + path;
      return prefix + path;
    }
  });

  // Get FreeQueue address from WebAssembly Module.
  const queuePointer = Module._getFreeQueue();
  
  // Get addresses of data members of queue.
  let GetFreeQueuePointerByMember = Module.cwrap("GetFreeQueuePointerByMember", "number", ["number", "string"]);

  let bufferLengthPointer = GetFreeQueuePointerByMember(queuePointer, "buffer_length");
  let channelCountPointer = GetFreeQueuePointerByMember(queuePointer, "channel_count");
  let statePointer = GetFreeQueuePointerByMember(queuePointer, "state");
  let channelsPointer = GetFreeQueuePointerByMember(queuePointer, "channel_data");

  const pointers = {
    memory: Module.wasmMemory,
    bufferLengthPointer,
    channelCountPointer,
    statePointer,
    channelsPointer
  }

  // Create queue from pointers.
  const queue = FreeQueue.fromPointers(pointers)
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

    if (!playing) {
      audioContext.resume();
      playing = true;
    } else {
      audioContext.suspend();
      playing = false;
    }
  }

  toogleButton.onclick = toogleButtonClickHandler;

})();
