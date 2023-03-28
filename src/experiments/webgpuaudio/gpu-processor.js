class GPUProcessor {
  constructor() {
  }

  process(input) {
    return input.map(sample => 0.1 * sample);
  }
}

export default GPUProcessor;
