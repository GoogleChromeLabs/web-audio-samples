DEPS = AWPKernelWithVariableBufferSize.cc

build: $(DEPS)
	@emcc --bind -O1 -s WASM=1 \
		-s BINARYEN_ASYNC_COMPILATION=0 -s SINGLE_FILE=1 \
		AWPKernelWithVariableBufferSize.cc \
		-o audioworklet.wasmmodule.js \
		--post-js ../lib/wa2.js \
		--post-js ring-buffer-worklet-processor.js

clean:
	@rm -f audioworklet.wasmmodule.js
