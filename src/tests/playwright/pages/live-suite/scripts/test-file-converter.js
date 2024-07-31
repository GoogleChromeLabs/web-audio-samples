/**
 * @fileoverview Provides utilities for converting HTML test files to
 * interactive DOM elements in the Web Audio Test Suite, including dynamic test
 * execution, results display, and console output management.
 */
import {output} from './console-override.js';

export const convertTestFiles = async (tests) => {
  const testsPassed = [];

  const htmls = await Promise.all(
      tests.map(async (t) => (await fetch(t.replace(/^pages\//g, ''))).text()));

  const template = document.querySelector('#row');
  htmls.forEach((html, i) => {
    const dom = new DOMParser()
        .parseFromString(html, 'text/html');
    const scriptContent = dom.querySelector('script').innerText;

    const tr = template.content.cloneNode(true);
    const id = dom.title
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
    tr.childNodes[1].id = id;
    tr.querySelector('slot[name=name]').textContent = dom.title;
    tr.querySelector('button').addEventListener('click', async () => {
      document.querySelectorAll('button').forEach((b) => b.disabled = true);

      const script = document.createElement('script');
      script.defer = true;
      script.async = true;
      script.type = 'module';
      script.textContent = scriptContent;
      document.head.appendChild(script);

      // wait until script loads in the live suite
      await new Promise((resolve) => window._webAudioTestIsRunning = resolve);
      const start = performance.now();
      await window._webAudioTest;
      const diff = performance.now() - start;

      testsPassed[i] = await window.webAudioEvaluate();

      document.querySelector(`#${id} slot[name=result]`).textContent =
          testsPassed[i] ? '✅': '❌';
      document.querySelector(`#${id} slot[name=time]`).textContent =
          `${(diff).toFixed(2)}ms`;
      document.querySelector(`#${id} pre slot[name=output]`).textContent =
          output.map(({method, args}) =>
            `${method}: ${args.join(' ')}`,
          ).join('\n') || '---';

      document.querySelector('#passed').innerText =
          testsPassed.filter((status) => status).length;

      output.length = 0;

      delete window._webAudioTest;
      delete window.webAudioEvaluate;
      document.head.removeChild(script);

      document.querySelectorAll('button').forEach((b) => b.disabled = false);

      window._webAudioTestEnded();
    });

    document.querySelector('tbody').appendChild(tr);
  });
};
