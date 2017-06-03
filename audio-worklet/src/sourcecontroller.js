class SourceController {
	/**
	 * Playback controls to specified controller 
	 * @param  {String} parentId string id for parent element
	 * @param  {Function} onStart callback for play
	 * @param  {Function} onStop callback for stop
	 */
	constructor(parentId, audioStart, audioStop) {
		this.parent = document.getElementById(parentId);
		this.playButton = document.createElement("button");
		this.stopButton = document.createElement("button");
		this.parent.appendChild(this.playButton);
		this.parent.appendChild(this.stopButton);

		this.playButton.innerHTML = "Play";
		this.stopButton.innerHTML = "Stop";
		this.stopButton.disabled = true;

		this.playButton.addEventListener("click", this.start.bind(this));
		this.stopButton.addEventListener("click", this.stop.bind(this));
		this.audioStart = audioStart;
		this.audioStop = audioStop;
	}
	
	enable() {		
	
	}

	disable() {

	}
	
	start() {
		this.playButton.disabled = true;
		this.stopButton.disabled = false;
		this.audioStart();
	}

	stop() {
		this.playButton.disabled = false;
		this.stopButton.disabled = true;
		this.audioStop();
	}
}