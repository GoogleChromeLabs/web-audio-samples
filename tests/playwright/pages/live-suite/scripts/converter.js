import {output} from './console.js';

export default async tests => {
  const htmls = await Promise.all(tests.map(async t => (await fetch(t)).text()));

  const template = document.querySelector('#row');
  htmls.forEach((html) => {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const scriptContent = dom.querySelector('script').innerText;

    const tr = template.content.cloneNode(true);
    const id = dom.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    tr.childNodes[1].id = id;
    tr.querySelector('slot[name=name]').textContent = dom.title;
    tr.querySelector('button').addEventListener('click', async () => {
      document.querySelectorAll('button').forEach(b => b.disabled = true);

      const script = document.createElement('script');
      script.defer = true;
      script.type = 'module';
      script.textContent = scriptContent;
      document.head.appendChild(script);

      const start = performance.now();
      // TODO: hacky
      await new Promise(resolve => setTimeout(resolve, 500));
      await window.test;
      const diff = performance.now() - start;

      document.querySelector(`#${id} slot[name=result]`).textContent = await window.evaluate() ? '✅': '❌';
      document.querySelector(`#${id} slot[name=time]`).textContent = `${(diff).toFixed(2)}ms`;
      document.querySelector(`#${id} pre slot[name=output]`).textContent =
        output.map(({method, args}) => `${method}: ${args}`).join('\n') || '---';

      output.length = 0;

      delete window.test;
      // noinspection JSConstantReassignment
      delete window.evaluate;
      document.head.removeChild(script);

      document.querySelectorAll('button').forEach(b => b.disabled = false);
    });

    document.querySelector('tbody').appendChild(tr);
  });
};