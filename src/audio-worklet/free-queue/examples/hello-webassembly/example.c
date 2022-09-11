#include <emscripten.h>

 
// Include FreeQueue interface library and dr_mp3 library (For loading and
// decodin mp3 file).

#define FREE_QUEUE_IMPL
#include "../../src/interface/free_queue.h"
#define DR_MP3_IMPLEMENTATION
#include "dr_mp3.h"

struct FreeQueue *queue;
drmp3 mp3;

// Function to get FreeQueue address in memory from JavaScript.
EMSCRIPTEN_KEEPALIVE void *getFreeQueue()
{
    return queue;
}

bool lastFramePushed = true;
drmp3_uint64 framesRead = 0;

#define FRAME_SIZE 4096

// buffer to store interleaved PCM frames from mp3 
float buffer[2*FRAME_SIZE];    // 2 channels so 2 * FRAME_SIZE
// input buffer to store decoded mp3 channel data.
float* input[] = {
    (float[FRAME_SIZE]){},
    (float[FRAME_SIZE]){}
};

/**
 * Function to read a FRAME from mp3 and push it to queue.
*/
EMSCRIPTEN_KEEPALIVE bool audio_loop()
{
    // Here if the last FRAME read was pushed we read more frames from 
    if (lastFramePushed) {
        framesRead = drmp3_read_pcm_frames_f32(&mp3, DRMP3_COUNTOF(buffer)/mp3.channels, buffer);
        // Seperating PCM frames into 2 channels
        for (int i = 0; i < framesRead; i++) {
            input[0][i] = buffer[2*i];
            input[1][i] = buffer[2*i + 1];
        }
        
    }
    // Push FRAME to queue.
    lastFramePushed = FreeQueuePush(queue, input, framesRead);
    return lastFramePushed;
}


int main(int argc, char** argv) {

    queue = CreateFreeQueue(81920, 2);
    
    // Try opening audio file
    if (!drmp3_init_file(&mp3, "moonlight.mp3", NULL)) {
        // Failed to open file
        printf("Failed to load song.");
        return EXIT_FAILURE;
    }
    /**
     * Print Information about audio to console.
    */
    drmp3_uint64 count = drmp3_get_pcm_frame_count(&mp3);
    printf("Frame Count: %llu\n", count);
    
    drmp3_uint32 channels = mp3.channels;
    printf("channels: %u\n", channels);
    
    drmp3_uint32 sampleRate = mp3.sampleRate;
    printf("sampleRate: %u\n", sampleRate);
    
    unsigned long long length = count / ( sampleRate);
    printf("Length: %llu seconds\n", length);

    // Print length of song in minutes:seconds format
    printf("Length %llu:%llu\n", length / 60, length % 60);

    // Set main audio loop
    emscripten_set_main_loop((void (*)(void))audio_loop, 60, true);

    return EXIT_SUCCESS;
}
