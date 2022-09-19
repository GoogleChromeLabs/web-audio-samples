#include <emscripten.h>
 
// This file demonstrates how to load and decode an MP3 file by incorporating 
// Emscripten, the FreeQueue library, and the 'dr_mp3' library.

#define FREE_QUEUE_IMPL
#include "../../src/interface/free_queue.h"
#define DR_MP3_IMPLEMENTATION
#include "dr_mp3.h"

struct FreeQueue *queue;
drmp3 mp3;

// Function to get FreeQueue address in memory from JavaScript.
EMSCRIPTEN_KEEPALIVE void *getFreeQueue() {
  return queue;
}

// Stores if last decoded frame was pushed to queue.
bool isLastFramePushed = true;
// variable to store count of last decoded PCM frames.
drmp3_uint64 framesRead = 0;

// Max number of samples(PCM frames) to decode and push in single call
// of audio_loop function.
#define FRAME_SIZE 4096

// A buffer to store interleaved PCM frames from a MP3 file.
float buffer[2*FRAME_SIZE];    // 2 channels so 2 * FRAME_SIZE
// A input buffer to store decoded mp3 channel data.
float* input[] = {
  (float[FRAME_SIZE]){},
  (float[FRAME_SIZE]){}
};

/**
 * Reads frames from a MP3 file and pushes them to a queue.
*/
EMSCRIPTEN_KEEPALIVE void audio_loop() {
  if (isLastFramePushed) {
    framesRead = drmp3_read_pcm_frames_f32(
        &mp3, 
        DRMP3_COUNTOF(buffer)/mp3.channels, 
        buffer
    );
    // Separating interleaved PCM frames to 2 channels.
    for (int i = 0; i < framesRead; i++) {
      input[0][i] = buffer[2*i];
      input[1][i] = buffer[2*i + 1];
    } 
  }
  isLastFramePushed = FreeQueuePush(queue, input, framesRead);
}


int main(int argc, char** argv) {
  queue = CreateFreeQueue(81920, 2);
  
  // Try opening audio file
  if (!drmp3_init_file(&mp3, "moonlight.mp3", NULL)) {
    // Failed to open file
    printf("Failed to load song.");
    return EXIT_FAILURE;
  }
  
  //Print Information about audio to console.
  drmp3_uint64 count = drmp3_get_pcm_frame_count(&mp3);
  printf("Frame Count: %llu\n", count);
  printf("channels: %u\n", mp3.channels);
  printf("sampleRate: %u\n", mp3.sampleRate);
  unsigned long long length = count / ( mp3.sampleRate);
  printf("Length: %llu seconds\n", length);
  // Print length of song in minutes:seconds format
  printf("Length %llu:%llu\n", length / 60, length % 60);

  // Set main audio loop
  emscripten_set_main_loop(audio_loop, 60, true);
  return EXIT_SUCCESS;
}
