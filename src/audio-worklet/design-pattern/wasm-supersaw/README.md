# How to use wasm-supersaw example

Unlike other AudioWorklet examples in this repository, this examples needs
an additional step to build and compile. Follow the steps below:

1. Install Emscripten in your development setup. Follow the instruction:
  https://emscripten.org/docs/getting_started/downloads.html

2. Run `emcc -v` to confirm the Emscripten installation and its version. This
  example needs 3.1.48 or later to work correctly. (See
  [this issue](https://github.com/GoogleChromeLabs/web-audio-samples/issues/348)
  for details)

3. In the terminal, run `make` to build the WASM file.

4. Serve `index.html` file in the directoy.
