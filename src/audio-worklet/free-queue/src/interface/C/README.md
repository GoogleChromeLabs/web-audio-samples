# FreeQueue C Interface

A single header C API implementation to access FreeQueue functionality from C/C++ programs.

## Using

```C
#define FREE_QUEUE_IMPL // Should be defined in Single Source file before including free_queue.h .
#include "free_queue.h" // Include free_queue.h according to it's locatoion in project.
```

The Structure representation of FreeQueue in C API is like:
```C
// C Structure to Represent FreeQueue datatype.
struct FreeQueue {
    size_t bufferLength;
    size_t channelCount;
    atomic_uint* state;
    float** channels;    
};
```

The Methods that can be used on FreeQueue in C are:
```C
struct FreeQueue* create_free_queue(size_t length, size_t channelCount);        // For Creating FreeQueue
bool free_queue_push(struct FreeQueue* fq, float** input, size_t blockLength);  // For Pushing Data
bool free_queue_pull(struct FreeQueue* fq, float** output, size_t blockLength); // For Pulling Data
void destroy_free_queue(struct FreeQueue* fq);                                  // For Destroying FreeQueue

// Helper function for querying for pointers of FreeQueue data members   
void* get_free_queue_pointers(struct FreeQueue* fq, char* data);                
```

### Building
After Installing and Activating Emscripten Toolchain, the following cli instruction can be used to build project. (It needs to be modified depending on project).

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

### Example Usage

An example workflow of using interface.

1. Create FreeQueue in C.
2. Query for Pointers through JS.
3. Create JS instance of FreeQueue through Pointers.
4. Now you can push and pull from either side, while one side being producer and other being consumer.

[FreeQueue WebAssembly Example: DivyamAhuja/free_queue_c](https://github.com/DivyamAhuja/free_queue_c)