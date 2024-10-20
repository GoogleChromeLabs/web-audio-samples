// REF: https://github.com/romkor/svelte-portal/blob/a650e7b762344a1bb0ad9e218660ed1ee66e3f90/src/Portal.svelte
/**
 * MIT License
 *
 * Copyright (c) 2019 Roman Rodych
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
