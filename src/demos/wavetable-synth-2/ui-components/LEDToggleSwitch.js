/**
 * Represents a reusable LED Toggle Switch Web Component.
 *
 * Attributes:
 * - label: The text label displayed next to the LED.
 * - checked: Boolean attribute (presence indicates true) for the
 *   initial/current state.
 *
 * Events:
 * - togglechange: Fired when the state changes, detail contains { isActive:
 *   boolean }.
 */
export class LEDToggleSwitch extends HTMLElement {
  // Define which attributes should trigger attributeChangedCallback
  static get observedAttributes() {
      return ['checked', 'label'];
  }

  constructor() {
    super(); // Always call super first in constructor

    // Create Shadow DOM
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._isActive = this.hasAttribute('checked');

    // Bind methods
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  // Called when the element is added to the document's DOM
  connectedCallback() {
    this._render();
    this._attachListeners();
    this._updateVisualState(); // Ensure initial state is reflected
    // Make component focusable and set initial ARIA
    this.setAttribute('role', 'switch');
    this.setAttribute('aria-checked', this._isActive.toString());
    if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
    }
  }

  // Called when the element is removed from the document's DOM
  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
    this.removeEventListener('keydown', this._handleKeydown);
  }

  // Called when an observed attribute changes
  attributeChangedCallback(name, oldValue, newValue) {  
    switch (name) {
      case 'checked':
        // Update internal state if attribute changes programmatically
        const newState = this.hasAttribute('checked');
        if (this._isActive !== newState) {
          // Update state without firing event again if needed
          this.setState(newState, false); 
        }
        break;
      case 'label':
        // Update the label text if the shadow root exists
        if (this.shadowRoot) {
          const labelElement = this.shadowRoot.querySelector('.led-label');
          if (labelElement) {
            // Use new value or empty string
            labelElement.textContent = newValue || ''; 
          }
        }
        break;
    }
  }

  /** Renders the component's HTML structure and styles into the Shadow DOM */
  _render() {
    const labelText = this.getAttribute('label') || 'Toggle';
    this.shadowRoot.innerHTML = `
        <style>
            /* :host refers to the custom element itself */
            :host {
                display: inline-flex; /* Use inline-flex for better inline behavior */
                flex-direction: row;
                align-items: center;
                padding: 8px 8px;
                background-color: #e0e0e0;
                border-radius: 4px;
                box-shadow: 1px 1px 2px #bebebe, -1px -1px 2px #ffffff;
                cursor: pointer;
                user-select: none;
                transition: box-shadow 0.2s ease-in-out;
                /* Make host focusable visually */
                outline-offset: 1px;
            }
              /* Style when the host element itself has the .active class */
            :host(.active) {
                  box-shadow: inset 1px 1px 2px #bebebe, inset -1px -1px 2px #ffffff;
            }
              /* Focus style for accessibility */
              :host(:focus-visible) {
                  outline: 2px solid dodgerblue;
              }


            /* --- LED indicator --- */
            .led-light {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                transition: background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                pointer-events: none;
                flex-shrink: 0;
                /* Off state */
                background-color: #555;
                border: 1px solid #333;
                box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
            }

            /* --- LED On state --- */
            /* Style based on the host's .active class */
            :host(.active) .led-light {
                background-color: #DAA520; /* Goldenrod */
                border-color: #B8860B; /* DarkGoldenrod */
                box-shadow: 0 0 4px #DAA520, /* Reduced inner glow */
                            0 0 8px #FFBF00, /* Reduced outer glow */
                            inset 0 0 4px rgba(255, 223, 186, 0.6);
            }

            /* --- Label --- */
            .led-label {
                margin-left: 8px;
                font-size: 13px;
                color: #333;
                pointer-events: none;
            }
        </style>
        <div class="led-light" part="led"></div>
        <span class="led-label" part="label">${labelText}</span>
    `;
    }

  /** Attaches event listeners to the host element */
  _attachListeners() {
    this.addEventListener('click', this._handleClick);
    this.addEventListener('keydown', this._handleKeydown);
  }

  /** Updates the visual state (active class) based on internal state */
  _updateVisualState() {
    this.classList.toggle('active', this._isActive);
    this.setAttribute('aria-checked', this._isActive.toString());
  }

  /** Handles click events */
  _handleClick() {
    this.toggleState();
  }

  /** Handles keydown events */
  _handleKeydown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggleState();
    }
  }

  // --- Public API Methods ---

  /** Toggles the switch state */
  toggleState() {
    this.setState(!this._isActive);
  }

  /**
   * Sets the state of the switch.
   * @param {boolean} newState - The desired state (true for active/on, false
   * for inactive/off).
   * @param {boolean} [fireEvent=true] - Whether to fire the 'togglechange'
   * event.
   */
  setState(newState, fireEvent = true) {
    if (typeof newState !== 'boolean' || this._isActive === newState) {
      return;
    }

    this._isActive = newState;

    // Reflect state to attribute
    if (this._isActive) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }

    // Update visuals and ARIA
    this._updateVisualState();

    // Dispatch custom event if requested
    if (fireEvent) {
      this.dispatchEvent(new CustomEvent('togglechange', {
        detail: { isActive: this._isActive },
        bubbles: true, // Allow event to bubble up
        composed: true // Allow event to cross Shadow DOM boundary
      }));
      console.log(`Switch ${this.id} toggled:`, this._isActive ? 'ON' : 'OFF');
    }
  }

  /**
   * Gets the current state of the switch.
   * @returns {boolean} True if the switch is active (on), false otherwise.
   */
  getState() {
    return this._isActive;
  }
}

// Define the custom element
customElements.define('led-toggle-switch', LEDToggleSwitch);
