import getCustomProcessorUrl from "./worklet-script-processor.js";

class WorkletScriptNode extends AudioWorkletNode {
  /**
   * @constructor
   * @param {BaseAudioContext} context The associated BaseAudioContext.
   * @param 
   */
  constructor(context, options) {
    super(context, "worklet-script-processor", {
      processorOptions: options
    });

    this.port.onmessage = onProcessorMessage.bind(this);
  }

  // Events
  onProcessorMessage(event) {
    this.previousMessageKind = this.currentMessage.kind;
    this.currentMessage = event;
  }

  postMessage(event) {
    this.port.postMessage(event)
  }
  
  waitForMessage(eventKind) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.currentMessage.kind === event.kind)
          resolve(this.currentMessage);
        else
          console.log(`[WorkletScriptNode] Expected ${eventKind} but got ${this.currentMessage.kind}`);
          reject();
      }, 1000)
    })
  }

  // Get buffer

  getBuffer(bufferName) {
    this.postMessage({
      kind: "GET_BUFFER",
      bufferName
    })

    await return this.waitForMessage("SHARE_BUFFER")
      .then(event => return this.buffer.)
  }
}

class WorkletScriptNodeBuilder {

  constructor(context, bufferSize = 128, numInputs = 1, numOutputs = 1) {
    this.context = context;
    this.bufferSize = bufferSize;
    this.numInputs = numInputs;
    this.numOutputs = numOutputs;

    this.processorFunction = () => {};
    this.initialState = {};
    this.updateRate = 0;

    this.useSharedBuffer = true;
    this.useRingBuffer = false;

    this.bufferSize = bufferSize;
    if (bufferSize > 128) {
       this.useRingBuffer = true;
    }

    return this;
  }

  // Buffers
  setProcessor(processFunction) {
    this.processorFunction = this.processorFunction

    return this;
  }

  setState(initialState, updateRate) {
    this.initialState = initialState;
    this.updateRate = updateRate;

    return this;
  }

  useSharedBuffer() {
    this.useSharedBuffer = true;
    return this;
  }

  useRingBuffer() {
    this.useRingBuffer = true;
    return this;
  }

  addBuffer(bufferOptions) {
    this.buffers.push(bufferOptions);
    return this;
  }

  async build() {
    const processorName = "worklet-script-processor";

    // Prepare processor string
    const processorURL = getCustomProcessorUrl(this.processFunction);
    await context.audioWorklet.addModule(processorURL);

    return new WorkletScriptNode(this.context, {
      sampleRate: context.sampleRate,
      numInput: this.numInput, 
      numOutput: this.numOutput,

      bufferSize: this.bufferSize, 
      useRingBuffer: this.useRingBuffer,
      useSharedBuffer: this.useSharedBuffer,

      initialState: this.initialState,
      stateUpdateRate: this.stateUpdateRate,
    });
  }
}

export default WorkletScriptNodeBuilder