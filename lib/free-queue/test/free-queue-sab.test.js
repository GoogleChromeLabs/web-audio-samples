import { expect } from 'https://cdnjs.cloudflare.com/ajax/libs/chai/5.1.1/chai.js';

import { FreeQueueSAB } from '../free-queue-sab.js';


describe('FreeQueueSAB', function () {
    const bufferLength = 1024;
    const channelCount = 2;
    let queue;

    beforeEach(() => {
        queue = new FreeQueueSAB(bufferLength, channelCount);
    });

    describe('Constructor', function () {
        it('should initialize states correctly', function () {
            expect(queue.states).to.be.an.instanceof(Uint32Array);
            expect(queue.states.length).to.equal(2);
        });

        it('should initialize buffer length correctly', function () {
            expect(queue.getBufferLength()).to.equal(bufferLength);
        });
    });

    describe('Channel Adaption', () => {
        it('should initialize channel data correctly', function () {
            expect(queue.channelData).to.be.an('array');
            expect(queue.channelData.length).to.equal(channelCount);
            queue.channelData.forEach(channel => {
                expect(channel).to.be.an.instanceof(Float32Array);
                expect(channel.length).to.equal(bufferLength + 1);
            });
        });

        it('should not adapt to an invalid channel count (e.g., negative or zero)', function () {
            const invalidChannelCounts = [-1, 0]; 
            invalidChannelCounts.forEach(invalidCount => {
                expect(() => queue.setChannelCount(invalidCount)).to.throw(Error);
                expect(queue.channelData.length).to.equal(channelCount); 
            });
        });
    })

    describe('push', function () {
        it('should push data into the queue', function () {
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            const result = queue.push(input, 3);
            expect(result).to.be.true;
            expect(queue.getAvailableSamples()).to.equal(3);
        });

        it('should fail to push data when buffer is full', function () {
            const input = [new Float32Array(queue.getBufferLength()), new Float32Array(queue.getBufferLength())];

            let result = queue.push(input, queue.getBufferLength());
            expect(result, 'Push result when buffer is full').to.be.true;

            result = queue.push(input, queue.getBufferLength());
            expect(result, 'Push result when attempting to overfill buffer').to.be.false;
        });

        it('should handle maximum capacity', function () {
            const input = Array.from({ length: channelCount }, () => new Float32Array(bufferLength));
            for (let i = 0; i < bufferLength; i++) {
                queue.push(input, 1);
            }
            expect(queue.push(input, 1)).to.be.false; // Should be full now
        });
    });

    describe('pull', function () {
        it('should pull data from the queue', function () {
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            queue.push(input, 3);
            const output = [new Float32Array(3), new Float32Array(3)];
            const result = queue.pull(output, 3);
            expect(result).to.be.true;
            expect(output[0]).to.deep.equal(input[0]);
            expect(output[1]).to.deep.equal(input[1]);
        });

        it('should fail to pull data when buffer is empty', function () {
            const output = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            const result = queue.pull(output, bufferLength);
            expect(result).to.be.false;
        });
    });

    describe('Utility Methods', function () {
        it('should correctly get available samples', function () {
            expect(queue.getAvailableSamples()).to.equal(0);
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            queue.push(input, 3);
            expect(queue.getAvailableSamples()).to.equal(3);
        });

        it('should correctly check if frame is available', function () {
            expect(queue.isFrameAvailable(3)).to.be.false;
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            queue.push(input, 3);
            expect(queue.isFrameAvailable(3)).to.be.true;
        });
    });

    describe('Error Handling', () => {
        it('should throw an error when push input length does not match channel count', function () {
            const bufferLength = 256;
            const channelCount = 2;
            const queue = new FreeQueueSAB(bufferLength, channelCount);
        
            const invalidInput = [new Float32Array(bufferLength)]; 
        
            expect(() => queue.push(invalidInput, bufferLength)).to.throw(Error);
        });
        
        it('should return false when pushing with insufficient available write space', function () {
            const bufferLength = 4; 
            const channelCount = 2;
            const queue = new FreeQueueSAB(bufferLength, channelCount);
        
            const input = [new Float32Array([1, 2, 3, 4]), new Float32Array([1, 2, 3, 4])];
            queue.push(input, 4); 
        
            const insufficientInput = [new Float32Array([5, 6, 7, 8]), new Float32Array([5, 6, 7, 8])];
            const result = queue.push(insufficientInput, 4);
        
            expect(result).to.be.false;
        });

        it('should return false when pulling with insufficient available read space', function () {
            const bufferLength = 4; 
            const channelCount = 2;
            const queue = new FreeQueueSAB(bufferLength, channelCount);
        
            const output = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            const result = queue.pull(output, 4); 
        
            expect(result).to.be.false;
        });        
    })

    describe('Performance Tests', function () {
        it('should handle large data efficiently', function () {
            const input = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            const output = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            for (let i = 0; i < 100000; i++) {
                queue.push(input, bufferLength);
                queue.pull(output, bufferLength);
            }
        });

        it('should handle small data efficiently', function () {
            const input = [new Float32Array(1), new Float32Array(1)];
            const output = [new Float32Array(1), new Float32Array(1)];
            for (let i = 0; i < 1000000; i++) {
                queue.push(input, 1);
                queue.pull(output, 1);
            }
        });
    });
});