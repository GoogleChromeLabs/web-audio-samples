/**
 * Represents a custom dropdown element.
 * @extends HTMLElement
 */
export class Dropdown extends HTMLElement {
  /**
   * Creates an instance of Dropdown.
   */
  constructor() {
    super();
    // Create a shadow root
    this.attachShadow({mode: 'open'});
    /** @private {!Object<string, string>} Internal storage for options */
    this._options = {};
    /** @private {?string} Internal storage for selected value */
    this._selectedValue = null;
    /** @private {string} Default placeholder text */
    this._defaultLabel = 'Select an option...';
  }

  /**
   * Called when the element is added to the document's DOM.
   * Renders the component and attaches event listeners.
   */
  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  /**
   * Sets the options for the dropdown.
   * @param {Object<string, string>} data - An object where keys are labels
   * and values are option values.
   */
  set options(data) {
    if (typeof data === 'object' && data !== null) {
      this._options = data;
      // Re-render if options are set after initial connection
      if (this.shadowRoot.querySelector('select')) {
        this.render();
        this.addEventListeners(); // Re-attach listeners after re-render
      }
    } else {
      console.error('Dropdown options must be a valid object.');
    }
  }

  /**
   * Gets the options data.
   * @return {!Object<string, string>}
   */
  get options() {
    return this._options;
  }

  /**
   * Gets the currently selected value.
   * @return {?string} The selected value, or null if the default option is
   * selected.
   */
  get selectedValue() {
    return this._selectedValue;
  }

  /**
   * Renders the dropdown UI inside the shadow DOM.
   * @private
   */
  render() {
    // Clear previous content
    this.shadowRoot.innerHTML = `
      <style>
        /* Basic styling for the select element within the shadow DOM */
        select {
          padding: 0.5rem 1.0rem;
          border: 1px solid #d1d5db; /* Gray border */
          border-radius: 18px; /* Slightly rounded corners */
          font-size: 14px;
          cursor: pointer;
          min-width: 200px; /* Ensure dropdown has some width */
          background-color: white;
          color: #111827; /* Dark text */
          appearance: none; /* Remove default system appearance */
          background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>'); /* Basic dropdown arrow */
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1.2em 1.2em;
          padding-right: 2.5rem; /* Make space for the arrow */
        }
        select:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #4f46e5; /* Indigo border on focus */
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
        }
        /* Style for the placeholder option */
          option[value=""] {
          color: #6b7280; /* Gray text for placeholder */
          }
      </style>
      <select id="dropdown">
        <option value="">${this._defaultLabel}</option>
        ${Object.entries(this._options).map(([label, value]) =>
  // Ensure value attribute is properly quoted
    `<option value="${String(value).replace(/"/g, '&quot;')}">
                ${label}</option>`,
  ).join('')}
      </select>
    `;
  }

  /**
   * Adds the 'change' event listener to the select element.
   * @private
   */
  addEventListeners() {
    const selectElement = this.shadowRoot.getElementById('dropdown');
    if (selectElement) {
      selectElement.addEventListener('change', (event) => {
        // Update internal selected value
        // Use null if the default option is selected, otherwise use the actual
        // value
        this._selectedValue =
            event.target.value === '' ? null : event.target.value;

        // Dispatch a custom 'select' event
        this.dispatchEvent(new CustomEvent('select', {
          detail: {value: this._selectedValue}, // Pass the selected value
          bubbles: true, // Allow event to bubble up
          composed: true, // Allow event to cross shadow DOM boundary
        }));
      });
    }
  }
}

// Register the custom element with the browser
// Note: Custom element names must contain a hyphen
customElements.define('drop-down', Dropdown);
