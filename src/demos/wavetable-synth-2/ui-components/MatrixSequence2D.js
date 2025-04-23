/**
 * @class MatrixSequence2D
 * A Web Component displaying a 2D grid (matrix) where users can select
 * one vertical position per horizontal segment. Defaults to the bottom grid.
 *
 * @fires change - Dispatched when the selected values change. Detail contains {values: Array<number>}.
 */
export class MatrixSequence2D extends HTMLElement {
  constructor() {
    super();
    // Attach a shadow DOM tree to the instance
    this.attachShadow({ mode: 'open' });

    // --- Configuration ---
    /** @type {number} Number of horizontal segments. */
    this.segments = 16;
    /** @type {number} Number of vertical grid divisions per segment. */
    this.grids = 24;
    /** @type {string} Color for the grid lines. */
    this.gridColor = '#ccc';
    /** @type {string} Color for the highlighted grid cell. */
    this.highlightColor = '#28a745';
    /** @type {string} Background color of the canvas. */
    this.backgroundColor = '#fff';

    // --- State ---
    /**
     * @private
     * @type {Int32Array<number>} Stores the selected vertical grid index
     * for each segment. Defaults to the bottom grid (grids - 1).
     */
    // Initialize values to the bottom grid index (this.grids - 1)
    this._values = new Int32Array(this.segments).fill(-1);
    /**
     * @private
     * @type {boolean} Flag indicating if the user is currently dragging.
     */
    this._isDragging = false;
    /**
     * @private
     * @type {?HTMLCanvasElement} The canvas element.
     */
    this._canvas = null;
    /**
     * @private
     * @type {?CanvasRenderingContext2D} The 2D rendering context.
     */
    this._ctx = null;
    /**
     * @private
     * @type {?ResizeObserver} Observer for handling element resize.
     */
    this._resizeObserver = null;
    /** @private @type {number} The current width of the canvas element in CSS pixels. */
    this._width = 0;
    /** @private @type {number} The current height of the canvas element in CSS pixels. */
    this._height = 0;
    /** @private @type {number} The calculated width of each segment in CSS pixels. */
    this._segmentWidth = 0;
    /** @private @type {number} The calculated height of each grid row in CSS pixels. */
    this._gridHeight = 0;


    // --- Create Elements ---
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');

    // --- Style Shadow DOM ---
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block; /* Ensure the host takes up space */
        width: 100%;
        height: 100%;
      }
      canvas {
        display: block; /* Prevent extra space below canvas */
        width: 100%;
        height: 100%;
        background-color: ${this.backgroundColor};
      }
    `;

    // --- Append to Shadow DOM ---
    this.shadowRoot.append(style, this._canvas);

    // --- Bind methods ---
    // Binding ensures 'this' context is correct when methods are used as event handlers.
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handleResize = this._handleResize.bind(this);
  }

  // --- Lifecycle Callbacks ---
  connectedCallback() {
    // Setup when element is added to the DOM
    if (!this.isConnected) {
      return; // Exit if not connected (might happen in some frameworks)
    }
    this._setupCanvas();
    this._addEventListeners();
    this._draw(); // Initial draw (will now show bottom row selected)

    // Observe resize events to redraw
    this._resizeObserver = new ResizeObserver(this._handleResize);
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    // Cleanup when element is removed from the DOM
    this._removeEventListeners();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  // --- Getters ---
  /**
   * Gets the current array of selected grid values.
   * @returns {Array<number>} A copy of the internal values array.
   */
  get values() {
    // Provide read-only access to the values by returning a copy
    return [...this._values];
  }

  getSequenceData() {
    return this._values;
  }

  // --- Setup ---
  /**
   * @private
   * Sets up the canvas dimensions and scaling for HiDPI displays.
   * Calculates segment and grid dimensions.
   */
  _setupCanvas() {
    if (!this._canvas || !this._ctx) return; // Added check for ctx
    const rect = this.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set canvas internal resolution based on its display size and device pixel ratio
    this._canvas.width = rect.width * devicePixelRatio;
    this._canvas.height = rect.height * devicePixelRatio;

    // Scale the context to ensure drawings match the CSS size
    this._ctx.scale(devicePixelRatio, devicePixelRatio);

    // Store CSS dimensions
    this._width = rect.width;
    this._height = rect.height;

    // Calculate dimensions based on CSS size
    this._segmentWidth = this._width > 0 ? this._width / this.segments : 0;
    this._gridHeight = this._height > 0 ? this._height / this.grids : 0;
  }

  // --- Event Handling ---
  /**
   * @private
   * Adds necessary pointer event listeners.
   */
  _addEventListeners() {
    if (!this._canvas) return;
    this._canvas.addEventListener('pointerdown', this._handlePointerDown);
    this._canvas.addEventListener('pointermove', this._handlePointerMove);
    // Listen on the window for pointerup/cancel to catch cases where the pointer leaves the canvas while pressed.
    window.addEventListener('pointerup', this._handlePointerUp);
    window.addEventListener('pointercancel', this._handlePointerUp);
  }

  /**
   * @private
   * Removes event listeners for cleanup.
   */
  _removeEventListeners() {
    if (!this._canvas) return;
    this._canvas.removeEventListener('pointerdown', this._handlePointerDown);
    this._canvas.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._handlePointerUp);
    window.removeEventListener('pointercancel', this._handlePointerUp);
  }

  /**
   * @private
   * Handles the resize event observed by ResizeObserver.
   */
  _handleResize() {
    // Recalculate dimensions and redraw the canvas.
    this._setupCanvas();
    this._draw();
  }

  /**
   * @private
   * Handles the pointerdown event. Starts dragging and updates the value.
   * @param {PointerEvent} event - The pointer event object.
   */
  _handlePointerDown(event) {
    if (!this._canvas) return;
    this._isDragging = true;
    // Capture the pointer to ensure move/up events are received even if the pointer leaves the element.
    try { // Add try/catch for setPointerCapture as it can fail in edge cases
       this._canvas.setPointerCapture(event.pointerId);
    } catch (e) {
       console.warn('Failed to capture pointer:', e);
    }
    this._updateValueFromEvent(event);
  }

  /**
   * @private
   * Handles the pointermove event. Updates the value if dragging.
   * @param {PointerEvent} event - The pointer event object.
   */
  _handlePointerMove(event) {
    if (!this._isDragging) {
      return;
    }
    this._updateValueFromEvent(event);
  }

  /**
   * @private
   * Handles the pointerup or pointercancel event. Stops dragging.
   * @param {PointerEvent} event - The pointer event object.
   */
  _handlePointerUp(event) {
    if (!this._isDragging || !this._canvas) {
       return; // Avoid redundant updates or errors if not dragging/canvas gone
    }
    this._isDragging = false;
    try { // Add try/catch for releasePointerCapture
      this._canvas.releasePointerCapture(event.pointerId);
    } catch(e) {
      console.warn('Failed to release pointer:', e);
    }
    // Optional: Update one last time on pointer up. Usually not needed as move handles it.
    // this._updateValueFromEvent(event);
  }

  // --- Logic ---
  /**
   * @private
   * Calculates the segment and grid index from pointer coordinates and updates the internal state.
   * Dispatches a 'change' event if a value was modified.
   * @param {PointerEvent} event - The pointer event object.
   */
  _updateValueFromEvent(event) {
    if (!this._canvas || this._segmentWidth <= 0 || this._gridHeight <= 0) {
      return; // Avoid division by zero or errors if dimensions aren't calculated
    }
    const rect = this._canvas.getBoundingClientRect();
    // Calculate coordinates relative to the canvas element's top-left corner (CSS pixels)
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Determine segment and grid indices, clamping values to valid ranges [0, segments-1] and [0, grids-1]
    const segmentIndex = Math.max(0, Math.min(this.segments - 1, Math.floor(x / this._segmentWidth)));
    const gridIndex = Math.max(0, Math.min(this.grids - 1, Math.floor(y / this._gridHeight)));

    // Update the value only if it has changed for the specific segment
    if (this._values[segmentIndex] !== gridIndex) {
      this._values[segmentIndex] = gridIndex;
      this._draw(); // Redraw the canvas to show the change

      // Dispatch a custom event to notify users of the change
      this.dispatchEvent(new CustomEvent('change', {
        detail: { values: this.values } // Pass a copy of the values
      }));
    }
  }

  // --- Drawing ---
  /**
   * @private
   * Clears the canvas and redraws the grid lines and highlighted cells.
   */
  _draw() {
    if (!this._ctx || !this._canvas) return;

    // Use CSS dimensions for clearing and drawing coordinates
    const width = this._width;
    const height = this._height;

    // Clear the canvas (using CSS dimensions)
    this._ctx.clearRect(0, 0, width, height);

    // --- Draw grid lines ---
    this._ctx.strokeStyle = this.gridColor;
    this._ctx.lineWidth = 0.5; // Use thin lines for the grid

    // Vertical lines (segment dividers)
    this._ctx.beginPath(); // Start a new path for all vertical lines
    for (let i = 1; i < this.segments; i++) {
      const x = i * this._segmentWidth;
      this._ctx.moveTo(x, 0);
      this._ctx.lineTo(x, height);
    }
    this._ctx.stroke(); // Draw all vertical lines at once

    // Horizontal lines (grid dividers)
    this._ctx.beginPath(); // Start a new path for all horizontal lines
    for (let j = 1; j < this.grids; j++) {
      const y = j * this._gridHeight;
      this._ctx.moveTo(0, y);
      this._ctx.lineTo(width, y);
    }
    this._ctx.stroke(); // Draw all horizontal lines at once

    // --- Draw highlighted cells ---
    this._ctx.fillStyle = this.highlightColor;
    for (let i = 0; i < this.segments; i++) {
      const selectedGrid = this._values[i];
      // Check if a valid grid (0 to grids-1) is selected for this segment
      if (selectedGrid >= 0 && selectedGrid < this.grids) {
        const x = i * this._segmentWidth;
        const y = selectedGrid * this._gridHeight;
        // Fill the rectangle representing the selected grid cell
        this._ctx.fillRect(x, y, this._segmentWidth, this._gridHeight);
      }
    }
  }
}

// Define the custom element with the new name
customElements.define('matrix-sequence-2d', MatrixSequence2D);