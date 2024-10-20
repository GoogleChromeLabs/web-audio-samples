/**
 * RecorderProcessor records samples on the fly and streams them to the main thread.
 */
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < input.length; channel++) {
      output[channel].set(input[channel]);
      this.port.postMessage({ channel, data: input[channel] });
    }

    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor); 