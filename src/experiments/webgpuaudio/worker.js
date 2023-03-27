async function main() {
  const size = 128; // WebAudio sample size

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  // Get a GPU buffer in a mapped state and an arrayBuffer for writing.
  const gpuBuffer = device.createBuffer({
    mappedAtCreation: true,
    size: size * Float64Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.MAP_WRITE
  });
  const arrayBuffer = gpuBuffer.getMappedRange();

  // Write bytes to buffer.
  new Float64Array(arrayBuffer);
  for (let i = 0; i < size; i++){
    arrayBuffer[i] = Math.random();
  }

  gpuBuffer.unmap();
}

main();