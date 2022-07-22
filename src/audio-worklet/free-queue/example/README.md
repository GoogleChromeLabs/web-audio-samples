# Free Queue C

Example of Using FreeQueue with WebAssembly App written in C.



## Building

Install and Activate Emscripten SDK and use

`build.sh` for Linux 

or

`build.cmd` for Windows

or

Makefile

or

```ps
emcc src/main.c -sENVIRONMENT=worker -sMODULARIZE=1 -sEXPORT_NAME=FQC -sEXPORT_ES6=1 -sINVOKE_RUN=0 -pthread -sEXPORTED_RUNTIME_METHODS="['callMain','ccall', 'cwrap']" -o build/main.js
```

to build.

## Working

1. Create a FreeQueue in C and write a processing function that push audio data into freequeue.
2. Initialize WebAssembly module in a worker and import freequeue pointers and instantiate a FreeQueuw instance from those pointers.
3. Setup worker thread to wait for signal and call process function from WebAssembly Module when thread is awoken.
4. Initialize AudioWorkletNode to pull data from freequeue and when few frames are available, awake worker thread so it can process data and push more frames.

## Issues

This demo requires secure context and cross origin isolation.

So while testing use localhost and following headers for cross-origin-isolation while serving:
```
Cross-Origin-Embedder-Policy:  require-corp
Cross-Origin-Opener-Policy: same-origin
```