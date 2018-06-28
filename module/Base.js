import { html, render } from '../node_modules/lit-html/lib/lit-extended.js';

const at = (targetDivId) => {
  return document.getElementById(targetDivId);
};

const buildPage = (renderFunctions) => {
  window.addEventListener('load', renderFunctions);
};

export {
  html,
  render,
  at,
  buildPage,
};