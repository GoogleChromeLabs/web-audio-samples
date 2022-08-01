# FreeQueue

A lock-free ring buffer implementation for high-performance audio processing 
designed to be used on top of Web Audio API.

It is based upon single-producer and single-consumer concept, so it can assure 
thread safe concurrency without locks and mutexes, when following conditions 
are satisfied -
1. There is only one producer, that is only one thread/worker is pushing data 
into buffer.
2. There is only one consumer, that is only one thread/worker is pulling data 
out of buffer.

## API

```ts
    // Constructor
    FreeQueue(size: number, channelCount: number = 1)
    // push data into FreeQueue
    push(input: Float32Array[], blockLength: number): boolean
    // pull data out of FreeQueue 
    pull(input: Float32Array[], blockLength: number): boolean
    // returns length of backing buffer
    getBufferLength(): number
    // returns if frame of given size is available
    isFrameAvailable(size: number): number
```

## Usage

This library can be used between two JavaScript Workers or can even be used
with WebAssembly. To use in WebAssembly with programming languages like C/C++, 
an interface can be used which can push and pull data from buffer.

