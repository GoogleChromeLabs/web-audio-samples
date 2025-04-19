import { Dropdown } from "../ui-components/Dropdown.js";
import { KnobSimple } from "../ui-components/KnobSimple.js";
import { ToggleSimple } from "../ui-components/ToggleSimple.js";
import { MatrixSequence2D } from "../ui-components/MatrixSequence2D.js";
import { WavetableView } from "../ui-components/WavetableView.js";

import { WavetableDataSet } from "./WavetableDataSet.js";

const handleUIEvent = (event) => {
  const value = event.type === 'input' || event.type === 'change'
      ? event.detail.value : event.detail.state;
  console.log(`${event.target.label}:${event.type}:${value}`);
};

const initialize = async () => {
  // const toggle1 = document.querySelector('#toggle-1');
  // const toggle2 = document.querySelector('#toggle-2');
  // toggle1.addEventListener('change', handleUIEvent);
  // toggle2.addEventListener('change', handleUIEvent);

  // const knob1 = document.querySelector('#knob-1');
  // const knob2 = document.querySelector('#knob-2');
  // const knob3 = document.querySelector('#knob-3');
  // knob1.addEventListener('input', handleUIEvent);
  // knob1.addEventListener('change', handleUIEvent);
  // knob2.addEventListener('input', handleUIEvent);
  // knob2.addEventListener('change', handleUIEvent);
  // knob3.addEventListener('input', handleUIEvent);
  // knob3.addEventListener('change', handleUIEvent);

  const matrix2D = document.querySelector('#sequencer');
  matrix2D.addEventListener('change', (event) => {
    console.log('matrix changed:', event.detail.values);
  });

  const wavetableView1 = document.querySelector('#wave-view-1');
  wavetableView1.setComplexData(WavetableDataSet[35].real, WavetableDataSet[35].imag);
  const wavetableView2 = document.querySelector('#wave-view-2');
  wavetableView2.setComplexData(WavetableDataSet[20].real, WavetableDataSet[20].imag);

  const wavetableSelect1 = document.querySelector('#wave-select-1');
  wavetableSelect1.options = {
    'Option A': 1,
    'Option B': 2,
    'Option C': 3,
    'Another Option': 4,
  };
  wavetableSelect1.addEventListener('select', (event) => {
    console.log('Select event received:', event.detail);
    if (event.detail.value) {
      const index = event.detail.value
      wavetableView1.setComplexData(WavetableDataSet[index].real, WavetableDataSet[index].imag);
    }
  });
  const wavetableSelect2 = document.querySelector('#wave-select-2');
  wavetableSelect2.options = {
    'Option A': 1,
    'Option B': 2,
    'Option C': 3,
    'Another Option': 4,
  };
  wavetableSelect2.addEventListener('select', (event) => {
    console.log('Select event received:', event.detail);
    if (event.detail.value) {
      const index = event.detail.value
      wavetableView2.setComplexData(WavetableDataSet[index].real, WavetableDataSet[index].imag);
    }
  });


};

window.addEventListener('load', initialize);
