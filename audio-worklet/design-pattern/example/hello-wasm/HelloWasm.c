#include <emscripten.h>
#include <math.h>

EMSCRIPTEN_KEEPALIVE
double addDoubles(double a, double b) {
  return a + b;
}

EMSCRIPTEN_KEEPALIVE
double getB1(double frequency, double sampleRate) {
  return exp(-2.0 * M_PI * frequency / sampleRate);
}
