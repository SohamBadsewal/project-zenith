export const smokeVertex = `
uniform float uTime;
uniform float uTension;
uniform float uBurst;
uniform float uSize;
uniform float uPixelRatio;
attribute float aSeed;
attribute float aSpeed;
varying float vAlpha;
varying float vHeat;

void main() {
  vec3 p = position;
  float ang = aSeed * 6.2831853;
  float life = mod(uTime * (0.3 + aSpeed * 0.5) + aSeed * 9.0, 1.0);
  float radialBase = (0.5 + aSeed * 0.8);
  float radialExpand = radialBase * (0.3 + life * (1.4 + uBurst * 6.0));
  vec2 dir = vec2(cos(ang), sin(ang)) * radialExpand;
  p.x += dir.x;
  p.z += dir.y;
  float rise = life * (1.5 + uBurst * 8.0);
  float gravity = uBurst * life * life * 2.5;
  p.y += rise - gravity - 0.8;
  float grow = 0.3 + life * 2.2 + uBurst * 1.8;
  p.xz *= grow;
  float emit = clamp(0.1 + uTension * 0.9 + uBurst, 0.0, 1.0);
  vAlpha = (1.0 - life) * emit * (0.6 + uBurst * 0.4);
  vHeat = (1.0 - life * life) * (0.4 + uBurst * 0.9);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float ps = uSize * (1.0 + life * 6.0 + uBurst * 3.0) * uPixelRatio;
  gl_PointSize = ps * (280.0 / -mv.z);
}
`;

export const smokeFragment = `
uniform sampler2D uSprite;
uniform vec3 uHot;
uniform vec3 uCold;
uniform float uBurst;
varying float vAlpha;
varying float vHeat;

void main() {
  vec2 uv = gl_PointCoord;
  vec4 tex = texture2D(uSprite, uv);
  float a = tex.a;
  if (a < 0.01) discard;
  vec3 col = mix(uCold, uHot, vHeat);
  col += uHot * uBurst * 0.7 * vHeat;
  col = mix(col, vec3(1.0, 0.95, 0.85), uBurst * vHeat * 0.3);
  float finalA = a * vAlpha * 0.85;
  gl_FragColor = vec4(col, finalA);
}
`;
