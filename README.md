# Web Audio Samples by Chrome Web Audio Team

This repository contains the source code for the [Web Audio Samples](https://googlechromelabs.github.io/web-audio-samples/) site a curated collection of examples, demos, and resources for the Web Audio API, maintained by the Chrome Web Audio team.

See the `gh-pages` branch for the deployed static site built from this source.

---

## Project Architecture Overview

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Static Site Generator | [Eleventy (11ty)](https://www.11ty.dev/) | `^3.1.2` |
| CSS Framework | [TailwindCSS v4](https://tailwindcss.com/) | `^4.1.18` |
| Templating | [Nunjucks](https://mozilla.github.io/nunjucks/) (`.njk`) | via Eleventy |
| Data Files | YAML (`.yaml`) | via `js-yaml` |
| Navigation | `@11ty/eleventy-navigation` | `^1.0.5` |
| Audio API | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) + [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) | Browser native |
| Testing | [Playwright](https://playwright.dev/) | `^1.58.1` |
| Linting | ESLint (Google config) | `^10.1.0` |

### Build System

Eleventy reads all source files from `src/` and generates a static site into `_site/`. TailwindCSS is compiled separately and output directly into `_site/styles.css`. The two pipelines run in parallel during development and sequentially during production builds.

```
src/  ──► Eleventy ──► _site/        (HTML, JS, assets via passthrough copy)
src/styles/styles.css ──► TailwindCSS CLI ──► _site/styles.css
```

### Audio Worklet Integration

The [AudioWorklet API](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) allows custom audio processing code to run in a dedicated, low-latency audio rendering thread - separate from the main JS thread.

**Key concepts:**

| Pattern | Location | Description |
|---|---|---|
| Basic bypass / filter | `audio-worklet/basic/` | Minimal `AudioWorkletProcessor` examples |
| `AudioParam` automation | `audio-worklet/basic/noise-generator/` | Custom parameters with automation |
| `MessagePort` | `audio-worklet/basic/message-port/` | Two-way main↔worklet communication |
| WASM integration | `audio-worklet/design-pattern/wasm/` | Loading WebAssembly into a worklet |
| SharedArrayBuffer | `audio-worklet/design-pattern/shared-buffer/` | Lock-free audio data sharing with Workers |
| FreeQueue | `audio-worklet/free-queue/` | A lock-free SPSC ring buffer for thread-safe audio I/O |

Each example's page is a Nunjucks template (`index.njk`) that extends `base.njk`, and the JS files are served as-is via Eleventy's passthrough copy.

### Node.js Version Requirements

| Requirement | Value |
|---|---|
| **Minimum recommended** | Node.js **22** (LTS) |
| **CI environment** | Node.js 22 (enforced in GitHub Actions) |
| **Package lock version** | v3 (npm 7+) |

> Node.js 18+ is technically sufficient to run Eleventy 3.x, but Node.js 22 is recommended to match the CI environment and avoid subtle compatibility issues.

## Development

### Branch structure
- `main`: site source
- `gh-pages`: the actual site built from `main`
- `archive`: old projects/examples (V2 and earlier)

### How to make changes and deploy

1. Clone the repository.
2. `npm install`
3. To fire up the local dev server, `npm run start`.
4. Make sure to run `npm run format` to apply linting/formatting.
5. To deploy, `npm run deploy`

## Support

If you have found an error in this library, please file an issue at:
https://github.com/GoogleChromeLabs/web-audio-samples/issues.

## Contribution

Patches are encouraged, and may be submitted by forking this project and
submitting a pull request through GitHub. See [CONTRIBUTING.md](CONTRIBUTING.md) for more detail.

## License

Copyright 2018 Google, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
