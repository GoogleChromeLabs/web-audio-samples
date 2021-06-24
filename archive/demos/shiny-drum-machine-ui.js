class Slider {
    constructor(element, opts = {}) {
        this.element = element;
        this.onchange = () => {};

        element.addEventListener('input', () => {
            this.onchange(this.value);
        });

        if(opts && opts.doubleClickValue) {
            element.addEventListener('dblclick', () => {
                this.value = opts.doubleClickValue;
                this.onchange(this.value);
            });
        }
    }

    get value() {
        return new Number(this.element.value) / 100;
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
        for(const el of container.querySelectorAll('[data-instrument][data-pitch]')) {
            this.sliders[el.dataset.instrument] = new Slider(el, {doubleClickValue: 0.5});
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
    }

    drawPlayhead(index) {
        // TODO: Refactor, replace with data attributes.
        this.current = index;
        const lastIndex = (index + 15) % 16;

        const elNew = document.getElementById('LED_' + index);
        const elOld = document.getElementById('LED_' + lastIndex);
        
        elNew.src = 'images/LED_on.png';
        elOld.src = 'images/LED_off.png';
    }

    off() {
        const el = document.getElementById(`LED_${this.current}`);
        el.src = 'images/LED_off.png';
    }
}

class DemoButtons {
    constructor(container = document, onDemoClick = () => {}) {
        this.buttons = {};
        this.onDemoClick = onDemoClick;

        const onButtonClick = (event) => {
            this.onDemoClick(new Number(event.target.dataset.demo));
        };

        for(const element of container.querySelectorAll(`[data-demo]`)) {
            const demoIndex = new Number(element.dataset.demo);
            this.buttons[demoIndex] = new Button(element, onButtonClick);
        }
    }

    markDemoAvailable(demoIndex) {
        this.buttons[demoIndex].state = "loaded";
    }
}

class Picker {
    constructor(element) {
        this.onSelect = (index) => {};
        this.element = element;
        this.element.addEventListener('change', () => this.onSelect(this.element.selectedIndex));
    }

    addOptions(names) {
        for(const name of names) {
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
        return new Number(this.labelElement.innerText);
    }
}

class Notes {
    constructor() {
        this.onClick = (instrument, rhythm) => {};

        this.buttons = {};
        for (const el of document.querySelectorAll(`[data-instrument][data-rhythm]`)) {
            const instrument = el.dataset.instrument;
            const rhythm = new Number(el.dataset.rhythm);

            if(!this.buttons[instrument]) {
                this.buttons[instrument] = {};
            }

            this.buttons[instrument][rhythm] = new Button(el);
            this.buttons[instrument][rhythm].onclick = () => this.onClick(instrument, rhythm);
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

class SaveModal extends Modal {
    constructor(getDataCallback) {
        super(document.getElementById('save_container'));
        this.textarea = document.getElementById('save_textarea');
        document.getElementById('save_ok').addEventListener('click', () => {
            this.toggleVisibility();
        });
        document.getElementById('save').addEventListener('click', () => {
            this.textarea.value = getDataCallback();
            this.toggleVisibility();
        });
    }

    show(data) {
        this.textarea.value = data;
        this.toggleVisibility();
    }
}

class LoadModal extends Modal {
    constructor() {
        super(document.getElementById('load_container'));
        this.textarea = document.getElementById('load_textarea');
        this.onLoad = (data) => {};
        document.getElementById('load_ok').addEventListener('click', () => {
            this.onLoad(this.textarea.value);
            this.toggleVisibility();
            this.textarea.value = "";
        });
        document.getElementById('load_cancel').addEventListener('click', () => {
            this.toggleVisibility();
        });
        document.getElementById('load').addEventListener('click', () => {
            this.toggleVisibility();
        });
    }

    show(data) {
        this.textarea.value = data;
        this.toggleVisibility();
    }
}

export {DemoButtons,
     EffectPicker,
     KitPicker,
     EffectSlider,
     SwingSlider,
     PitchSliders,
    TempoInput, Playheads, Notes, PlayButton,
    LoadModal, SaveModal, ResetButton };