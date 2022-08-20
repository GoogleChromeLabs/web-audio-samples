
class DummyWorkletProcessor {
  constructor(options) {
    return;
  }
}

class WorkletScriptProcessor extends DummyWorkletProcessor {
  constructor(options) {

    if (options) {

      console.log(options);

      this.sampleRate = options.sampleRate;ß

      // Buffer Stuff
      if (options.bufferSize) {
        this.bufferSize = options.bufferSize
      }

      if (options.useSharedBuffer) {
        this.liveBuffer = new Float32Array(new SharedArrayBuffer(this.bufferSize * 4));
      } else {
        this.liveBuffer = new Float32Array(this.bufferSize);
      }

      if (options.useRingBuffer) {
        this.useRingBuffer = true;
        this.ringBufferSegments = this.bufferSize / 128;
        this.currentRingSegment = 0;
      }

      if (this.buffers)

      // State stuff 
      if (options.initialState === true) {
        this.state = options.initialState
      }
      if (options.stateUpdateRate > 0) {
        this.stateUpdateRate = options.stateUpdateRate
      }

      // Inputs and Outputs
      if (options.buffers) {
        options.buffers.forEach({bufferName, frames, channels, shared}) {
          this.buffers[bufferName] = new Array(frames).fill(new Float32Array(frames));
        }
      }
    }

    this.port.onmessage = onNodeMessage;

    super(options);
  }

  onNodeMessage(event) {
    switch (event.kind) {
      case "GET_BUFFER":
          if (this.buffers[event.bufferName]) 
            this.port.postMessage({
              kind: "SHARE_BUFFER",
              buffer: this.buffers[event.bufferName]
            })
          else
            this.port.postMessage({
              kind: "ERROR_SHARE_BUFFER_DOESNT_EXIST"
            })
          break;
    }
  }
  process(inputs, outputs, params) {
    this.audioprocess({
      playbackTime: 0,
      inputBuffer: inputs[0],
      outputBuffer: outputs[0],
    });
  }

  audioprocess(event, state) {
    console.log("AudioProcess not yet defined.");
  }
}

function getCustomProcessorUrl(processFunction) {
  let processorString = WorkletScriptProcessor.toString();
  
  // We cannot instantiate AudioWorkletProcessor outside of WorkletNode creation
  processorString = processorString.replace("DummyWorkletProcessor", "AudioWorkletProcessor");

  console.log(processFunction.toString())

  let functionContents = processFunction.toString();

  // Strip outermost brackets and everything outside of it
  functionContents = functionContents.replace(/^[^{]+\{/g, '');
  functionContents = functionContents.replace(/\}$/g, '');
  
  const processorRegex = /audioprocess+\(event\) \{([^}]*)\}/g
  const processorContents = processorRegex.exec(processorString)[1].trim();

  // Replace the body
  processorString = processorString.replace(processorContents, functionContents);

  // prepare for instantiate
  processorString = processorString.concat("\nregisterProcessor('worklet-script-processor', WorkletScriptProcessor)");

  console.log(processorString);

  return window.URL.createObjectURL(new Blob([processorString], {
    type: "application/javascript; charset=utf-8"
  }));
}

export default getCustomProcessorUrl;