import {writable} from 'svelte/store';

const defaultVim = false; // TODO: load from local storage

/**
 * @type {import('svelte/store').Writable<boolean>}
 */
export const vimStatus = writable(defaultVim);
