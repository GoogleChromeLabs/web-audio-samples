import { expect } from 'https://cdnjs.cloudflare.com/ajax/libs/chai/5.1.1/chai.js';
import { FreeQueue, MAX_CHANNEL_COUNT, RENDER_QUANTUM_FRAMES } from '../free-queue.js';

// Mock WASM module
const mockWasmModule = {
  // Simulate memory allocation
  _malloc: (size) => new ArrayBuffer(size), 
  // Simulate memory deallocation
  _free: () => {}, 
  // Simulate HEAPF32
  HEAPF32: new Float32Array(1024), 
};

describe('FreeQueue Class', () => {
  const bufferLength = 512;
  const channelCount = 2;
  const maxChannelCount = 4;
  let freeQueue = null;

  beforeEach(() => {
    freeQueue = new FreeQueue(mockWasmModule, bufferLength, channelCount, maxChannelCount);
  });

  afterEach(() => {
    freeQueue.free();
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(freeQueue.length).to.equal(bufferLength);
      expect(freeQueue.numberOfChannels).to.equal(channelCount);
      expect(freeQueue.maxChannelCount).to.equal(maxChannelCount);
    });

    it('should allocate the correct amount of memory', () => {
      const dataByteSize = channelCount * bufferLength * Float32Array.BYTES_PER_ELEMENT;
      expect(freeQueue.getPointer()).to.be.instanceof(ArrayBuffer);
      expect(freeQueue.getPointer().byteLength).to.equal(dataByteSize);
    });
  });

  describe('Channel Adaptation', () => {
    it('should adapt to a new channel count within limits', () => {
      freeQueue.adaptChannel(3);
      expect(freeQueue.numberOfChannels).to.equal(3);
    });
  });

  describe('Pushing and Pulling Data', () => {
    it('should correctly push and pull data', () => {
      const testData = [new Float32Array(bufferLength).fill(1), new Float32Array(bufferLength).fill(2)];
      freeQueue.push(testData);

      const outputData = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
      freeQueue.pull(outputData);

      expect(outputData[0]).to.deep.equal(testData[0]);
      expect(outputData[1]).to.deep.equal(testData[1]);
    });

    it('should handle buffer overflow correctly', () => {
      const testData = [new Float32Array(bufferLength * 2).fill(1), new Float32Array(bufferLength * 2).fill(2)];
      freeQueue.push(testData);

      expect(freeQueue.framesAvailable).to.equal(bufferLength);
    });

    it('should not pull data when buffer is empty', () => {
      const outputData = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
      freeQueue.pull(outputData);

      expect(outputData[0]).to.deep.equal(new Float32Array(bufferLength));
      expect(outputData[1]).to.deep.equal(new Float32Array(bufferLength));
    });

    it('should manage partial data pulls', () => {
      const testData = [new Float32Array(bufferLength).fill(1), new Float32Array(bufferLength).fill(2)];
      freeQueue.push(testData);

      const partialOutput = [new Float32Array(bufferLength / 2), new Float32Array(bufferLength / 2)];
      freeQueue.pull(partialOutput);

      expect(partialOutput[0]).to.deep.equal(new Float32Array(bufferLength / 2).fill(1));
      expect(partialOutput[1]).to.deep.equal(new Float32Array(bufferLength / 2).fill(2));
      expect(freeQueue.framesAvailable).to.equal(bufferLength / 2);
    });

    it('should handle multiple push and pull cycles', () => {
      const testData = [new Float32Array(bufferLength).fill(1), new Float32Array(bufferLength).fill(2)];
      
      for (let i = 0; i < 5; i++) {
        freeQueue.push(testData);

        const outputData = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
        freeQueue.pull(outputData);

        expect(outputData[0]).to.deep.equal(testData[0]);
        expect(outputData[1]).to.deep.equal(testData[1]);
        expect(freeQueue.framesAvailable).to.equal(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return null for invalid channel index in getChannelData', () => {
      const invalidIndex = channelCount + 1;
      expect(freeQueue.getChannelData(invalidIndex)).to.be.null;
    });

    it('should throw an error if pushing with mismatched channel count', () => {
      const invalidTestData = [new Float32Array(bufferLength).fill(1)];
      
      const expectedChannelCount = freeQueue._channelCount; 
      const actualChannelCount = invalidTestData.length;
    
      expect(() => freeQueue.push(invalidTestData))
        .to.throw(Error, `Channel count mismatch: expected ${expectedChannelCount}, but got ${actualChannelCount}.`);
    });

    it('should throw an error if pulling with mismatched channel count', () => {
      const invalidOutputData = [new Float32Array(bufferLength)]; 
      
      const expectedChannelCount = freeQueue._channelCount; 
      const actualChannelCount = invalidOutputData.length;
    
      expect(() => freeQueue.pull(invalidOutputData))
        .to.throw(Error, `Channel count mismatch: expected ${expectedChannelCount}, but got ${actualChannelCount}.`);
    });
  });

  describe('Performance', () => {
    it('should efficiently handle large data transfers', function() {
      // this.timeout(5000);
      // 1 MB buffer
      const largeBuffer = 1024 * 1024; 
      const testData = [new Float32Array(largeBuffer).fill(1), new Float32Array(largeBuffer).fill(2)];

      const start = performance.now();
      freeQueue.push(testData);
      freeQueue.pull(testData);
      const end = performance.now();

      // Ensure operations complete within 1 second
      expect(end - start).to.be.below(1000); 
    });

    it('should perform consistently over many operations', function() {
      this.timeout(10000);
      const iterations = 10000;
      const testData = [new Float32Array(RENDER_QUANTUM_FRAMES).fill(1), new Float32Array(RENDER_QUANTUM_FRAMES).fill(2)];

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        freeQueue.push(testData);
        freeQueue.pull(testData);
      }
      const end = performance.now();
      // Ensure it completes within 1 seconds
      expect(end - start).to.be.below(1000); 
    });
  });
});
