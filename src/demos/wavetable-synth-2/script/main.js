import { KnobSimple } from "../ui-components/KnobSimple.js";
import { ToggleSimple } from "../ui-components/ToggleSimple.js";

const toggle1 = document.querySelector('#toggle-1');
const toggle2 = document.querySelector('#toggle-2');
const knob1 = document.querySelector('#knob-1');
const knob2 = document.querySelector('#knob-2');
const knob3 = document.querySelector('#knob-3');

console.log(toggle1);
console.log(toggle2);
console.log(knob1);
console.log(knob2);
console.log(knob3);

toggle1.addEventListener('change', (event) => {
  console.log('Toggle 1 state changed:', event.detail.state);
});

toggle2.addEventListener('change', (event) => {
  console.log('Toggle 1 state changed:', event.detail.state);
});

knob1.addEventListener('input', (event) => {
  console.log('Knob 1 value changed:', event.detail.value);
});

knob1.addEventListener('change', (event) => {
  console.log('Knob 1 value changed:', event.detail.value);
});
