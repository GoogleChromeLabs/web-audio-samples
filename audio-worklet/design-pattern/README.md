# WebAudio + WebAssembly

A collection of examples demonstrate the integration of Web Audio API and
WebAssembly. Performing custom audio processing with Web Audio API can be done
in two ways:
[AudioWorklet](https://developers.google.com/web/updates/2017/12/audio-worklet)
and ScriptProcessorNode (deprecated). Both examples can be found here.

  - [Live example pages]()


## Development

To build the source (C/C++) in the examples,
[Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)
MUST be installed with its prerequisites. Each example has its own Makefile, so
simply run `make` in the directory to build a WASM module (`.wasm`) and a glue
code library (`.js`).


## References

 - https://github.com/tc39/ecmascript_sharedmem/blob/master/TUTORIAL.md
 - https://hacks.mozilla.org/2017/06/avoiding-race-conditions-in-sharedarraybuffers-with-atomics/
