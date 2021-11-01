# How to compile C++ synth code to WebAssmebly

1. [Download and install Emscripten](https://emscripten.org/docs/getting_started/downloads.html)). Also it's
  better to check
  [the required tools](https://emscripten.org/docs/building_from_source/toolchain_what_is_needed.html#test-which-tools-are-installed)
  before going further.
1. After the successful installation, run `source ./emdsk_env.sh` to add relevant paths. See
  [this section](https://emscripten.org/docs/getting_started/downloads.html#updating-the-sdk) for the details. After
  this point, you should be able to run `emcc` in the shell.
1. In this directory, type `make` to start the compilation. You should see `synth.wasm.js` as a result.
