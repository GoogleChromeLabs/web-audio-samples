/* eslint require-jsdoc: "off" */

class Slider {
  constructor(element, opts = {}) {
    this.element = element;
    this.onchange = () => {};

    element.addEventListener('input', () => {
      this.onchange(this.value);
    });

    if (opts && opts.doubleClickValue) {
      element.addEventListener('dblclick', () => {
        this.value = opts.doubleClickValue;
        this.onchange(this.value);
      });
    }
  }

  get value() {
    return Number(this.element.value) / 100;
  }

  set value(value) {
    this.element.value = value * 100;
  }
}

class EffectSlider extends Slider {
  constructor(container=document) {
    super(container.getElementById('effect_thumb'));
  }
}

class SwingSlider extends Slider {
  constructor(container=document) {
    super(container.getElementById('swing_thumb'));
  }
}

class PitchSliders {
  constructor(container=document) {
    this.sliders = {};
    this.onPitchChange = (instrument, pitch) => {};
    const selector = '[data-instrument][data-pitch]';
    for (const el of container.querySelectorAll(selector)) {
      this.sliders[el.dataset.instrument] = new Slider(el,
          {doubleClickValue: 0.5});
      this.sliders[el.dataset.instrument].onchange = (value) => {
        this.onPitchChange(el.dataset.instrument, value);
      };
    }
  }

  setPitch(instrument, pitch) {
    this.sliders[instrument].value = pitch;
  }
}

class Button {
  constructor(element, onclick = () => {}) {
    this.element = element;
    this.onclick = onclick;
    element.addEventListener('click', (event) => this.onclick(event));
  }

  get state() {
    return this.element.dataset.state;
  }

  set state(value) {
    this.element.dataset.state = value;
  }
}

class PlayButton extends Button {
  constructor() {
    super(document.getElementById('play'));
  }
}

class ResetButton extends Button {
  constructor() {
    super(document.getElementById('reset'));
  }
}

class Playheads {
  constructor() {
    this.current = 0;
    this.leds = {};

    const selector = '[data-led][data-rhythm]';
    for (const el of document.querySelectorAll(selector)) {
      const i = Number(el.dataset.rhythm);
      this.leds[i] = el;
    }
  }

  drawPlayhead(index) {
    this.off();
    this.current = index;
    this.leds[this.current].dataset.led = 'on';
  }

  off() {
    this.leds[this.current].dataset.led = 'off';
  }
}

class DemoButtons {
  constructor(container = document, onDemoClick = () => {}) {
    this.buttons = {};
    this.onDemoClick = onDemoClick;

    const onButtonClick = (event) => {
      this.onDemoClick(Number(event.target.dataset.demo));
    };

    for (const element of container.querySelectorAll(`[data-demo]`)) {
      const demoIndex = Number(element.dataset.demo);
      this.buttons[demoIndex] = new Button(element, onButtonClick);
    }
  }

  markDemoAvailable(demoIndex) {
    this.buttons[demoIndex].state = 'loaded';
  }
}

class Picker {
  constructor(element) {
    this.onSelect = (index) => {};
    this.element = element;
    this.element.addEventListener('change',
        () => this.onSelect(this.element.selectedIndex));
  }

  addOptions(names) {
    for (const name of names) {
      this.element.add(new Option(name));
    }
  }

  select(index) {
    this.element.selectedIndex = index;
  }
}

class EffectPicker extends Picker {
  constructor(container=document) {
    super(container.getElementById('effectlist'));
  }
}

class KitPicker extends Picker {
  constructor(container=document) {
    super(container.getElementById('kitlist'));
  }
}

class TempoInput {
  constructor({min, max, step}) {
    this.labelElement = document.getElementById('tempo');
    this.onTempoChange = (tempo) => {};

    document.getElementById('tempoinc').addEventListener('click', () => {
      this.value += this.step;
      this.onTempoChange(this.value);
    });

    document.getElementById('tempodec').addEventListener('click', () => {
      this.value -= this.step;
      this.onTempoChange(this.value);
    });

    this.min = min;
    this.max = max;
    this.step = step;
  }

  set value(value) {
    this.labelElement.innerText = Math.min(this.max, Math.max(this.min, value));
  }

  get value() {
    return Number(this.labelElement.innerText);
  }
}

class Notes {
  constructor() {
    this.onClick = (instrument, rhythm) => {};

    this.buttons = {};
    const selector = '[data-instrument][data-rhythm]';
    for (const el of document.querySelectorAll(selector)) {
      const instrument = el.dataset.instrument;
      const rhythm = Number(el.dataset.rhythm);

      if (!this.buttons[instrument]) {
        this.buttons[instrument] = {};
      }

      this.buttons[instrument][rhythm] = new Button(el);
      this.buttons[instrument][rhythm].onclick = () => this.onClick(
          instrument, rhythm);
    }
  }

  setNote(instrument, rhythmIndex, note) {
    this.buttons[instrument][rhythmIndex].state = note;
  }
}

class Modal {
  constructor(element) {
    this.element = element;
  }

  toggleVisibility() {
    document.getElementById('pad').classList.toggle('active');
    document.getElementById('params').classList.toggle('active');
    document.getElementById('tools').classList.toggle('active');
    this.element.classList.toggle('active');
  }
}

class SaveButton extends Button {
  constructor(getDataCallback) {
    super(document.getElementById('save'), () => {
      const data = getDataCallback();
      const date = new Date().toISOString().split('T')[0];
      const filename = `drums-${date}.json`;

      const blob = new Blob([data], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;

      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

class LoadButton extends Button {
  constructor(onLoadCallback) {
    super(document.getElementById('load'), () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = () => {
        const reader = new FileReader();
        reader.onload = () => onLoadCallback(reader.result);
        reader.readAsText(input.files[0]);
      };
      input.click();
    });
  }
}

export {
  DemoButtons,
  EffectPicker,
  EffectSlider,
  KitPicker,
  LoadButton,
  Notes,
  PitchSliders,
  PlayButton,
  Playheads,
  ResetButton,
  SaveButton,
  SwingSlider,
  TempoInput,
};
