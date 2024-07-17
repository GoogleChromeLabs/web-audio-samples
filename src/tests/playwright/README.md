# Web Audio Test Suite

Web Audio Testing is done using two platforms, Playwright and Live Suite. 
**Playwright** is a browser automation and testing framework that runs isolated 
BrowserContexts for testing via CLI. This is useful for automated testing across
different browsers and browser versions. **Live Suite** is an interactive 
webpage for running tests locally and monitoring Web Audio performance.

## Instructions for local testing

- `npm install`
- `npx playwright install`
- Then `npm run test` or `npm run test-live`
  - `npm run test` for Playwright tests.
  - `npm run test-live` for live suite; after the comment, open up a browser and go to `localhost:8080`.

The test result looks like this for `npm run test`:
![Screenshot 2024-07-15 at 8 41 09 AM](https://github.com/user-attachments/assets/5e83cf71-b14b-4761-9e5e-e9eef775c429)

The test result looks like this for `npm run test-live`:
![Screenshot 2024-07-15 at 8 44 37 AM](https://github.com/user-attachments/assets/aa96989e-733a-48e0-937a-576b2c019523)

## Writing Tests

Web Audio Tests are executed both in Playwright and the [Live Suite](http://localhost:8080). Tests should be written in the [pages](./pages) directory using the test template in [pages/template.html](./pages/template.html):

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
    - Testing logic is written here as a Promise that resolves with the end state of your program. The runtime execution of `test()` is timed in the Web Audio Live Suite.
2. `evaluateTest(testFunction: (testResult: T) => boolean): void`
    - Test assertions are defined here. Your `testFunction()` should return a boolean indicating if your test passed. Make assertions using `assert(condition: boolean, message: string)` and use `assert()` to return your overall test outcome.

Add your test to Playwright and the Live Suite as follows:
1. Playwright
    - Add a new test to the end of `runner.spec.ts`
    ```ts
    test('My Web Audio Test Name', async ({page}) => {
        await page.goto('pages/test-name.html');
    });
    ```
2. Live Suite
    - Add your test file name to the `files` array in [pages/live-suite/scripts/main.js](./pages/live-suite/scripts/main.js)
    ```js
    const files = [
        // ...other tests
        'test-name.html',
    ];
    ```

## Recorder API
To enable the recorder API, add the following import to your test.
```js
import {record} from './util/recorder/recorder-main.js';
```
#### `async record(context: AudioContext, recordDuration: number): {recorder: AudioWorkletNode, recordingCompletePromise: Promise<Float32Array[]>}`
The `record()` function initializes the recorder node and returns the node and a promise with the `Float32Array[]` of raw PCM data. Creates an AudioWorklet recorder node to record input for a specified length of time (seconds). Passes audio through to output for `recordDuration` seconds. Once `recordDuration` seconds have elapsed, `recordingCompletePromise` resolves with the raw PCM data.
##### Usage example:
```js
// Records 1 second of audio.
const {recorder, recordingCompletePromise} = await record(context, 1);
/* audio graph */.connect(recorder).connect(context.destination);
const recordedChannelData = await recordingCompletePromise;
```

## Audit API

#### `beCloseTo(actual: number, expected: number, threshold: number): [boolean, string]`
Check if |actual| is close to |expected| using the given relative error |threshold|.

#### `test(testPromise: Promise<T>): void`
Creates a Web Audio Test for Playwright and the Web Audio Test Suite.

#### `evaluateTest(testFunction: (testResult: T) => boolean): void`
Evaluates a Web Audio Test.

#### `assert(condition?: boolean, message?: string)`
Asserts a condition and logs a message if the condition is not met. If no arguments are specified, the function returns a boolean indicating whether all previous assertions were true.