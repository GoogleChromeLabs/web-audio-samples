mkdir "build"
emcc example.c ^
    -sENVIRONMENT=worker ^
    -sMODULARIZE=1 ^
    -sEXPORT_NAME=ExampleModule ^
    -sEXPORT_ES6=1 ^
    -sINVOKE_RUN=1 ^
    -pthread ^
    -sEXPORTED_RUNTIME_METHODS="['callMain','ccall', 'cwrap']" ^
    -o build/example.js ^
    --preload-file moonlight.mp3
