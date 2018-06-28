import { html, render } from '../node_modules/lit-html/lib/lit-extended.js';

const at = (targetDivId) => {
  return document.getElementById(targetDivId);
};

const buildPage = (renderFunctions) => {
  // TODO: how do I fix the "flickering issue"? How can these render calls
  // can be synchronized?
  window.addEventListener('load', () => {
    renderFunctions();
  });
};

export {
  html,
  render,
  at,
  buildPage,
};