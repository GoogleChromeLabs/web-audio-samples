export default async tests => {
  const htmls = await Promise.all(tests.map(async t => (await fetch(t)).text()));

  htmls.forEach(html => {
    const dom = new DOMParser().parseFromString(html, 'text/html');

    const script = document.createElement('script');
    script.defer = true;
    script.type = 'module';
    script.textContent = dom.querySelector('script').innerText;
    document.head.appendChild(script);
  });

  const template = document.querySelector('#row');
  Object.entries(window.tests).forEach(([name, t]) => {
    const tr = template.content.cloneNode(true);
    tr.querySelector('slot[name=name]').textContent = name;
    // tr.querySelector('slot[name=result]').textContent = t.result;
    // tr.querySelector('slot[name=time]').textContent = t.time;
    // tr.querySelector('slot[name=output]').textContent = t.output;
    document.querySelector('tbody').appendChild(tr);
  });
};
