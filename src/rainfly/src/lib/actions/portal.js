// REF: https://github.com/romkor/svelte-portal/blob/a650e7b762344a1bb0ad9e218660ed1ee66e3f90/src/Portal.svelte

import {tick} from 'svelte';

/**
 * Creates a portal to render an element at a target location.
 *
 * @param {HTMLElement} el - The element to render in the portal.
 * @param {string|HTMLElement} target - The target location where the element
 * ``will be rendered. Can be a CSS selector string or an HTMLElement.
 * @return {Object} An object containing the update and destroy methods for
 * ``the portal.
 */
export const portal = (el, target = 'div') => {
  let targetEl;
  const update = async (/** @type {string|HTMLElement} */ newTarget) => {
    target = newTarget;
    if (typeof target === 'string') {
      targetEl = document.querySelector(target);
      if (targetEl === null) {
        await tick();
        targetEl = document.querySelector(target);
      }
      if (targetEl === null) {
        throw new Error(`No element found matching css selector: "${target}"`);
      }
    } else if (target instanceof HTMLElement) {
      targetEl = target;
    } else {
      // eslint-disable-next-line max-len
      throw new TypeError(`Unknown portal target type: ${target === null ? 'null' : typeof target}. Allowed types: string (CSS selector) or HTMLElement.`);
    }
    targetEl.appendChild(el);
    el.hidden = false;
  };

  const destroy = () => el.parentNode && el.parentNode.removeChild(el);

  // noinspection JSIgnoredPromiseFromCall
  update(target);

  return {
    update,
    destroy,
  };
};
