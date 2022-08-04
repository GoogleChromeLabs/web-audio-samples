# FreeQueue C Interface

A single header C API implementation to access FreeQueue functionality from 
C/C++ programs. This uses atomics from `stdatomic.h` and emscripten to 
implement atomic read and writes. This is a lock-free implementation and will 
assure concurrency, given there is single producer (a thread pushing data into 
buffer) and single consumer (a thread pulling data out of buffer)

## How to Use

```C
// Should be defined in Single Source file before including free_queue.h .
#define FREE_QUEUE_IMPL 
// Include free_queue.h according to it's locatoion in project.
#include "free_queue.h" 
```

The Structure representation of FreeQueue in C API is like:
```C
// C Structure to Represent FreeQueue datatype.
struct FreeQueue {
  size_t buffer_length;
  size_t channel_count;
  atomic_uint* state;
  float** channel_data;    
};
```

The methods that can be used on FreeQueue in C are:
```C
// For Creating FreeQueue
struct FreeQueue* CreateFreeQueue(size_t length, size_t channelCount);
// For Pushing Data        
bool FreeQueuePush(struct FreeQueue* queue, float** input, size_t blockLength);  
// For Pulling Data
bool FreeQueuePull(struct FreeQueue* queue, float** output, size_t blockLength);
// For Destroying FreeQueue
void DestroyFreeQueue(struct FreeQueue* queue);                                  

// Helper function for querying for pointers of FreeQueue data members   
void* GetFreePueuePointers(struct FreeQueue* queue, char* data);                
```

### Building

#### Prerequisites

Emscripten -[https://emscripten.org/docs/getting_started/downloads.html](https://emscripten.org/docs/getting_started/downloads.html)

#### Example emcc settings for building

```ps
emcc \
	{input_files} \
	-s ENVIRONMENT=worker \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=FQC \
    -s EXPORT_ES6=1 \
	-s INVOKE_RUN=0 \
	-s EXPORTED_RUNTIME_METHODS="['callMain','ccall', 'cwrap']" \
	-pthread \
	-o {output_file_name.js}
```

The following is the example usage of this interface.

1. Create an instance of FreeQueue in the C code.
2. Get the pointer from the C FreeQueue instance.
3. Create a JS instance of FreeQueue with the obtained pointer.
4. Now push and pull from either side; one side being a producer and the other a consumer.
