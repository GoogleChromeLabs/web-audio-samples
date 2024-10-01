<script>
  import ActionButton from './ActionButton.svelte';
  import {onMount} from 'svelte';
  import {getRecordedSamples} from '$lib/utils/audio-host.js';
  import {status, Status} from '$lib/stores/status';

  /** @type {HTMLCanvasElement} */
  let canvas;
  /** @type {CanvasRenderingContext2D | null} */
  let context;
  /** @type {number} */
  let RATIO;
  /** @type {number} */
  const BAR_THRESHOLD = 250;
  const ACCENT_COLOR = '#FD9494';
  const PRIMARY_COLOR = '#76B359';

  const MAX_ZOOM = 1000;
  const MIN_SAMPLES = 25;
  let zoom = 0;
  const slice = {
    start: 0,
    end: Infinity,
    full: true,
  };

  $: {
    if ($status === Status.play || $status === Status.running) {
      console.log($status);
      draw();
    } else if ($status === Status.stop) {
      clearCanvas();
    }
  }

  onMount(() => {
    RATIO = window.devicePixelRatio || 1;
    context = canvas.getContext('2d');
    resizeCanvas();
  });

  /**
   * Draw the visualizer
   */
  function draw() {
    if (context === null) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // visualizer width and height
    const width = canvas.width;
    const height = canvas.height;
    const padding = 0.8;

    drawAxis(width, height, padding);

    const samples = getRecordedSamples();
    slice.full && (slice.end = samples[0]?.length || Infinity);
    const displaySamples = samples[0]?.slice(slice.start, slice.end) || [];

    // visualize the samples
    if (displaySamples.length > BAR_THRESHOLD) {
      // display whole sine wav
      const size = displaySamples.length;

      // const downsampleHop = Math.floor(size / width / 10);
      const downsampleHop = 1;

      const increment = width / (size / downsampleHop);
      context.beginPath();
      context.moveTo(0, height / 2);

      let i = 0;
      for (let x = 0; x < width; x += increment, i += downsampleHop) {
        context.lineTo(x,
            height / 2 - (displaySamples[i] * height / 2 * padding));
      }
      context.strokeStyle = PRIMARY_COLOR;
      // stroke thickness
      context.lineWidth = 1.5 * RATIO;
      context.stroke();
      context.closePath();
    } else {
      // display sin wave as bars like audacity
      const size = displaySamples.length;

      // const downsampleHop = Math.floor(size / width / 10);
      const downsampleHop = 1;

      const increment = width / (size / downsampleHop);

      let i = 0;
      context.beginPath();
      for (let x = 0; x < width; x += increment, i += downsampleHop) {
        context.moveTo(x, height / 2);
        context.lineTo(x,
            height / 2 - (displaySamples[i] * height / 2 * padding));
      }
      context.strokeStyle = PRIMARY_COLOR;
      // stroke thickness
      context.lineWidth = 1.5 * RATIO;
      context.stroke();
      context.closePath();

      // draw a little square at top of each bar
      i = 0;
      const squareSize = 4 * RATIO;
      for (let x = 0; x < width; x += increment, i += downsampleHop) {
        context.fillStyle = PRIMARY_COLOR;
        context.fillRect(x - squareSize / 2,
            height / 2 - (displaySamples[i] * height / 2 * padding) -
                squareSize / 2,
            squareSize,
            squareSize);
      }
    }

    // Request animation frame
    if ($status === Status.play || $status === Status.running) {
      requestAnimationFrame(draw);
    }
  }

  /**
   * Draw the visualizer axes
   * @param {number} width - canvas width
   * @param {number} height - canvas height
   * @param {number} padding - axes padding
   */
  function drawAxis(width, height, padding) {
    if (context === null) return;
    // draw x-axis
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.strokeStyle = ACCENT_COLOR;
    context.lineWidth = 1 * RATIO;
    context.stroke();
    context.closePath();

    // draw dotted lines
    context.beginPath();
    context.setLineDash([5, 15]);
    context.moveTo(0, height / 2 + (height / 2 * padding));
    context.lineTo(width, height / 2 + (height / 2 * padding));
    context.strokeStyle = ACCENT_COLOR;
    context.stroke();
    context.closePath();

    context.beginPath();
    context.setLineDash([5, 15]);
    context.moveTo(0, height / 2 - (height / 2 * padding));
    context.lineTo(width, height / 2 - (height / 2 * padding));
    context.strokeStyle = ACCENT_COLOR;
    context.stroke();
    context.closePath();

    // reset line dash
    context.setLineDash([]);
  }

  /**
   * Clear the canvas and draw the axes
   */
  function clearCanvas() {
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawAxis(canvas.width, canvas.height, 0.8);
  }

  /**
   * Resize the visualizer canvas
   */
  function resizeCanvas() {
    const width = canvas.clientWidth * RATIO;
    const height = canvas.clientHeight * RATIO;
    canvas.width = width;
    canvas.height = height;
    draw();
  }

  const handleWheel = (/** @type {WheelEvent} */ event) => {
    const samples = getRecordedSamples();
    if (samples && samples[0].length === 0) return;

    zoom = Math.max(0, Math.min(zoom + event.deltaY, MAX_ZOOM));
    slice.full = zoom === 0;
    const max = getRecordedSamples()[0].length;
    const position = event.clientX / window.innerWidth *
        (slice.end - slice.start) + slice.start;
    const radius = (max - MIN_SAMPLES) / MAX_ZOOM * (MAX_ZOOM - zoom) +
        MIN_SAMPLES;
    slice.start = Math.max(0, position - radius);
    slice.end = Math.min(max, position + radius);

    draw();
  };
</script>

<svelte:window on:resize={resizeCanvas} />

<section>
  <canvas id="visualizer" bind:this={canvas}
      on:wheel|preventDefault={handleWheel}>
  </canvas>
  <div id="action-buttons">
    <ActionButton />
  </div>
</section>

<style lang="postcss">
  section {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  canvas {
    width: 100%;
    height: 100%;
    background-color: #fefefe;
  }

  #action-buttons {
    position: absolute;
    bottom: .5rem;
    left: .5rem;
  }
</style>
