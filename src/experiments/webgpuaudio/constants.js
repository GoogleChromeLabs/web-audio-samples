// WebAudio's render block size (in sample-frames)
export const RENDER_QUANTUM = 128;

// The size multiplier for the batch processing frame size.
export const KERNEL_LENGTH = 20;

// The actual batch processing frame size used in Worker.
export const FRAME_SIZE = KERNEL_LENGTH * RENDER_QUANTUM;

// The maximum size of two SharedArrayBuffers between Worker and
// AudioWorkletProcessor.
export const QUEUE_SIZE = 4096;
