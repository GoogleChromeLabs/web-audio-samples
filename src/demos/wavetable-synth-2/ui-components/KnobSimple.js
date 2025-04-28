/**
 * @classdesc KnobSimple
 * A simple SVG-based knob web component.
 */
export class KnobSimple extends HTMLElement {
  /**
   * Creates an instance of KnobSimple.
   * Initializes component state, shadow DOM, and default values.
   */
  constructor() {
    super(); // Always call super first in constructor

    // --- Component State ---
    this._minValue = 0;
    this._maxValue = 100;
    this._defaultValue = 50;
    this._currentValue = 50;
    this._label = 'Knob';
    this._isDragging = false;
    this._initialPointerY = 0; // Used for vertical drag calculation
    this._initialValueOnDrag = 0; // Value when drag started
    this._precision = 3; // Digits after decimal point

    // --- Shadow DOM ---
    this.attachShadow({ mode: 'open' });

    // --- Bind methods ---
    // Ensure 'this' context is correct in event handlers
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handleValueClick = this._handleValueClick.bind(this);
    this._handleValueBlur = this._handleValueBlur.bind(this);
    this._handleValueKeyDown = this._handleValueKeyDown.bind(this);
    // *** UPDATED: Bind the renamed reset handler ***
    this._handleResetClick = this._handleResetClick.bind(this);
  }

  /**
   * Observed attributes for attributeChangedCallback.
   * @return {string[]} An array of attribute names to observe.
   */
  static get observedAttributes() {
    return ['min-value', 'max-value', 'default-value', 'label', 'value'];
  }

  /**
   * Lifecycle callback invoked when the element is added to the DOM.
   * Sets up initial properties, renders the component, and attaches event
   * listeners.
   */
  connectedCallback() {
    this._setupInitialProperties();
    this._render();
    this._attachListeners();
    // Set initial value ensuring it respects min/max from attributes
    this.value = this._currentValue;
  }

  /**
   * Lifecycle callback invoked when the element is removed from the DOM.
   * Removes event listeners to prevent memory leaks.
   */
  disconnectedCallback() {
    this._removeListeners();
  }

  /**
   * Lifecycle callback invoked when one of the observed attributes changes.
   * Updates the corresponding internal property and potentially re-renders.
   * @param {string} name - The name of the attribute that changed.
   * @param {string} oldValue - The previous value of the attribute.
   * @param {string} newValue - The new value of the attribute.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return; // No change

    switch (name) {
      case 'min-value':
        this._minValue = parseFloat(newValue ?? 0);
        // Re-clamp current value if necessary
        this.value = this._currentValue;
        break;
      case 'max-value':
        this._maxValue = parseFloat(newValue ?? 100);
        // Re-clamp current value if necessary
        this.value = this._currentValue;
        break;
      case 'default-value':
        this._defaultValue = this._clamp(
          parseFloat(newValue ?? this._minValue)
        );
        // Don't automatically reset to default on attribute change,
        // only update the potential reset value.
        break;
      case 'label':
        this._label = newValue ?? 'Knob';
        if (this.shadowRoot.querySelector('.knob-label')) {
          this.shadowRoot.querySelector('.knob-label').textContent =
            this._label;
        }
        break;
      case 'value':
        // Update internal value if changed externally via attribute
        this.value = parseFloat(newValue);
        break;
    }
    // Update ARIA attributes if min/max changed
    if (name === 'min-value' || name === 'max-value') {
      this._updateAriaAttributes();
    }
  }

  // --- Getters and Setters ---

  /**
   * Gets the current value of the knob.
   * @return {number} The current value.
   */
  get value() {
    return this._currentValue;
  }

