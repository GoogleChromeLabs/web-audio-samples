mkdir "build"
emcc src/main.c -sENVIRONMENT=worker -sMODULARIZE=1 -sEXPORT_NAME=FQC -sEXPORT_ES6=1 -sINVOKE_RUN=0 -pthread -sEXPORTED_RUNTIME_METHODS="['callMain','ccall', 'cwrap']" -o build/main.js