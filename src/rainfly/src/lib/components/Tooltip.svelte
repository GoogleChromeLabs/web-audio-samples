<script>
  import {onMount, tick} from 'svelte';
  import {portal} from '$lib/actions/portal.js';

  /** @type {HTMLButtonElement} */
  export let anchor;
  /** @type {HTMLDivElement} */
  let popover;
  /** @type {DOMRect} */
  let dimensions;

  let show = false;

  /** @type {number} */
  let rem;
  /** @type {{width: number, height: number}} */
  let viewport;
  const position = {
    left: -1,
    top: -1,
  };

  const handleMouseover = () => {
    if (show) return;

    show = true;
    popover.showPopover();
    dimensions = popover.getBoundingClientRect();

    const outside = {
      top: anchor.offsetTop - dimensions.height - 0.5 * rem < 0,
      right: anchor.offsetLeft + dimensions.width + 0.5 * rem > viewport.width,
      bottom:
        anchor.offsetTop + dimensions.height + 0.5 * rem > viewport.height,
      left: anchor.offsetLeft - dimensions.width - 0.5 * rem < 0,
    };

    position.top = anchor.offsetTop - 0.5 * rem;
    position.left = anchor.offsetLeft - 0.5 * rem;

    if (outside.top) {
      position.top = anchor.offsetTop + dimensions.height + 0.5 * rem;
    }
    if (outside.right) {
      position.left = anchor.offsetLeft - dimensions.width - 0.5 * rem;
    }
    if (outside.bottom) {
      position.top = anchor.offsetTop - dimensions.height - 0.5 * rem;
    }
    if (outside.left) {
      position.left = anchor.offsetLeft + dimensions.width + 0.5 * rem;
    }
  };

  const handleMouseleave = () => {
    show = false;
    setTimeout(() => popover.hidePopover(), 50);
  };

  onMount(() => {
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    (async () => {
      await tick();
      anchor.addEventListener('mouseover', handleMouseover);
      anchor.addEventListener('mouseleave', handleMouseleave);
    })();
    return () => {
      anchor.removeEventListener('mouseover', handleMouseover);
      anchor.removeEventListener('mouseleave', handleMouseleave);
    };
  });
</script>

<div
  bind:this={popover}
  class="absolute bg-accent m-0 px-2 py-1 rounded shadow-md text-sm"
  class:tooltip-in={show}
  class:tooltip-out={!show}
  popover="manual"
  style:left="{position.left}px"
  style:top="{position.top}px"
  use:portal
>
  <slot />
</div>

