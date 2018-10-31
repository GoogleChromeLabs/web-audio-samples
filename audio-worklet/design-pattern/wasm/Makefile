DEPS = SimpleKernel.cc

build: $(DEPS)
	@emcc --bind -O1 \
	  -s WASM=1 \
		-s BINARYEN_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		SimpleKernel.cc \
		-o simple-kernel.wasmmodule.js \
		--post-js ../lib/em-es6-module.js

clean:
	@rm -f simple-kernel.wasmmodule.js