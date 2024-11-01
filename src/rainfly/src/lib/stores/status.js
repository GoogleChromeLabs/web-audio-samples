import {writable} from 'svelte/store';

export const Status = Object.freeze({
  stop: 0,
  play: 1,
  running: 2,
  pause: 3,
});

/**
 * @type {import('svelte/store').Writable<number>}
 */
export const status = writable(Status.stop);
