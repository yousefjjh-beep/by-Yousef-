// Every surface in the house is one shader with two states:
//   drawing  – paper colour, ink edges, solid black where the cut plane opens a wall (poché)
//   built    – the real PBR material, lit by the late-afternoon sun
// A "sweep" (origin, radius, box) moves the boundary between the two across a room.
import * as THREE from 'three';

export const MAX_SWEEPS = 16;
export const MAX_ROOMS = 24;
export const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.2); // keeps y <= 1.2

export const U = {
  uPaper: { value: new THREE.Vector3(0.957, 0.945, 0.918) },   // display (sRGB) values, written after tone mapping
  uInk: { value: new THREE.Vector3(0.106, 0.102, 0.094) },
  uDrawShade: { value: 0 },   // 0 = flat paper (plan), 1 = paper with soft form shading
  uPoche: { value: 1 },       // 1 = back faces read as solid cut (section fill)
  uLineA: { value: 0.9 },
  uLineForce: { value: 0 },   // > 0 draws ink over built surfaces too (the closing, rendered plan)
  uSunDir: { value: new THREE.Vector3(-0.9, 0.34, 0.27).normalize() },
  uSweepO: { value: Array.from({ length: MAX_SWEEPS }, () => new THREE.Vector4(0, 0, -1, 1)) }, // x, z, radius, feather
  uSweepB: { value: Array.from({ length: MAX_SWEEPS }, () => new THREE.Vector4(0, 0, 0, 0)) }, // minx, minz, maxx, maxz
  // Room boxes for an analytic ambient occlusion: corners, skirting and ceiling edges darken softly.
  uRooms: { value: Array.from({ length: MAX_ROOMS }, () => new THREE.Vector4(0, 0, -1, -1)) },  // x0, z0, x1, z1
  uRoomH: { value: new Array(MAX_ROOMS).fill(0) },
};

export function setRooms(rooms) {
  rooms.slice(0, MAX_ROOMS).forEach((r, i) => {
    U.uRooms.value[i].set(r.r[0], r.r[1], r.r[2], r.r[3]);
    U.uRoomH.value[i] = r.open ? 60 : r.h;
  });
}

const REVEAL_GLSL = /* glsl */`
uniform vec4 uSweepO[${MAX_SWEEPS}];
uniform vec4 uSweepB[${MAX_SWEEPS}];
float revealAt(vec3 p){
  float r = 0.0;
  for(int i=0;i<${MAX_SWEEPS};i++){
    vec4 b = uSweepB[i];
    if(p.x<b.x || p.z<b.y || p.x>b.z || p.z>b.w) continue;
    vec4 o = uSweepO[i];
    if(o.z <= 0.0) continue;
    float d = length(p.xz - o.xy) + p.y*0.35 + 0.18*sin(p.x*2.7+p.z*1.9)*sin(p.y*3.1+p.x*0.7);
    r = max(r, smoothstep(o.z, o.z - o.w, d));
  }
  return r;
}
`;

const AO_GLSL = /* glsl */`
uniform vec4 uRooms[${MAX_ROOMS}];
uniform float uRoomH[${MAX_ROOMS}];
float occl(float d, float k, float r){ return 1.0 - k * exp(-max(d, 0.0) / r); }
float roomAO(vec3 p, vec3 n){
  for(int i=0;i<${MAX_ROOMS};i++){
    vec4 R = uRooms[i];
    if(R.z < R.x) continue;
    if(p.x < R.x - 0.12 || p.x > R.z + 0.12 || p.z < R.y - 0.12 || p.z > R.w + 0.12) continue;
    float h = uRoomH[i];
    float dx0 = p.x - R.x - 0.1, dx1 = R.z - 0.1 - p.x, dz0 = p.z - R.y - 0.1, dz1 = R.w - 0.1 - p.z;
    float a = 1.0;
    if(abs(n.y) > 0.5){
      float k = n.y > 0.0 ? 0.30 : 0.22;
      a *= occl(dx0, k, 0.45) * occl(dx1, k, 0.45) * occl(dz0, k, 0.45) * occl(dz1, k, 0.45);
    } else {
      a *= occl(p.y, 0.30, 0.35);
      if(h < 50.0) a *= occl(h - p.y, 0.22, 0.5);
      if(abs(n.x) > 0.5) a *= occl(dz0, 0.25, 0.4) * occl(dz1, 0.25, 0.4);
      else a *= occl(dx0, 0.25, 0.4) * occl(dx1, 0.25, 0.4);
    }
    return a;
  }
  return 1.0;
}
`;

