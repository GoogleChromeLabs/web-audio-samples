/**
 * @class ToggleSimple
 * @classdesc A simple two-state toggle button Web Component using SVG.
 *
 * @attr {boolean} [initial-state=false] - The default state of the toggle (true=on, false=off).
 * @attr {string} [label='Toggle'] - The text label displayed next to the toggle.
 */
export class ToggleSimple extends HTMLElement {
  /**
   * Internal state of the toggle.
   * @private
   * @type {boolean}
   */
  _state = false;

  /**
   * Reference to the SVG circle element for the LED.
   * @private
   * @type {SVGCircleElement|null}
   */
  _ledElement = null;

  /**
   * Reference to the span element for the label.
   * @private
   * @type {HTMLSpanElement|null}
   */
  _labelElement = null;

  constructor() {
    super(); // Always call super first in constructor

    // Attach a shadow root to the element.
    this.attachShadow({ mode: 'open' });

    // Bind methods to ensure 'this' context is correct
    this._toggleState = this._toggleState.bind(this);
  }

  /**
   * Defines which attributes should be observed for changes.
   * @returns {string[]} An array of attribute names.
   */
  static get observedAttributes() {
    return ['initial-state', 'label'];
  }

  /**
   * Called when the element is added to the document's DOM.
   * Handles initial setup, reading attributes, and rendering.
   */
  connectedCallback() {
    // Read initial attributes
    const initialStateAttr = this.getAttribute('initial-state');
    // Coerce attribute string ('true'/'false'/null) to boolean
    this._state = initialStateAttr === 'true';
    const labelAttr = this.getAttribute('label') || 'Toggle'; // Default label

    this._render(labelAttr);

    // Add click listener to the component itself
    this.addEventListener('click', this._toggleState);
  }

  /**
   * Called when the element is removed from the document's DOM.
   * Cleans up event listeners.
   */
  disconnectedCallback() {
    this.removeEventListener('click', this._toggleState);
  }

  /**
   * Called when an observed attribute has been added, removed, or changed.
   * @param {string} name The name of the attribute that changed.
   * @param {string|null} oldValue The previous value of the attribute.
   * @param {string|null} newValue The new value of the attribute.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return; // No change
    }

    switch (name) {
      case 'initial-state':
        // Note: This primarily sets the *initial* state.
        // If changed dynamically *after* initial render,
        // we might want to update the internal state here too.
        // For simplicity, we'll assume it's mainly for setup.
        // If dynamic updates are needed, uncomment the next line:
        // this.setState(newValue === 'true');
        break;
      case 'label':
        if (this._labelElement) {
          this._labelElement.textContent = newValue || 'Toggle';
        }
        break;
    }
  }

  /**
   * Renders the component's shadow DOM structure and styles.
   * @param {string} labelText The text for the label.
   * @private
   */
  _render(labelText) {
    // Clear previous content if any (though usually called only once in connectedCallback)
    this.shadowRoot.innerHTML = '';

    // Create style element
    const style = document.createElement('style');
    style.textContent = `
      :host {
        /* Style the component host element */
        display: inline-flex; /* Align items inline */
        align-items: center; /* Center items vertically */
        padding: 8px 12px !important; /* Add some padding */
        border: 1px solid #ccc; /* Subtle border */
        border-radius: 18px; /* Rounded corners */
        cursor: pointer; /* Indicate interactivity */
        user-select: none; /* Prevent text selection */
        transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; /* Smooth transitions */
        width: 120px; /* Fixed width container */
        box-sizing: border-box; /* Include padding and border in width */
        overflow: hidden; /* Prevent content overflow */
        background-color: #8a9199; /* Light background */
      }

      :host(:hover) {
        border-color: #aaa; /* Darker border on hover */
        background-color: #d1d5db; /* Slightly darker background on hover */
      }

      /* Style the SVG container */
      .led-svg {
        width: 16px; /* Fixed size for the SVG */
        height: 16px;
        margin-right: 8px; /* Space between LED and label */
        flex-shrink: 0; /* Prevent SVG from shrinking */
      }

      /* Style the LED circle */
      .led-circle {
        cx: 8; /* Center X */
        cy: 8; /* Center Y */
        r: 6;  /* Radius */
        stroke: #4f565e; /* Grey border */
        stroke-width: 1.5;
        fill: #4f565e; /* Default off color (light grey) */
        transition: fill 0.2s ease-in-out; /* Smooth color transition */
      }

      /* Style for the 'on' state */
      :host([data-state='true']) .led-circle {
        fill: #a0ff1a; 
        stroke: #a0ff1a;
      }
      :host([data-state='true']) {
        border-color: #a0ff1a; /* Lighter green border for host when on */
      }

      /* Style the label text */
      .label {
        font-size: 14px;
        color: #333;
        white-space: nowrap; /* Prevent label wrapping */
        overflow: hidden; /* Hide overflow */
        text-overflow: ellipsis; /* Add ellipsis if text is too long */
        flex-grow: 1; /* Allow label to take remaining space */
      }
    `;

    // Create SVG element for the LED
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'led-svg');
    svg.setAttribute('viewBox', '0 0 16 16'); // ViewBox for scaling

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'led-circle');
    this._ledElement = circle; // Store reference
    svg.appendChild(circle);

    // Create span for the label
    const label = document.createElement('span');
    label.setAttribute('class', 'label');
    label.textContent = labelText;
    this._labelElement = label; // Store reference

    // Append elements to shadow root
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(svg);
    this.shadowRoot.appendChild(label);

    // Set initial visual state
    this._updateVisuals();
  }

  /**
   * Toggles the internal state and updates the visual representation.
   * @private
   */
  _toggleState() {
    this._state = !this._state;
    this._updateVisuals();

    // Optional: Dispatch a custom event when state changes
    this.dispatchEvent(new CustomEvent('change', {
      detail: { state: this._state },
      bubbles: true, // Allow event to bubble up
      composed: true // Allow event to cross shadow DOM boundary
    }));
  }

  /**
   * Updates the visual appearance based on the current state.
   * Reflects state to a host attribute for easier CSS styling.
   * @private
   */
  _updateVisuals() {
    if (this._state) {
    this.setAttribute('data-state', 'true');
    } else {
    this.setAttribute('data-state', 'false');
    // Or use: this.removeAttribute('data-state'); if false is the default absence
    }
    // The actual color change is handled by CSS using the [data-state] selector
  }

  /**
  * Public method to programmatically set the state.
  * @param {boolean} newState The desired state (true=on, false=off).
  */
  setState(newState) {
    const booleanState = Boolean(newState); // Ensure it's a boolean
    if (this._state !== booleanState) {
    this._state = booleanState;
    this._updateVisuals();
    // Optionally dispatch change event here too if needed for programmatic changes
    }
  }

  /**
   * Public getter for the current state.
   * @returns {boolean} The current state.
   */
  get state() {
    return this._state;
  }

  get label() {
    return this._labelElement.textContent;
  }
}

// Define the new custom element
customElements.define('toggle-simple', ToggleSimple);