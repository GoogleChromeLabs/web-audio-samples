# Web Audio Test Suite

The Web Audio Test Suite is comprised of performance and benchmark tests for Web
Audio. These tests can be run either through Playwright or the Live Suite.
**Playwright** is a browser automation testing framework that runs via CLI or
CI. This is useful for automated testing across different browsers or browser
versions. Web Audio Test **Live Suite** is an interactive webpage for running 
tests locally in your browser and monitoring runtime.

## Table of Contents

- [Instructions for Local Testing](#instructions-for-local-testing)
- [Writing Tests](#writing-tests)
- [Playwright Configuration](#playwright-configuration)
- [Web Audio Test Suite APIs](#web-audio-test-suite-apis)
  - [Audit Library API](#audit-library-api)
  - [Recorder API](#recorder-api)


## Instructions for Local Testing

- `npm install`
- `npx playwright install`
- Then `npm run test` or `npm run test-live`
  - `npm run test` for Playwright tests.
  - `npm run test-live` for live suite; after the comment, open up a browser and
    go to `localhost:8080`.

The test result looks like this for `npm run test`: 
![Screenshot 2024-07-15 at 8 41 09 AM](https://github.com/user-attachments/assets/5e83cf71-b14b-4761-9e5e-e9eef775c429)

The test result looks like this for `npm run test-live`: 
![Screenshot 2024-07-15 at 8 44 37 AM](https://github.com/user-attachments/assets/aa96989e-733a-48e0-937a-576b2c019523)

## Writing Tests

Web Audio Tests are written as HTML files and live in [pages](./pages) directory. 
An example test is written in [pages/realtime-sine.html](./pages/realtime-sine.html). 
The starter template for writing Web Audio Tests can be found in 
[pages/template.html](./pages/template.html) (copied below):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script defer type="module">
      import {test, evaluateTest, assert} from './util/audit.js';

      test(new Promise((resolve) => {
        const context = new AudioContext();
        // resolved object is passed to evaluateTest as testResult
        resolve(context);
      }));

      evaluateTest((testResult) => {
        assert(testResult instanceof AudioContext, 'Test result is not an instance of AudioContext.');
        // returns true if test passes
        return assert();
      });
    </script>
    <title>My Web Audio Test</title>
  </head>
  <body>
    <h1>My Web Audio Test</h1>
    <p>My web audio test description.</p>
  </body>
</html>
```

Each Web Audio Test is comprised of two parts:
1. `test(testPromise: Promise<T>): void` 
    - Creates a Web Audio Test for Playwright and the Web Audio Live Test Suite.
      Write performance test code here in `testPromise` that resolves with the
      end state of your program. Runtime execution of `test()` is timed in the
      Web Audio Live Suite.
2. `evaluateTest(testFunction: (testResult: T) => boolean): void`
    - Evaluates a Web Audio Test. Write all test assertions here.
      `testFunction()` should return a boolean indicating if your test passed.
      Use `assert(condition: boolean, message: string)` for assertions and
      return `assert()` which evaluates if all assertions passed. 

### To add your test to Web Audio Test Suite:

Add an entry to [pages/tests.json](pages/tests.json) a test group using the
following schema:

```json
{
  "name": "My Web Audio Test",
  "path": "pages/template.html"
}
```

Make sure that the `path` contains `pages/`.

## Playwright Configuration

Playwright runs each test headlessly in an isolated [BrowserContext](https://playwright.dev/docs/api/class-browsercontext).
To configure which browsers Playwright uses, multiple browser projects can be 
added in [playwright.config.ts](../../../playwright.config.ts) under `projects`. 
By default, Playwright uses the latest stable version of Chromium. The latest 
version is listed on the [Playwright GitHub](https://github.com/microsoft/playwright?tab=readme-ov-file#documentation--api-reference).

Playwright tests can also be run on your local Chrome application or 
Chrome Canary. More details can be found in Playwright's documentation 
[here](https://playwright.dev/docs/browsers#run-tests-on-different-browsers).

To test a custom Chromium executable (e.g. older version of Chromium), manually 
download and specify your browser executable path. Add your browser to 
`playwright.config.ts` as shown below:

```ts
{
  name: 'chromium custom',
  use: {
    ...devices['Desktop Chrome'], 
    launchOptions: {
      executablePath: '/MY/PATH/TO/Chromium.app/Contents/MacOS/Chromium',
      ignoreDefaultArgs: ['--mute-audio'],
      args: ['--autoplay-policy=no-user-gesture-required']
    }
  }
}
```

For Chromium, these `launchOptions` parameters are necessary for Web Audio Tests:
- `ignoreDefaultArgs: ['--mute-audio']` - prevent browser audio from being muted. 
- `args: ['--autoplay-policy=no-user-gesture-required']` - disable user gesture requirement for AudioContext to start

## Web Audio Test Suite APIs

Below are some helpful tools for writing Web Audio Tests:

- [Audit.js](#audit-api)
- [Recorder](#recorder) 

### Audit Library API

`audit.js` contains all Web Audio Test Suite utility functions. These can be imported as follows:

```js
import {test, evaluateTest} from './util/audit.js';
```

#### `beCloseTo(actual: number, expected: number, threshold: number): [boolean, string]`

Check if `actual` is close to `expected` using the given relative error
`threshold`. A detailed message string is returned if false. This can be used
with `assert()`.

#### `test(testPromise: Promise<T>): void`

Creates a Web Audio Test for Playwright and the Web Audio Live Test Suite. Write
performance test code here in `testPromise` that resolves with the end state of
your program. Runtime execution of `test()` is timed in the Web Audio Live
Suite.

#### `evaluateTest(testFunction: (testResult: T) => boolean): void`

Evaluates a Web Audio Test. Write all test assertions here. `testFunction()`
should return a boolean indicating if your test passed. Use 
`assert(condition: boolean, message: string)` for assertions and return 
`assert()` which evaluates if all assertions passed. 

#### `assert(condition?: boolean, message?: string)`

Asserts a condition and logs a message if the condition is not met. If no
arguments are specified, the function returns a boolean indicating whether all
previous assertions were true.

### Recorder API

The Recorder is an AudioWorkletNode helpful for recording raw PCM sample output
from your Web Audio Graph. This is useful for capturing rendered output for
comparison. To import:

```js
import {record} from './util/recorder/recorder-main.js';
```

#### `async record(context: AudioContext, recordDuration: number): {recorder: AudioWorkletNode, recordingCompletePromise: Promise<Float32Array[]>}`

The `record()` function takes an AudioContext and a duration in seconds to
record for, returning a `recorder` node and a `recordingCompletePromise`. The
`recorder` node will record all input channels for `sampleRate * recordDuration`
samples, after which, `recordingCompletePromise` will resolve with an Array of
Float32Array, with each index being a channel of recorded samples.

##### Recorder Usage Example:

```js
// Record 1 second of audio
const duration = 1
const {recorder, recordingCompletePromise} = await record(context, duration);
// Place a recorder at the end of your graph
myGraph.connect(recorder).connect(context.destination);
// Start rendering your graph and await for recorded output
const recordedChannelData = await recordingCompletePromise;
```
