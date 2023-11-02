# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/bin/bash

DEPS = $(wildcard ./synth_src/*.cpp)

build: $(DEPS)
	@emcc \
		--bind \
		--post-js ../lib/em-es6-module.js \
		-s ENVIRONMENT=shell \
		-s SINGLE_FILE=1 \
		-s WASM=1 \
		-s WASM_ASYNC_COMPILATION=0 \
		-s EXPORTED_FUNCTIONS="['_malloc']" \
		-o ./synth.wasm.js \
		./synth_src/synth_bind.cc $(DEPS)

	@echo "Build complete: ./synth.wasm.js"
