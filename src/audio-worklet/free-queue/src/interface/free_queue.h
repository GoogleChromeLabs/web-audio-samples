#ifndef FREE_QUEUE_C_H_
#define FREE_QUEUE_C_H_

#include <stdatomic.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * FreeQueue C Struct
 * bufferLength stores size/length of backing buffer.
 * channelCount stores number of channels FreeQueue has.
 * state points to array storing Read and Write heads of FreeQueue.
 * channelData stores a pointer pointing to array, whose each cell
 * points to a channel buffer in memory.
 */
struct FreeQueue {
    size_t bufferLength;
    size_t channelCount;
    atomic_uint* state;
    float** channelData;    
};

/**
 * An index set for shared state fields.
 * @enum {number}
*/
enum FreeQueueState {
    /** @type {number} A shared index for reading from the queue. (consumer) */
    READ = 0,
    /** @type {number} A shared index for writing into the queue. (producer) */
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
EMSCRIPTEN_KEEPALIVE struct FreeQueue* CreateFreeQueue(size_t length, size_t channelCount);

/**
 * Push new data to FreeQueue.
 * Takes pointer to FreeQueue, pointer to input data, and block length as parameters.
 * Returns if operation was successful or not as boolean.
*/
EMSCRIPTEN_KEEPALIVE bool FreeQueuePush(struct FreeQueue* queue, float** input, size_t blockLength);

/**
 * Pull data from FreeQueue.
 * Takes pointer to FreeQueue, pointer to output buffers, and block length as parameters.
 * Returns if operation was successful or not as boolean.
*/
EMSCRIPTEN_KEEPALIVE bool FreeQueuePull(struct FreeQueue* queue, float** output, size_t blockLength);

/**
 * Destroy FreeQueue.
 * Takes pointer to FreeQueue as parameter.
*/
EMSCRIPTEN_KEEPALIVE void DestroyFreeQueue(struct FreeQueue* queue);

/**
 * Helper Function to get Pointers to data members of FreeQueue Struct.
 * Takes pointer to FreeQueue, and char* string refering to data member to query.
*/
EMSCRIPTEN_KEEPALIVE void* GetFreeQueuePointers(struct FreeQueue* queue, char* data);

#ifdef FREE_QUEUE_IMPL

static uint32_t _getAvailableRead(struct FreeQueue* queue, uint32_t readIndex, uint32_t writeIndex) {
    if (writeIndex >= readIndex)
        return writeIndex - readIndex;

    return writeIndex + queue->bufferLength - readIndex;
}

static uint32_t _getAvailableWrite(struct FreeQueue* queue, uint32_t readIndex, uint32_t writeIndex) {
    if (writeIndex >= readIndex)
        return queue->bufferLength - writeIndex + readIndex - 1;

    return readIndex - writeIndex -1;
}

struct FreeQueue* CreateFreeQueue(size_t length, size_t channelCount) {
    struct FreeQueue* queue = (struct FreeQueue*)malloc(sizeof(struct FreeQueue));
    queue->bufferLength = length + 1;
    queue->channelCount = channelCount;
    queue->state = (atomic_uint*)malloc(2 * sizeof(atomic_uint));
    atomic_store(queue->state + READ, 0);
    atomic_store(queue->state + WRITE, 0);

    queue->channelData = (float**)malloc(channelCount * sizeof(float*));
    for(int i = 0; i < channelCount; i++) {
        queue->channelData[i] = (float*)malloc(queue->bufferLength * sizeof(float));
        for(int j = 0; j < queue->bufferLength; j++) {
            queue->channelData[i][j] = 0;
        }
    }
    return queue;
}

void DestroyFreeQueue(struct FreeQueue* queue) {
    for(int i = 0; i < queue->channelCount; i++) {
        free(queue->channelData[i]);
    }
    free(queue->channelData);
    free(queue);
}

bool FreeQueuePush(struct FreeQueue* queue, float** input, size_t blockLength) {
    uint32_t currentRead = atomic_load(queue->state + READ);
    uint32_t currentWrite = atomic_load(queue->state + WRITE);

    if (_getAvailableWrite(queue, currentRead, currentWrite) < blockLength) {
      return false;
    }
    
    for (uint32_t i = 0; i < blockLength; i++) {
        for (uint32_t channel = 0; channel < queue->channelCount; channel++) {
            queue->channelData[channel][(currentWrite + i) % queue->bufferLength] = input[channel][i];
        }
    }
    
    uint32_t nextWrite = (currentWrite + blockLength) % queue->bufferLength;
    atomic_store(queue->state + WRITE, nextWrite);
    return true;
}

bool FreeQueuePull(struct FreeQueue* queue, float** output, size_t blockLength) {
    uint32_t currentRead = atomic_load(queue->state + READ);
    uint32_t currentWrite = atomic_load(queue->state + WRITE);

    if (_getAvailableRead(queue, currentRead, currentWrite) < blockLength) {
      return false;
    }
    
    for (uint32_t i = 0; i < blockLength; i++) {
        for (uint32_t channel = 0; channel < queue->channelCount; channel++) {
            output[channel][i] = queue->channelData[channel][(currentRead + i) % queue->bufferLength];
        }
    }

    uint32_t nextRead = (currentRead + blockLength) % queue->bufferLength;
    atomic_store(queue->state + READ, nextRead);
    return true;
}

void* GetFreeQueuePointers(struct FreeQueue* queue, char* data) {
    if (strcmp(data, "bufferLength") == 0) {
        return &queue->bufferLength;
    } else if (strcmp(data, "channelCount") == 0) {
        return &queue->channelCount;
    } else if (strcmp(data, "channelData") == 0) {
        return &queue->channelData;
    } else if (strcmp(data, "state") == 0) {
        return &queue->state;
    }
    
    return 0;
}

/**
 * Helper function for debugging
*/
EMSCRIPTEN_KEEPALIVE void print_data(struct FreeQueue* queue) {
    for (uint32_t channel = 0; channel < queue->channelCount; channel++) {
        printf("channel %d: ", channel);
        for (uint32_t i = 0; i < queue->bufferLength; i++) {
            printf("%f ", queue->channelData[channel][i]);
        }
        printf("\n");
    }

    uint32_t currentRead = atomic_load(queue->state + READ);
    uint32_t currentWrite = atomic_load(queue->state + WRITE);

    printf("----------\n");
    printf("currentRead: %u  | currentWrite: %u\n", currentRead, currentWrite);
    printf("availabeRead: %u  | availableWrite: %u\n", _getAvailableRead(queue, currentRead, currentWrite), _getAvailableWrite(queue, currentRead, currentWrite));
    printf("----------\n");
}

/**
 * Helper function for debugging
*/
EMSCRIPTEN_KEEPALIVE void free_queue_address(struct FreeQueue* queue) {
    printf("bufferLength: %p   uint: %zu\n", &queue->bufferLength, (size_t)&queue->bufferLength);
    printf("channelCount: %p   uint: %zu\n", &queue->channelCount, (size_t)&queue->channelCount);
    printf("state       : %p   uint: %zu\n", &queue->state, (size_t)&queue->state);
    printf("channelData    : %p   uint: %zu\n", &queue->channelData, (size_t)&queue->channelData);
    printf("state[0]    : %p   uint: %zu\n", &queue->state[0], (size_t)&queue->state[0]);
    printf("state[1]    : %p   uint: %zu\n", &queue->state[1], (size_t)&queue->state[1]);
    
}

#endif
#ifdef __cplusplus
}
#endif
#endif
