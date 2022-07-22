#include <math.h>

#define FREE_QUEUE_IMPL
#include "free_queue.h"

struct FreeQueue *fq;

EMSCRIPTEN_KEEPALIVE void *getFreeQueue()
{
    return fq;
}


const float frequency = 440.0;
float phase = 0;

float buffer[1024];
float *input[] = {buffer};

EMSCRIPTEN_KEEPALIVE bool process()
{
    for (int i = 0; i < 1024; i++)
    {
        buffer[i] = sin(phase);
        phase += 2.0 * 3.1415 * frequency / 48000;
        if (phase > 2.0 * 3.1415)
            phase -= 2.0 * 3.1415;
    }
    return free_queue_push(fq, input, 1024);
}

int main(int argc, char **argv)
{
    fq = create_free_queue(4096, 1);
    return 0;
}
