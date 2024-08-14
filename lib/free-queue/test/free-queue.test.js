import { expect } from 'https://cdnjs.cloudflare.com/ajax/libs/chai/5.1.1/chai.js';
import { FreeQueue, MAX_CHANNEL_COUNT, RENDER_QUANTUM_FRAMES } from '../free-queue.js';

// Mock WASM module
const mockWasmModule = {
  // Simulate memory allocation
  _malloc: (size) => new ArrayBuffer(size),
  // Simulate memory deallocation
  _free: () => { },
  // Simulate HEAPF32
  HEAPF32: new Float32Array(1024),
};

describe('FreeQueue Class', () => {
  const bufferLength = 1024;
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
    it('should not adapt to a channel count exceeding maxChannelCount', () => {
      const maxChannelCount = 8;
      const initialChannelCount = freeQueue.numberOfChannels;

      try {
        freeQueue.adaptChannel(maxChannelCount + 1);
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.include('exceeds the maximum channel count');
      }

      expect(freeQueue.numberOfChannels).to.equal(initialChannelCount);
    });
  });

  describe('Push Data', () => {
    it('should correctly push data', () => {
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
  
    it('should handle multiple push cycles', () => {
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

  describe('Pull Data', () => {
    it('should correctly pull data', () => {
      const testData = [new Float32Array(bufferLength).fill(1), new Float32Array(bufferLength).fill(2)];
      freeQueue.push(testData);
  
      const outputData = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
      freeQueue.pull(outputData);
  
      expect(outputData[0]).to.deep.equal(testData[0]);
      expect(outputData[1]).to.deep.equal(testData[1]);
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
  
    it('should handle multiple pull cycles', () => {
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

  describe('Performance Tests', function () {
    it('should handle large data efficiently', function () {
      const input = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
      const output = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
      for (let i = 0; i < 10000; i++) {
        freeQueue.push(input, bufferLength);
        freeQueue.pull(output, bufferLength);
      }
    });

    it('should handle small data efficiently', function () {
      const input = [new Float32Array(1), new Float32Array(1)];
      const output = [new Float32Array(1), new Float32Array(1)];
      for (let i = 0; i < 1000000; i++) {
        freeQueue.push(input, 1);
        freeQueue.pull(output, 1);
      }
    });
  });
});