  /**
   * Sets the current value of the knob.
   * Clamps the value within min/max range, updates the display and visuals.
   * @param {number} newValue - The desired new value.
   */
  set value(newValue) {
    const numericValue = parseFloat(newValue);
    if (isNaN(numericValue)) {
      // console.warn('KnobSimple: Invalid value provided.', newValue);
      // Revert to the current value if the input is not a valid number
      this._updateValueDisplay();
      return;
    }

    const clampedValue = this._clamp(numericValue);
    if (this._currentValue !== clampedValue) {
      this._currentValue = clampedValue;
      // Reflect value attribute
      this.setAttribute('value', this._currentValue.toFixed(this._precision));
      this._updateValueDisplay();
      this._updateKnobVisuals();
      this._updateAriaAttributes(); // Update aria-valuenow
    } else {
      // If the value didn't change after clamping (e.g., trying to set 110
      // when max is 100), still ensure the display shows the correctly
      // clamped value.
      this._updateValueDisplay();
    }
  }

  get minValue() {
    return this._minValue;
  }
  set minValue(val) {
    this.setAttribute('min-value', val);
  }

  get maxValue() {
    return this._maxValue;
  }
  set maxValue(val) {
    this.setAttribute('max-value', val);
  }

  get defaultValue() {
    return this._defaultValue;
  }
  set defaultValue(val) {
    this.setAttribute('default-value', val);
  }

  get label() {
    return this._label;
  }
  set label(val) {
    this.setAttribute('label', val);
  }

  // --- Private Methods ---

  /**
   * Sets up initial properties based on attributes or defaults.
   * @private
   */
  _setupInitialProperties() {
    this._minValue = parseFloat(
      this.getAttribute('min-value') ?? this._minValue
    );
    this._maxValue = parseFloat(
      this.getAttribute('max-value') ?? this._maxValue
    );
    // Default value must be clamped between min and max
    this._defaultValue = this._clamp(
      parseFloat(this.getAttribute('default-value') ?? this._minValue)
    );
    // Initial current value is the default value
    this._currentValue = this._defaultValue;
    this._label = this.getAttribute('label') ?? this._label;

    // Ensure max is greater than min
    if (this._maxValue <= this._minValue) {
      console.warn(
        `KnobSimple: max-value must be greater than min-value. ` +
          `Adjusting max-value.`
      );
      this._maxValue = this._minValue + 1;
      this.setAttribute('max-value', this._maxValue);
    }
    // Set initial value attribute
    if (!this.hasAttribute('value')) {
      this.setAttribute('value', this._currentValue.toFixed(this._precision));
    } else {
      // If value attribute exists, respect it but clamp it
      this.value = parseFloat(this.getAttribute('value'));
    }
  }

  /**
   * Clamps a value between the minimum and maximum allowed values.
   * @param {number} value - The value to clamp.
   * @return {number} The clamped value.
   * @private
   */
  _clamp(value) {
    return Math.min(this._maxValue, Math.max(this._minValue, value));
  }

  /**
   * Converts the current knob value to an angle for the tick mark.
   * Maps the value range [min, max] to an angle range [startAngle, endAngle].
   * @return {number} The angle in degrees.
   * @private
   */
  _valueToAngle() {
    const valueRange = this._maxValue - this._minValue;
    // Handle division by zero if min === max (though prevented in setup)
    if (valueRange === 0) return -135; // Start angle

    const valueFraction = (this._currentValue - this._minValue) / valueRange;
    const angleRange = 270; // e.g., from -135 degrees to +135 degrees
    const startAngle = -135;
    return valueFraction * angleRange + startAngle;
  }

