precision mediump float;

varying vec2 vTexCoord;

uniform float time;

uniform vec2 resolution;

void main() {

  // Normalized coordinates, center at (0,0), aspect-correct

  vec2 uv = (gl_FragCoord.xy / resolution.xy);

  float aspect = resolution.x / resolution.y;

  // Animate both x and y for a wavy effect

  float wave = sin((uv.x * aspect) * 20.0 + time * 2.0) * 0.15

             + sin((uv.y) * 15.0 + time * 1.2) * 0.10;

  vec3 color = vec3(0.53, 0.81, 0.92) + wave;

  gl_FragColor = vec4(color, 1.0);

}

