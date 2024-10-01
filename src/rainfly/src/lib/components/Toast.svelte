<script>
  import {portal} from '$lib/actions/portal.js';

  export let show = false;

  export const handleToggle = (/** @type {boolean} */ state) => show = state;
</script>

<dialog
  class="font-mono text-sm absolute bg-accent bottom-12 cursor-pointer m-0
  ml-auto right-0 rounded shadow-md"
  class:toast-in={show}
  class:toast-out={!show}
  open
  use:portal
>
  <button class="h-full px-4 py-2 w-full" on:click={() => handleToggle(false)}>
    <slot />
  </button>
</dialog>
