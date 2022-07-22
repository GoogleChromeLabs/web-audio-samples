# Free Queue 

A Lock-Free Ring Buffer Implementation, focused on utility for applications related to Audio Processing with WebAudio API.

## Working

It is a Lock-Free implementation based on Single Producer - Single Consumer Concept.

This Library Provieds API for creating a FreeQueue instance, to which data can be pushed to or pulled from by different worker threads.

An example implementation of C Library interface is also provided with and example working, to use it with Emscripten and WebAssembly.