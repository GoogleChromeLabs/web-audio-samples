DEPS = RingBufferWorkletProcessorKernel.cc

build: clean $(DEPS)
	@emcc --bind -O1 -s WASM=1 \
		-s BINARYEN_ASYNC_COMPILATION=0 -s SINGLE_FILE=1 \
		RingBufferWorkletProcessorKernel.cc \
		-o ring-buffer-worklet-module.js \
		--post-js ../../lib/wa2.js \
		--post-js ring-buffer-worklet-processor.js

clean:
	@rm -f ring-buffer-worklet-module.js ring-buffer-worklet-module.wasm
