DEPS = AudioWorkletProcessorKernel.cc

build: $(DEPS)
	@emcc --bind -O1 -s WASM=1 \
		-s BINARYEN_ASYNC_COMPILATION=0 -s SINGLE_FILE=1 \
		AudioWorkletProcessorKernel.cc \
		-o audio-worklet-module.js \
		--post-js ../lib/wa2.js \
		--post-js audio-worklet-processor.js

clean:
	@rm -f audio-worklet-module.js audio-worklet-module.wasm
