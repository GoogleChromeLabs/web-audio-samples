#ifndef FREE_QUEUE_C
#define FREE_QUEUE_C


#include <stdint.h>
#include <stdlib.h>
#include <stdatomic.h>
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifndef EMSCRIPTEN_KEEPALIVE
#define EMSCRIPTEN_KEEPALIVE __attribute__((used))
#endif

/**
 * C Struct to represent FreeQueue
*/
struct FreeQueue {
    size_t bufferLength;
    size_t channelCount;
    atomic_uint* state;
    float** channels;    
};

enum FQState {
    READ = 0,
    WRITE = 1
};

/**
 * C API for implementing and acessing FreeQueue.
 */

/**
 * Create a FreeQueue and returns pointer.
 * Takes length of FreeQueue and channel Count as parameters.
 * Returns pointer to created FreeQueue.
*/
EMSCRIPTEN_KEEPALIVE struct FreeQueue* create_free_queue(size_t length, size_t channelCount);

/**
 * Push new data to FreeQueue.
 * Takes pointer to FreeQueue, pointer to input data, and block length as parameters.
 * Returns if operation was successful or not as boolean.
*/
EMSCRIPTEN_KEEPALIVE bool free_queue_push(struct FreeQueue* fq, float** input, size_t blockLength);

/**
 * Pull data from FreeQueue.
 * Takes pointer to FreeQueue, pointer to output buffers, and block length as parameters.
 * Returns if operation was successful or not as boolean.
*/
EMSCRIPTEN_KEEPALIVE bool free_queue_pull(struct FreeQueue* fq, float** output, size_t blockLength);

/**
 * Destroy FreeQueue.
 * Takes pointer to FreeQueue as parameter.
*/
EMSCRIPTEN_KEEPALIVE void destroy_free_queue(struct FreeQueue* fq);

/**
 * Helper Function to get Pointers to data members of FreeQueue Struct.
 * Takes pointer to FreeQueue, and char* string refering to data member to query.
*/
EMSCRIPTEN_KEEPALIVE void* get_free_queue_pointers(struct FreeQueue* fq, char* data);

#ifdef FREE_QUEUE_IMPL

static uint32_t _getAvailableRead(struct FreeQueue* fq, uint32_t readIndex, uint32_t writeIndex) {
    if (writeIndex >= readIndex)
        return writeIndex - readIndex;

    return writeIndex + fq->bufferLength - readIndex;
}

static uint32_t _getAvailableWrite(struct FreeQueue* fq, uint32_t readIndex, uint32_t writeIndex) {
    if (writeIndex >= readIndex)
        return fq->bufferLength - writeIndex + readIndex - 1;

    return readIndex - writeIndex -1;
}


struct FreeQueue* create_free_queue(size_t length, size_t channelCount) {
    struct FreeQueue* fq = (struct FreeQueue*)malloc(sizeof(struct FreeQueue));
    fq->bufferLength = length + 1;
    fq->channelCount = channelCount;
    fq->state = (atomic_uint*)malloc(2 * sizeof(atomic_uint));
    atomic_store(fq->state + READ, 0);
    atomic_store(fq->state + WRITE, 0);

    fq->channels = (float**)malloc(channelCount * sizeof(float*));
    for(int i = 0; i < channelCount; i++) {
        fq->channels[i] = (float*)malloc(fq->bufferLength * sizeof(float));
        for(int j = 0; j < fq->bufferLength; j++) {
            fq->channels[i][j] = 0;
        }
    }
    return fq;
}

void destroy_free_queue(struct FreeQueue* fq) {
    for(int i = 0; i < fq->channelCount; i++) {
        free(fq->channels[i]);
    }
    free(fq->channels);
    free(fq);
}

bool free_queue_push(struct FreeQueue* fq, float** input, size_t blockLength) {
    uint32_t currentRead = atomic_load(fq->state + READ);
    uint32_t currentWrite = atomic_load(fq->state + WRITE);

    if (_getAvailableWrite(fq, currentRead, currentWrite) < blockLength) {
      return false;
    }
    
    for (uint32_t i = 0; i < blockLength; i++) {
        for (uint32_t channel = 0; channel < fq->channelCount; channel++) {
            fq->channels[channel][(currentWrite + i) % fq->bufferLength] = input[channel][i];
        }
    }
    
    uint32_t nextWrite = (currentWrite + blockLength) % fq->bufferLength;
    atomic_store(fq->state + WRITE, nextWrite);
    return true;
}

bool free_queue_pull(struct FreeQueue* fq, float** output, size_t blockLength) {
    uint32_t currentRead = atomic_load(fq->state + READ);
    uint32_t currentWrite = atomic_load(fq->state + WRITE);

    if (_getAvailableRead(fq, currentRead, currentWrite) < blockLength) {
      return false;
    }
    
    for (uint32_t i = 0; i < blockLength; i++) {
        for (uint32_t channel = 0; channel < fq->channelCount; channel++) {
            output[channel][i] = fq->channels[channel][(currentRead + i) % fq->bufferLength];
        }
    }

    uint32_t nextRead = (currentRead + blockLength) % fq->bufferLength;
    atomic_store(fq->state + READ, nextRead);
    return true;
}

void* get_free_queue_pointers(struct FreeQueue* fq, char* data) {
    if (strcmp(data, "bufferLength") == 0) {
        return &fq->bufferLength;
    } else if (strcmp(data, "channelCount") == 0) {
        return &fq->channelCount;
    } else if (strcmp(data, "channels") == 0) {
        return &fq->channels;
    } else if (strcmp(data, "state") == 0) {
        return &fq->state;
    }
    
    return 0;
}

/**
 * Helper function for debugging
*/
EMSCRIPTEN_KEEPALIVE void print_data(struct FreeQueue* fq) {
    for (uint32_t channel = 0; channel < fq->channelCount; channel++) {
        printf("channel %d: ", channel);
        for (uint32_t i = 0; i < fq->bufferLength; i++) {
            printf("%f ", fq->channels[channel][i]);
        }
        printf("\n");
    }

    uint32_t currentRead = atomic_load(fq->state + READ);
    uint32_t currentWrite = atomic_load(fq->state + WRITE);

    printf("----------\n");
    printf("currentRead: %u  | currentWrite: %u\n", currentRead, currentWrite);
    printf("availabeRead: %u  | availableWrite: %u\n", _getAvailableRead(fq, currentRead, currentWrite), _getAvailableWrite(fq, currentRead, currentWrite));
    printf("----------\n");
}

/**
 * Helper function for debugging
*/
EMSCRIPTEN_KEEPALIVE void free_queue_address(struct FreeQueue* fq) {
    printf("bufferLength: %p   uint: %zu\n", &fq->bufferLength, (size_t)&fq->bufferLength);
    printf("channelCount: %p   uint: %zu\n", &fq->channelCount, (size_t)&fq->channelCount);
    printf("state       : %p   uint: %zu\n", &fq->state, (size_t)&fq->state);
    printf("channels    : %p   uint: %zu\n", &fq->channels, (size_t)&fq->channels);
    printf("state[0]    : %p   uint: %zu\n", &fq->state[0], (size_t)&fq->state[0]);
    printf("state[1]    : %p   uint: %zu\n", &fq->state[1], (size_t)&fq->state[1]);
    
}

#endif
#ifdef __cplusplus
}
#endif
#endif

