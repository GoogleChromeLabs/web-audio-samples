DEPS = ClassFoo.cc

build: clean $(DEPS)
	@emcc --bind -Os -s WASM=1 \
		class-foo.cc \
		-o class-foo.js

clean:
	@rm -f class-foo.js class-foo.wasm
