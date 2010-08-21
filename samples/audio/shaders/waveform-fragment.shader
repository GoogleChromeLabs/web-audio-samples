// Waveform fragment shader
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 texCoord;
uniform sampler2D frequencyData;
uniform vec4 foregroundColor;
uniform vec4 backgroundColor;
uniform float yoffset;

void main()
{
    vec4 sample = texture2D(frequencyData, vec2(texCoord.x, yoffset));
    if (texCoord.y > sample.a + 0.01 || texCoord.y < sample.a - 0.01) {
        discard;
    }
    float x = (texCoord.y - sample.a) / 0.01;
    x = x * x * x;
    gl_FragColor = mix(foregroundColor, backgroundColor, x);
}
