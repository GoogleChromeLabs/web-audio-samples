export const KERNEL_LENGTH = 20;
export const RENDER_QUANTUM = 128;
export const FRAME_SIZE = KERNEL_LENGTH * RENDER_QUANTUM;
export const QUEUE_SIZE = 4096;
export const WORKGROUP_SIZE = 4;

// Set to true to run tests defined in test_processor.js
export let TEST_MODE = false;