// poche: 'cut' = back faces are solid ink while the plan is cut; 'discard' = never show back faces;
//        'none' = two-sided (leaf cards)
export function revealize(mat, { glass = false, poche = 'cut', clip = true, force = null, ao = true } = {}) {
  if (poche === true) poche = 'cut';
  if (poche === false) poche = 'discard';
  if (clip) mat.clippingPlanes = [clipPlane];
  mat.side = THREE.DoubleSide;
  mat.polygonOffset = true; mat.polygonOffsetFactor = 1; mat.polygonOffsetUnits = 1;
  const backface = poche === 'cut' ? 'if(uPoche > 0.5) gl_FragColor = vec4(uInk, 1.0); else discard;'
    : poche === 'discard' ? 'discard;' : '';
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    if (force) sh.uniforms.uForce = force;
    if (poche === 'none') sh.fragmentShader = sh.fragmentShader.replace('float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;', 'float faceDirection = 1.0;');
    sh.vertexShader = 'varying vec3 vWPos;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vec4 _wp = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        _wp = instanceMatrix * _wp;
      #endif
      _wp = modelMatrix * _wp;
      vWPos = _wp.xyz;
      vWN = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = `varying vec3 vWPos;\nvarying vec3 vWN;\nuniform vec3 uPaper;\nuniform vec3 uInk;\nuniform float uDrawShade;\nuniform float uPoche;\nuniform vec3 uSunDir;\n${force ? 'uniform float uForce;' : ''}\n${REVEAL_GLSL}\n${AO_GLSL}\n`
      + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float rv = revealAt(vWPos);
      ${force ? 'rv = max(rv, uForce);' : ''}
      vec3 wn = normalize(vWN);
      ${ao ? 'gl_FragColor.rgb *= roomAO(vWPos, wn);' : ''}
      float shade = mix(1.0, 0.84 + 0.13*max(dot(wn, uSunDir), 0.0) + 0.05*wn.y, uDrawShade);
      vec3 paper = uPaper * shade;
      gl_FragColor.rgb = mix(paper, gl_FragColor.rgb, rv);
      ${glass ? 'gl_FragColor.a = mix(0.10, gl_FragColor.a, rv);' : ''}
      if(!gl_FrontFacing){ ${backface} }`);
  };
  mat.customProgramCacheKey = () => ['reveal', glass, poche, !!force, ao].join('|');
  return mat;
}

// Ink lines (edges of every element). They vanish where the room has been built.
export function lineMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uInk: U.uInk, uLineA: U.uLineA, uLineForce: U.uLineForce, uSweepO: U.uSweepO, uSweepB: U.uSweepB },
    vertexShader: /* glsl */`
      #include <common>
      #include <clipping_planes_pars_vertex>
      varying vec3 vWPos;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <clipping_planes_pars_fragment>
      uniform vec3 uInk; uniform float uLineA; uniform float uLineForce;
      varying vec3 vWPos;
      ${REVEAL_GLSL}
      void main(){
        #include <clipping_planes_fragment>
        float a = uLineA * max(1.0 - revealAt(vWPos), uLineForce);
        if(a < 0.01) discard;
        gl_FragColor = vec4(uInk, a);
      }`,
    transparent: true, depthWrite: false, clipping: true,
  });
  m.clippingPlanes = [clipPlane];
  return m;
}
