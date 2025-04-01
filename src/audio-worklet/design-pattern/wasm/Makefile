DEPS = SimpleKernel.cc

build: $(DEPS)
	@emcc --bind -O2 \
	  -s WASM=1 \
		-s WASM_ASYNC_COMPILATION=0 \
		-s SINGLE_FILE=1 \
		SimpleKernel.cc \
		-o simple-kernel.wasmmodule.js \
		-s MODULARIZE=1 \
		-s EXPORT_ES6=1 \
		-s EXPORTED_FUNCTIONS="['_malloc']"

clean:
	@rm -f simple-kernel.wasmmodule.js