  /**
   * Renders the initial HTML structure and styles into the shadow DOM.
   * @private
   */
  _render() {
    // --- Constants for SVG ---
    const svgSize = 100; // Viewbox size
    const center = svgSize / 2;
    const radius = svgSize * 0.4; // Knob radius
    const tickLength = radius * 0.3; // Length of the tick mark from the edge

    // Calculate the start and end points for the tick line
    // Y-coordinate on the circle's edge
    const tickOuterY = center - radius;
    // Y-coordinate towards the center
    const tickInnerY = center - radius + tickLength;

    this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: inline-flex; /* Allow setting width/height */
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        width: 100%; /* Take up container width */
        height: 100%; /* Take up container height */
        cursor: ns-resize; /* Indicate vertical drag */
        user-select: none; /* Prevent text selection during drag */
        touch-action: none; /* Prevent scrolling on touch devices */
        --knob-bg-color: #4f565e;
        --knob-fg-color: #8a9199;
        --knob-tick-color: #00a1ff;
        --knob-label-color: #d1d5db;
        --knob-value-color: #d1d5db;
        --knob-value-edit-bg: #fff;
      }
      .knob-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; /* Center items vertically */
        width: 100%;
        height: 100%;
        padding: 5px;
        box-sizing: border-box;
      }
      .knob-label {
        font-size: 14px;
        color: var(--knob-label-color);
        margin-bottom: 5px;
        text-align: center;
        white-space: nowrap; /* Prevent label wrapping */
      }
      .knob-svg-container {
        width: 70%; /* Control SVG size relative to host */
        /* Maintain aspect ratio */
        aspect-ratio: 1 / 1;
        margin-bottom: 5px;
      }
      svg {
        display: block; /* Remove extra space below SVG */
        width: 100%;
        height: 100%;
        overflow: visible; /* Allow tick to potentially go slightly outside */
      }
      .knob-circle {
        fill: var(--knob-bg-color);
        stroke: var(--knob-fg-color);
        stroke-width: 3;
      }
      .knob-tick {
        stroke: var(--knob-tick-color);
        stroke-width: 9; /* Make tick thicker */
        stroke-linecap: rounded; /* Rounded ends for the tick */
      }
      .knob-value {
        font-size: 14px;
        color: var(--knob-value-color);
        text-align: center;
        min-width: 4ch; /* Minimum width to prevent layout shifts */
        padding: 2px 4px;
        border-radius: 3px;
        cursor: text; /* Indicate text is editable */
        border: 1px solid transparent; /* Placeholder for focus */
      }
      .knob-value:focus {
        outline: none;
        background-color: var(--knob-value-edit-bg);
        border: 1px solid var(--knob-fg-color);
        box-shadow: 0 0 2px rgba(0,0,0,0.3);
      }
    </style>
    <div class="knob-container" part="container">
      <div class="knob-label" part="label">${this._label}</div>
      <div class="knob-svg-container" part="svg-container">
      <svg viewBox="0 0 ${svgSize} ${svgSize}" role="slider"
          aria-orientation="vertical" aria-label="${this._label}"
          aria-valuemin="${this._minValue}"
          aria-valuemax="${this._maxValue}"
          aria-valuenow="${this._currentValue}">
        <circle class="knob-circle"
            cx="${center}" cy="${center}" r="${radius}" part="circle"/>
        <line class="knob-tick"
            x1="${center}" y1="${tickOuterY}"
            x2="${center}" y2="${tickInnerY}"
            transform="rotate(0 ${center} ${center})" part="tick"/>
            </svg>
      </div>
      <div class="knob-value" part="value"
          contenteditable="false" inputmode="decimal">
      ${this._currentValue.toFixed(this._precision)}
      </div>
    </div>
    `;

    // --- Get references to dynamic elements ---
    this._svgElement = this.shadowRoot.querySelector('svg');
    this._tickElement = this.shadowRoot.querySelector('.knob-tick');
    this._valueElement = this.shadowRoot.querySelector('.knob-value');
    this._labelElement = this.shadowRoot.querySelector('.knob-label');

    // Initial update
    this._updateKnobVisuals();
    this._updateValueDisplay();
    this._updateAriaAttributes();
  }

  /**
   * Attaches necessary event listeners to the component and window.
   * @private
   */
  _attachListeners() {
    // Use pointer events for unified mouse/touch
    const svgContainer = this.shadowRoot.querySelector('.knob-svg-container');
    svgContainer.addEventListener('pointerdown', this._handlePointerDown);
    // For Meta/Cmd+Click reset
    svgContainer.addEventListener('click', this._handleResetClick);
    this._valueElement.addEventListener('click', this._handleValueClick);
    this._valueElement.addEventListener('keydown', this._handleValueKeyDown);
    this._valueElement.addEventListener('blur', this._handleValueBlur);

    // Drag move/end listeners are added to the window during drag
  }

  /**
   * Removes event listeners attached during connectedCallback.
   * @private
   */
  _removeListeners() {
    // Remove listeners attached to the component itself
    const svgContainer = this.shadowRoot.querySelector('.knob-svg-container');
    if (svgContainer) {
      svgContainer.removeEventListener('pointerdown', this._handlePointerDown);
      // *** UPDATED: Remove the renamed reset handler ***
      svgContainer.removeEventListener('click', this._handleResetClick);
    }
    if (this._valueElement) {
      this._valueElement.removeEventListener('click', this._handleValueClick);
      this._valueElement.removeEventListener(
        'keydown',
        this._handleValueKeyDown
      );
      this._valueElement.removeEventListener('blur', this._handleValueBlur);
    }

    // Ensure window listeners are removed if component is removed mid-drag
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._handlePointerUp);
    window.removeEventListener('pointercancel', this._handlePointerUp);
  }

  /**
   * Handles the pointerdown event on the knob SVG area to initiate dragging.
   * @param {PointerEvent} event - The pointer event object.
   * @private
   */
  _handlePointerDown(event) {
    // Only react to main button (left-click/touch)
    if (event.button !== 0) return;

    // Prevent drag initiation if Meta/Cmd key is pressed (allow reset click
    // through). Check for metaKey
    if (event.metaKey) return;

    this._isDragging = true;
    // Use clientY for vertical dragging sensitivity
    this._initialPointerY = event.clientY;
    this._initialValueOnDrag = this._currentValue;

    // Capture pointer events on the window to track movement outside
    // the element
    window.addEventListener('pointermove', this._handlePointerMove);
    window.addEventListener('pointerup', this._handlePointerUp);
    window.addEventListener('pointercancel', this._handlePointerUp);

    this.style.cursor = 'grabbing'; // Change cursor during drag
    event.preventDefault(); // Prevent default actions like text selection
    event.stopPropagation();
  }

  /**
   * Handles the pointermove event during dragging to update the knob value.
   * Calculates value change based on vertical distance dragged.
   * @param {PointerEvent} event - The pointer event object.
   * @private
   */
  _handlePointerMove(event) {
    if (!this._isDragging) return;

    const currentY = event.clientY;
    // Positive deltaY for upward movement
    const deltaY = this._initialPointerY - currentY;

    // --- Sensitivity Adjustment ---
    // Determine how many pixels of vertical drag correspond to the full
    // value range. A smaller number means higher sensitivity. Adjust as needed.
    const pixelsPerFullRange = 200; // e.g., 200px drag covers min to max
    const valueRange = this._maxValue - this._minValue;

    // Calculate the change in value based on the drag distance
    // Avoid division by zero if range is 0
    const valueChange =
      valueRange === 0 ? 0 : (deltaY / pixelsPerFullRange) * valueRange;

    // Update the value based on the initial value + change
    this.value = this._initialValueOnDrag + valueChange;

    // Optional: Dispatch an 'input' event for real-time feedback during drag
    this.dispatchEvent(
      new CustomEvent('input', { detail: { value: this._currentValue } })
    );

    event.preventDefault();
  }

  /**
   * Handles the pointerup or pointercancel event to end dragging.
   * Finalizes the value and dispatches a 'change' event.
   * @param {PointerEvent} event - The pointer event object.
   * @private
   */
  _handlePointerUp(event) {
    if (!this._isDragging) return;

    this._isDragging = false;

    // Remove window listeners
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._handlePointerUp);
    window.removeEventListener('pointercancel', this._handlePointerUp);

    this.style.cursor = 'ns-resize'; // Restore cursor

    // Dispatch a 'change' event when dragging stops
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this._currentValue },
        bubbles: true, // Allow event to bubble up
        composed: true, // Allow event to cross shadow DOM boundary
      })
    );

    event.preventDefault();
  }

  /**
   * *** RENAMED and UPDATED Method ***
   * Handles the click event on the knob SVG area for Meta/Cmd+Click reset.
   * @param {MouseEvent} event - The mouse event object.
   * @private
   */
  _handleResetClick(event) {
    // Don't reset if it was part of a drag sequence that just ended
    // (A quick click might register before _isDragging is fully false
    // sometimes)
    if (this._isDragging) return;

    // *** UPDATED: Check for metaKey instead of ctrlKey ***
    if (event.metaKey) {
      // Prevent default browser actions (like context menu on some OS)
      event.preventDefault();
      // Prevent click from bubbling further
      event.stopPropagation();
      if (this.value !== this._defaultValue) {
        this.value = this._defaultValue;
        // Dispatch change event after reset
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: this._currentValue },
            bubbles: true,
            composed: true,
          })
        );
      }
    }
    // Regular click without Meta/Cmd doesn't do anything on the SVG itself
  }

  /**
   * Handles the click event on the value display element.
   * Makes the element editable and selects its content.
   * @param {MouseEvent} event - The mouse event object.
   * @private
   */
  _handleValueClick(event) {
    // Prevent click from propagating to SVG if value is clicked
    event.stopPropagation();

    // Make editable and select text
    this._valueElement.contentEditable = 'true';
    this._valueElement.focus();
    // Select all text inside the contentEditable element
    const range = document.createRange();
    range.selectNodeContents(this._valueElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Handles the blur event (losing focus) on the value display element.
   * Reverts the display to the current formatted value if editing is cancelled.
   * @private
   */
  _handleValueBlur() {
    // If blurred, revert to the last valid value and make non-editable
    this._valueElement.contentEditable = 'false';
    // Ensure display matches the actual internal value after blur
    this._updateValueDisplay();
  }

  /**
   * Handles the keydown event on the value display element when it's editable.
   * Listens for 'Enter' to confirm the new value or 'Escape' to cancel.
   * @param {KeyboardEvent} event - The keyboard event object.
   * @private
   */
  _handleValueKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent adding newline
      const inputText = this._valueElement.textContent;
      const newValue = parseFloat(inputText);

      if (!isNaN(newValue)) {
        // Update the actual value (setter handles clamping and updates)
        this.value = newValue;
        // Dispatch change event after text input confirmation
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: this._currentValue },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        // If input is invalid, revert display to current value
        this._updateValueDisplay();
      }
      this._valueElement.blur(); // Remove focus after Enter
    } else if (event.key === 'Escape') {
      // Cancel editing, revert display, and remove focus
      this._updateValueDisplay();
      this._valueElement.blur();
    }
    // Allow other keys (numbers, backspace, delete, arrows, '.')
  }

  /**
   * Updates the rotation of the knob's tick mark based on the current value.
   * @private
   */
  _updateKnobVisuals() {
    if (!this._tickElement) return; // Not rendered yet

    const angle = this._valueToAngle();
    const svgSize = 100; // Must match viewBox
    const center = svgSize / 2;
    this._tickElement.setAttribute(
      'transform',
      `rotate(${angle} ${center} ${center})`
    );
  }

  /**
   * Updates the text content of the value display element.
   * Formats the number to the fixed precision.
   * @private
   */
  _updateValueDisplay() {
    if (!this._valueElement) return; // Not rendered yet
    // Only update text if not currently being edited to avoid disrupting
    // user input
    if (this._valueElement.contentEditable !== 'true') {
      this._valueElement.textContent = this._currentValue.toFixed(
        this._precision
      );
    }
  }

  /**
   * Updates ARIA attributes based on the current state.
   * @private
   */
  _updateAriaAttributes() {
    if (!this._svgElement) return; // Not rendered yet
    this._svgElement.setAttribute('aria-valuemin', this._minValue);
    this._svgElement.setAttribute('aria-valuemax', this._maxValue);
    this._svgElement.setAttribute(
      'aria-valuenow',
      this._currentValue.toFixed(this._precision)
    );
    // Update label if it changes dynamically (though less common for
    // aria-label)
    if (
      this._labelElement &&
      this._svgElement.getAttribute('aria-label') !== this._label
    ) {
      this._svgElement.setAttribute('aria-label', this._label);
    }
  }
}

// Define the custom element
customElements.define('knob-simple', KnobSimple);
