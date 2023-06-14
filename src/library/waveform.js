class WaveformDrawer {
    constructor(canvasId) {
        this.canvas = document.querySelector(canvasId);
        this.canvasContext = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.currentX = 0;
        this.previousY = this.height / 2;
    }

    drawWaveform(analyser) {
        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        this.canvasContext.fillStyle = 'red';
        this.canvasContext.fillRect(0, 0, 1, 1);

        this.canvasContext.clearRect(this.currentX, 0, 1, this.height);

        analyser.getByteTimeDomainData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        const currentY = average / 128.0 * (this.height / 2);

        this.canvasContext.fillStyle = 'red';
        this.canvasContext.fillRect(this.currentX + 2, 0, 1, this.height);

        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.currentX, this.previousY);
        this.canvasContext.lineTo(this.currentX + 2, currentY);
        this.canvasContext.strokeStyle = 'black';
        this.canvasContext.lineWidth = 0.8;
        this.canvasContext.stroke();

        this.previousY = currentY;
        
        if (this.currentX < this.width - 2) {
            this.currentX += 2;
        } else {
            this.canvasContext.globalCompositeOperation = 'copy';
            this.canvasContext.drawImage(this.canvas, -2, 0);
            this.canvasContext.globalCompositeOperation = 'source-over';
        }
    }
}

export default WaveformDrawer;