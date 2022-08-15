# Free Queue 

A lock-free ring buffer implementation for high-performance audio processing 
designed to be used on top of the Web Audio API.

It is based on the single-producer and single-consumer concept, so it can ensure 
thread safe concurrency without locks and mutexes, when the following conditions 
are satisfied -
1. There is only one producer, that is only one thread/worker is pushing data 
into the buffer.
2. There is only one consumer, that is only one thread/worker is pulling data 
out of the buffer.

## API

```ts
  // Constructor
  FreeQueue(size: number, channelCount: number = 1)
  // push data into FreeQueue. 
  // returns true if pushing data is successful otherwise returns false
  push(input: Float32Array[], blockLength: number): boolean
  // pull data out of FreeQueue 
  // returns true if pulling data is successful otherwise returns false
  pull(input: Float32Array[], blockLength: number): boolean
  // returns length of backing buffer
  getBufferLength(): number
  // returns if frame of given size is available
  isFrameAvailable(size: number): boolean
```

## How it works

This library can be used between two JavaScript Workers or can be used
with WebAssembly. To use WebAssembly with programming languages like C/C++, 
an interface can be used to push and pull data from the buffer.
See interface/README.md.
