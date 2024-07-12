// const { expect } = require('chai');
// const { FreeQueueSAB } = require('../free-queue-sab');

describe('FreeQueueSAB', function() {
  it('should initialize with correct buffer length and channel count', function() {
    const size = 10;
    const channelCount = 2;
    const queue = new FreeQueueSAB(size, channelCount);

    expect(queue.bufferLength).to.equal(size + 1);
    expect(queue.channelCount).to.equal(channelCount);
    expect(queue.channelData.length).to.equal(channelCount);
  });

  it('should push data correctly when there is enough space', function() {
    const queue = new FreeQueueSAB(10, 1);
    const data = [new Float32Array(5).fill(1)];

    const result = queue.push(data, 5);
    expect(result).to.be.true;
    expect(queue.getAvailableSamples()).to.equal(5);
  });

  it('should fail to push data when the queue is full', function() {
    const queue = new FreeQueueSAB(10, 1);
    const data = [new Float32Array(11).fill(1)];

    const result = queue.push(data, 11);
    expect(result).to.be.false;
  });

  it('should pull data correctly when there is enough data', function() {
    const queue = new FreeQueueSAB(10, 1);
    const data = [new Float32Array(5).fill(1)];
    queue.push(data, 5);

    const output = [new Float32Array(5)];
    const result = queue.pull(output, 5);
    expect(result).to.be.true;
    expect(output[0]).to.deep.equal(data[0]);
  });

  it('should fail to pull data when the queue is empty', function() {
    const queue = new FreeQueueSAB(10, 1);
    const output = [new Float32Array(5)];

    const result = queue.pull(output, 5);
    expect(result).to.be.false;
  });

  it('should return correct number of available samples', function() {
    const queue = new FreeQueueSAB(10, 1);
    const data = [new Float32Array(5).fill(1)];
    queue.push(data, 5);

    expect(queue.getAvailableSamples()).to.equal(5);
  });

  it('should correctly identify if a frame of given size is available', function() {
    const queue = new FreeQueueSAB(10, 1);
    const data = [new Float32Array(5).fill(1)];
    queue.push(data, 5);

    expect(queue.isFrameAvailable(5)).to.be.true;
    expect(queue.isFrameAvailable(6)).to.be.false;
  });
});
