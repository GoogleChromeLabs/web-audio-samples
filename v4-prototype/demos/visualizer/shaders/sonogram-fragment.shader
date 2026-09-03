// Sonogram fragment shader
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
    float x = pow(256.0, texCoord.x - 1.0);
    float y = texCoord.y + yoffset;

    vec4 sample = texture2D(frequencyData, vec2(x, y));
    float k = sample.a;

    // gl_FragColor = vec4(k, k, k, 1.0);
    // Fade out the mesh close to the edges
    float fade = pow(cos((1.0 - texCoord.y) * 0.5 * 3.1415926535), 0.5);
    k *= fade;
    vec4 color = k * vec4(0,0,0,1) + (1.0 - k) * backgroundColor;
    gl_FragColor = color;
}
