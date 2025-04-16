import { KnobSimple } from "../ui-components/KnobSimple.js";
import { ToggleSimple } from "../ui-components/ToggleSimple.js";


const handleUIEvent = (event) => {
  const value = event.type === 'input' || event.type === 'change'
      ? event.detail.value : event.detail.state;
  console.log(`${event.target.label}:${event.type}:${value}`);
};

const toggle1 = document.querySelector('#toggle-1');
const toggle2 = document.querySelector('#toggle-2');
toggle1.addEventListener('change', handleUIEvent);
toggle2.addEventListener('change', handleUIEvent);

const knob1 = document.querySelector('#knob-1');
const knob2 = document.querySelector('#knob-2');
const knob3 = document.querySelector('#knob-3');
knob1.addEventListener('input', handleUIEvent);
knob1.addEventListener('change', handleUIEvent);
knob2.addEventListener('input', handleUIEvent);
knob2.addEventListener('change', handleUIEvent);
knob3.addEventListener('input', handleUIEvent);
knob3.addEventListener('change', handleUIEvent);

