// Late-afternoon gradient sky with drifting cumulus, mixed with the paper colour
// while the scene is still a drawing. Output is display-referred (sRGB).
import * as THREE from 'three';
import { PAPER } from './materials.js';

export function makeSky(sunDir) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { uSun: { value: sunDir.clone() }, uMix: { value: 0 }, uPaper: { value: PAPER.clone() }, uLinear: { value: 0 }, uDusk: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      varying vec3 vDir; uniform vec3 uSun; uniform float uMix; uniform vec3 uPaper; uniform float uLinear; uniform float uDusk;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<5;i++){ s += a*n2(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 hor = mix(vec3(0.99, 0.83, 0.66), vec3(0.98, 0.56, 0.36), uDusk);
        vec3 mid = mix(vec3(0.86, 0.85, 0.84), vec3(0.58, 0.46, 0.58), uDusk);
        vec3 zen = mix(vec3(0.50, 0.65, 0.82), vec3(0.12, 0.17, 0.34), uDusk);
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.16, h));
        col = mix(col, zen, smoothstep(0.12, 0.75, h));
        float s = max(dot(d, normalize(uSun)), 0.0);
        col += vec3(1.0, 0.72, 0.42) * (pow(s, 6.0) * 0.28 + pow(s, 60.0) * 0.35) + vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s);
        // clouds on a dome
        vec2 uv = d.xz / (h + 0.12) * 1.3;
        float c = fbm(uv * 1.6 + vec2(3.0, 1.0));
        float a = smoothstep(0.52, 0.78, c) * smoothstep(0.02, 0.2, h) * 0.85;
        vec3 cl = mix(mix(vec3(0.78, 0.74, 0.8), vec3(0.42, 0.34, 0.46), uDusk), mix(vec3(1.0, 0.84, 0.76), vec3(1.0, 0.55, 0.45), uDusk), smoothstep(0.4, 1.0, s) * 0.6 + 0.4 * smoothstep(0.55, 0.8, c));
        col = mix(col, cl, a);
        // below the horizon: haze
        col = mix(col, mix(vec3(0.88, 0.8, 0.7), vec3(0.32, 0.26, 0.3), uDusk), smoothstep(0.0, -0.08, h));
        col = mix(uPaper, col, uMix);
        if (uLinear > 0.5) col = pow(col, vec3(2.2));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat);
  m.scale.setScalar(5000); m.frustumCulled = false; m.renderOrder = -1;
  return m;
}
