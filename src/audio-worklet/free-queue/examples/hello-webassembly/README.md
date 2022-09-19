# Using FreeQueue with WebAssembly

This example demonstrates how to use FreeQueue with WebAssembly.
It includes an external C/C++ MP3 decoder
([dr_mp3.h](https://github.com/mackron/dr_libs/blob/master/dr_mp3.h)) 
library to load and play music with FreeQueue on top of AudioWorklet.

## Building

Run `build.sh` for Linux and `build.cmd` for windows to build.
Refer to build scripts for building instructions.

### Emscripten Flags

```
    // To tell emscriptenm to build for worker environment
    
    // To build and load as an ES6 module
    -s ENVIRONMENT=worker
    -s MODULARIZE=1 
    -s EXPORT_NAME=ExampleModule 
    -s EXPORT_ES6=1 
    
    // To run main automatically after loading module.
    -s INVOKE_RUN=1 
    
    // To enable pthread support
    -pthread 

    -s EXPORTED_RUNTIME_METHODS="['callMain','ccall', 'cwrap']" 
    -o build/example.js 
    
    // Preload mp3 file
    --preload-file moonlight.mp3
```
