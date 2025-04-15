import { LEDToggleSwitch } from "../ui-components/LEDToggleSwitch.js";

const ledToggleSwitch = document.getElementById('ledToggleSwitch');
const statusSpan = document.getElementById('statusSpan');

ledToggleSwitch.addEventListener('togglechange', (event) => {
  statusSpan.textContent = event.detail.isActive ? 'ON' : 'OFF';
});
