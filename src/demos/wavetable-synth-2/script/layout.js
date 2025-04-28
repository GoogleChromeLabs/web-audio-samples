/* eslint-disable */

import { Dropdown } from '../ui-components/Dropdown.js';
import { KnobSimple } from '../ui-components/KnobSimple.js';
import { ToggleSimple } from '../ui-components/ToggleSimple.js';
import { MatrixSequence2D } from '../ui-components/MatrixSequence2D.js';
import { WavetableView } from '../ui-components/WavetableView.js';

import { WavetableDataSet } from './WavetableDataSet.js';

const initialize = async () => {
  const matrix2D = document.querySelector('#sequencer');
  matrix2D.addEventListener('change', (event) => {
    console.log('matrix changed:', event.detail.values);
  });

  const wavetableInitialIndex = 22;
  const wavetableView1 = document.querySelector('#wave-view-1');
  wavetableView1.setComplexData(
    WavetableDataSet[wavetableInitialIndex].real,
    WavetableDataSet[wavetableInitialIndex].imag
  );
  const wavetableView2 = document.querySelector('#wave-view-2');
  wavetableView2.setComplexData(
    WavetableDataSet[wavetableInitialIndex].real,
    WavetableDataSet[wavetableInitialIndex].imag
  );

  const wavetableOptions = {};
  WavetableDataSet.forEach((item, index) => {
    wavetableOptions[item.filename] = index;
  });
  const wavetableSelect1 = document.querySelector('#wave-select-1');
  wavetableSelect1.options = wavetableOptions;
  wavetableSelect1.addEventListener('select', (event) => {
    console.log('Select event received:', event.detail);
    if (event.detail.value) {
      const index = event.detail.value;
      wavetableView1.setComplexData(
        WavetableDataSet[index].real,
        WavetableDataSet[index].imag
      );
    }
  });
  const wavetableSelect2 = document.querySelector('#wave-select-2');
  wavetableSelect2.options = wavetableOptions;
  wavetableSelect2.addEventListener('select', (event) => {
    console.log('Select event received:', event.detail);
    if (event.detail.value) {
      const index = event.detail.value;
      wavetableView2.setComplexData(
        WavetableDataSet[index].real,
        WavetableDataSet[index].imag
      );
    }
  });
};

window.addEventListener('load', initialize);
