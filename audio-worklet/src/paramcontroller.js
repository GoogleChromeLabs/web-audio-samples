class ParamController {
	/**
	 * Playback controls to specified controller 
	 * @param  {String} parentId string id for parent element
	 * @param  {Function} options.event callback to trigger on change
	 * @param  {String} type parameter type. Only slider is supported 
	 */
	constructor(parentId, event, options) {
		this.parent = document.getElementById(parentId);
		this.container = document.createElement("div"); 
		this.parent.appendChild(this.container);
		this.container.className += "param";
		
		this.header = document.createElement("div"); 
		this.header.className += "paramHeader";
		this.name = options.name || "Parameter";
		this.header.innerHTML = this.name + ": ";
		this.header.innerHTML += options.default || 1;
		this.container.appendChild(this.header);
		
		this.event = event;
		this.controller = document.createElement("input");
		this.controller.type = options.type || "range";
		this.controller.min = options.min || 0;
		this.controller.max = options.max || 100;
		this.controller.step = options.step || 1;
		this.controller.value = options.default || 1;

		if (this.controller.type == "range") {
			this.controller.className += "slider";
		}
		else { // TODO implement more parameter types
			console.error(type + " not defined");
		}
		this.container.appendChild(this.controller);
		this.controller.addEventListener("input", this.change.bind(this));
	}

	enable() {		
		this.controller.disabled = false;
	}

	disable() {
		this.controller.disabled = true;
	}
	
	change() {
		this.header.innerHTML = this.name +": ";
		this.header.innerHTML += this.controller.value;
		this.event(this.controller.value);
	}
}