DEPS = HelloWasm.c

build: clean $(DEPS)
	@emcc -Os -s WASM=1 \
		hello-wasm.c \
		-o hello-wasm.js

clean:
	@rm -f hello-wasm.js hello-wasm.wasm
