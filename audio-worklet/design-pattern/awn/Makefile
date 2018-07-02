DEPS = AudioWorkletProcessorKernel.cc

build: $(DEPS)
	@emcc --bind -O1 \
	  -s WASM=1 \
		-s BINARYEN_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		AudioWorkletProcessorKernel.cc \
		-o audio-worklet.wasmmodule.js \
		--post-js ../lib/em-es6-module.js

clean:
	@rm -f audio-worklet.wasmmodule.js