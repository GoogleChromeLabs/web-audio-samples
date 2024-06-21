export default async tests => {
  const htmls = await Promise.all(tests.map(async t => (await fetch(t)).text()));

  const scripts = [];
  
  for (let html of htmls) {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const scriptContent = dom.querySelector('script').innerText;
  
    const blob = new Blob([scriptContent], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
  
    const script = document.createElement('script');
    script.defer = true;
    script.type = 'module';
    script.src = blobUrl;
  
    document.head.appendChild(script);
    scripts.push(new Promise(resolve => script.onload = resolve));
  }
  
  await Promise.all(scripts);
  
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
