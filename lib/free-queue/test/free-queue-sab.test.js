import { expect } from 'https://cdnjs.cloudflare.com/ajax/libs/chai/5.1.1/chai.js';

import { FreeQueueSAB } from '../free-queue-sab.js';


describe('FreeQueueSAB', function() {
    const bufferLength = 1024;
    const channelCount = 2;
    let queue;

    beforeEach(() => {
        queue = new FreeQueueSAB(bufferLength, channelCount);
    });

    describe('Constructor', function() {
        it('should initialize states correctly', function() {
            expect(queue.states).to.be.an.instanceof(Uint32Array);
            expect(queue.states.length).to.equal(2);
        });

        it('should initialize buffer length correctly', function() {
            expect(queue.getBufferLength()).to.equal(bufferLength);
        });

        it('should initialize channel data correctly', function() {
            expect(queue.channelData).to.be.an('array');
            expect(queue.channelData.length).to.equal(channelCount);
            queue.channelData.forEach(channel => {
                expect(channel).to.be.an.instanceof(Float32Array);
                expect(channel.length).to.equal(bufferLength + 1);
            });
        });
    });

    describe('push', function() {
        it('should push data into the queue', function() {
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            const result = queue.push(input, 3);
            expect(result).to.be.true;
            expect(queue.getAvailableSamples()).to.equal(3);
        });

        it('should fail to push data when buffer is full', function() {
            const input = [new Float32Array(queue.getBufferLength()), new Float32Array(queue.getBufferLength())];
            
            let result = queue.push(input, queue.getBufferLength());
            console.log("Push result when buffer is full:", result);
            expect(result).to.be.true;
    
            result = queue.push(input, queue.getBufferLength());
            console.log("Push result when attempting to overfill buffer:", result);
            expect(result).to.be.false;
        });
    });

    describe('pull', function() {
        it('should pull data from the queue', function() {
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            queue.push(input, 3);
            const output = [new Float32Array(3), new Float32Array(3)];
            const result = queue.pull(output, 3);
            expect(result).to.be.true;
            expect(output[0]).to.deep.equal(input[0]);
            expect(output[1]).to.deep.equal(input[1]);
        });

        it('should fail to pull data when buffer is empty', function() {
            const output = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            const result = queue.pull(output, bufferLength);
            expect(result).to.be.false;
        });
    });

    describe('Utility Methods', function() {
        it('should correctly get available samples', function() {
            expect(queue.getAvailableSamples()).to.equal(0);
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            queue.push(input, 3);
            expect(queue.getAvailableSamples()).to.equal(3);
        });

        it('should correctly check if frame is available', function() {
            expect(queue.isFrameAvailable(3)).to.be.false;
            const input = [new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])];
            queue.push(input, 3);
            expect(queue.isFrameAvailable(3)).to.be.true;
        });
    });

    describe('Performance Tests', function() {
        it('should handle large data efficiently', function() {
            this.timeout(10000);
            const largeInput = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            console.time('push large data');
            queue.push(largeInput, bufferLength);
            console.timeEnd('push large data');

            const largeOutput = [new Float32Array(bufferLength), new Float32Array(bufferLength)];
            console.time('pull large data');
            queue.pull(largeOutput, bufferLength);
            console.timeEnd('pull large data');
        });

        it('should handle maximum capacity', function() {
            this.timeout(10000);
            const input = Array.from({ length: channelCount }, () => new Float32Array(bufferLength));
            for (let i = 0; i < bufferLength; i++) {
                queue.push(input, 1);
            }
            expect(queue.push(input, 1)).to.be.false; // Should be full now
        });
    });
});