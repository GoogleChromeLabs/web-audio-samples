DEPS = MultiChannelKernel.cc

build: clean $(DEPS)
	@emcc --bind -O1 -s WASM=1 \
		MultiChannelKernel.cc \
		-o multi-channel-kernel.js \
		--post-js ../../lib/wa2.js

clean:
	@rm -f multi-channel-kernel.js multi-channel-kernel.wasm
