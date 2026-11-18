/* ══ Dot globe ═════════════════════════════════
   A spinning Earth drawn as a grid of small dots: brighter dots for land,
   faint ones for the sea. Hover it and the dots under the pointer swell like
   a lens; grab it and drag to turn it like a trackball, or flick it and it
   coasts back to its slow idle turn. Arrow keys nudge the spin and tilt.

   ── THE DOTS ──────────────────────────────────
   The dots sit on latitude rows, with fewer dots on each row toward the poles
   (in proportion to the row's circumference), so they are spread evenly by
   area and never crowd at the poles. Each dot asks a tiny 256 × 128 land map
   whether it is on land. The map is one bit per pixel, packed into a short
   base64 string, made once from Natural Earth's public-domain 1:110m land
   polygons.

   ── ONE DRAW CALL ─────────────────────────────
   Every dot's position on the unit sphere is uploaded to the GPU once. Each
   frame only a rotation matrix (spin, then tilt) and the lens position change.
   The vertex shader rotates each dot, hides the ones facing away, and shrinks
   and fades the ones near the edge by how directly they face you, which is
   what makes a flat field of dots read as a ball. The fragment shader rounds
   each square point sprite into a soft circle.

   ── THE LENS ──────────────────────────────────
   The pointer position is passed to the shader. Each dot within the lens
   radius grows by up to the lens strength with a smooth falloff and turns
   opaque. The lens fades in and out over 150 ms and hides while dragging.

   ── MOMENTUM ──────────────────────────────────
   While you drag, the recent pointer speed is recorded. On release it becomes
   the spin speed, which then decays toward the idle speed with friction, while
   the tilt eases back to its resting angle. Off screen or in a hidden tab the
   loop stops. Without WebGL a static Canvas 2D drawing stands in. */

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type DotGlobeProps = {
  /** dots around the equator (rows pole to pole = half of this) */
  density?: number;
  /** land dot size in px */
  dotSize?: number;
  /** idle spin in degrees per second */
  speed?: number;
  /** axis tilt toward the viewer in degrees */
  tilt?: number;
  /** lens radius in px, 0 turns it off */
  lens?: number;
  /** how much dots grow under the lens */
  lensStrength?: number;
  /** land dot colour */
  accent?: "Ink" | "Pick" | "Ok";
  /** faint dots over the oceans */
  sea?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const SIZE = 240; // css px, the globe's box
const R = 116 / 120; // sphere radius in clip units, leaves room at the limb
const DEG = Math.PI / 180;
const FRICTION = 2.5;
const TOKEN = { Ink: "--fill-on", Pick: "--pick", Ok: "--ok" } as const;

// Natural Earth 1:110m land (public domain, naturalearthdata.com), 256 × 128 equirectangular, 1 bit per px, LSB first
const LAND = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/P8PkP8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHD///7///8/AAAAAAAIAAAAHAAAAAAAAAAAAAAAAAAA8P8P/v///wcAAD8BAAAAAAB8AAAAAAAAAAAAAAAAAAMN+PH/////AwAAngEAAAAAAIAAAAAAAAAAAAAAAAAeBHj/wP////8BAAAAAAAAgAEAAG8AAAAAAAAAAAAAAPAf238AwP///wMAAAAAAAAPAID//wEAfgMAAAAAAAAAHwDwAAAA////AQAAAAAAwAEA9P//AAAAAAAAAAAAAID3nxd/AwD+/78AAAAAAABgAC7+////D/gAAAABAAMAAPE/OP4fAPj//wAAAAAaAMCA///////f/48AgADw/w+94v92GP4A9v9/AAAA4H8AABj//////////xs+A/z///9/OOw58AD8/wcAAAD4/4+x/+7///////////8/8P///////x/wD/z/AAAAAPz/H/3/5////////////xj+////////C/gE+A8APwAAf/zx////////////////AMD///////948AP4BwAPAIB//////////////////38A+P//////PzDAAPADAAAA8J///////////////////wD8//////8fAB4A4AMAAADwj///////////////f/QHAOA38P///x8AfgAAAAAAAPAf8P////////////8/DAAAAAfA////PwD+BwAAAAAwMA/+////////////DwAGAACABQD+////APwPAAAAADBAjv////////////8HgA8AADAAAPz///8H/h8AAAAAYECD/////////////wGABwAAAAAA+P///x//fwAAAADOwPv/////////////KYADAAAAAADw////P///AAAAAOb5//////////////8/gAEAAAAAAOD//////38AAAAA4P3//////////////y+AAAAAAAAA4P//////gQEAAAAA/v//////////////LwAAAAAAAACA/v///3/DAwAAAOD///////////////8vAAAAAAAAAAD//////wMBAAAAwP////f//////////ycAAAAAAAAAAP//////HwAAAACA//8f+cP/////////AwAAAAAAAAAA//////8CAAAAAID/+Q/48f////////8hAAAAAAAAAID/////PwAAAAAA/gPzD+Dj////////fzAAAAAAAAAAAP////8fAAAAAAD8Q8aP4+f///////8PAAAAAAAAAAAA/////wcAAAAAAPxAyPj/5///////nwcQAAAAAAAAAAD/////BwAAAAAA/gCI+f/H//////8PBhgAAAAAAAAAAP7///8DAAAAAAB8AIT4/8///////38MDAAAAAAAAAAA/P///wMAAAAAAAD/AAD8////////HwwOAAAAAAAAAAD8////AQAAAAAA+H8AAPz///////8fYAEAAAAAAAAAAOD///8AAAAAAAD8/wAA/v///////z9wAAAAAAAAAAAAoP//PwAAAAAAAP7/xwP+////////fwAAAAAAAAAAAAAA//84AAAAAAAA/v////////////8/AAAAAAAAAAAAAAD/D2AAAAAAAAD///////P//////38AAAAAAAAAAAAAwP4HYAAAAAAAgP/////+5///////PwAAAAAAAAAAAAAA/QdAAAAAAADA//////wf/v////8fAAAAAAAAAAAAAAD5BwABAAAAAOD/////+Z8A/////08AAAAAAAAAAAAAAPADAAAAAAAA8P/////x/wP+////JwAAAAAAAAAAAAAA4AeAAQAAAADw//////P/A/5//v8AAAAAAAAAAAAAAADgBwMGAAAAAPD/////8/8B8D/8TwAAAAAAAAAAAAAAAMCPA3AAAAAA8P/////n/wHwD/hnAAAAAAAAAAAAAAAAAP8BAAAAAADw/////8d/APAH+A9AAAAAAAAAAAAAAAAA/AEAAAAAAPD/////zx8A8APoH0AAAAAAAAAAAAAAAADAHwAAAAAA8P////+fBwDgAcA/AAAAAAAAAAAAAAAAAAAeAAAAAADw/////78BAOABQD8AAAAAAAAAAAAAAAAAAAwAAAAAAPD/////fwAAwAFAPgAAAAAAAAAAAAAAAAAAGPwdAAAAwP////9/DwDAAUAMgAAAAAAAAAAAAAAAAACw/R8AAADA//////8PAMACQACAAgAAAAAAAAAAAAAAAED/PwAAAID//////wcAAAIAAIADAAAAAAAAAAAAAAAAAP5/AAAAAP//////BwAAAoABCAEAAAAAAAAAAAAAAAAA/v8HAAAATPD///8DAAAAsAEMAAAAAAAAAAAAAAAAAAD+/w8AAAAAgP///wMAAABgAw4AAAAAAAAAAAAAAAAAAP//DwAAAACA////AAAAAMCCDwAAAAAAAAAAAAAAAACA//8PAAAAAID//38AAAAAwMHvAQAAAAAAAAAAAAAAAID//x8AAAAAwP//PwAAAACAw49AAAAAAAAAAAAAAAAAwP///wAAAACA//8fAAAAAADDZ8AGAAAAAAAAAAAAAACA////DwAAAAD//w8AAAAAAAZmwD8AAAAAAAAAAAAAAMD///8/AAAAAP//DwAAAAAABKAA/gAAAAAAAAAAAAAAwP///38AAAAA/v8PAAAAAAAYAID8QQAAAAAAAAAAAACA////fwAAAAD+/w8AAAAAAMABAPwBAAAAAAAAAAAAAAD///9/AAAAAP7/DwAAAAAAAAABIAMEAAAAAAAAAAAAAP7//z8AAAAA/P8fAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v//HwAAAAD8/x8AAAAAAAAAQCAAAAAAAAAAAAAAAAD8//8PAAAAAP7/HwgAAAAAAADgIQAAAAAAAAAAAAAAAPz//w8AAAAA/v8fDAAAAAAAAPZgAEAAAAAAAAAAAAAA8P//DwAAAAD//w8HAAAAAAAA/3MAAAAAAAAAAAAAAADg//8PAAAAAP//hwcAAAAAAID/9wAAQAAAAAAAAAAAAMD//w8AAAAA/v+BBwAAAAAAwP//AAAAAAAAAAAAAAAAwP//BwAAAAD+/4EHAAAAAADw//8DAAAAAAAAAAAAAADA//8HAAAAAPz/gQMAAAAAAPz//wNAAAAAAAAAAAAAAMD//wEAAAAA/P+BAwAAAAAA/v//BwAAAAAAAAAAAAAAwP8/AAAAAAD8/4EDAAAAAAD+//8PAAAAAAAAAAAAAADA/x8AAAAAAPh/AAAAAAAAAP7//x8AAAAAAAAAAAAAAMD/HwAAAAAA+H8AAAAAAAAA/v//HwAAAAAAAAAAAAAA4P8fAAAAAADwfwAAAAAAAAD8//8fAAAAAAAAAAAAAADg/w8AAAAAAPA/AAAAAAAAAPz//x8AAAAAAAAAAAAAAOD/BwAAAAAA4B8AAAAAAAAA/M//HwAAAAAAAAAAAAAA4P8HAAAAAADgDwAAAAAAAAD8AP8PAAAAAAAAAAAAAADgvwMAAAAAAEAAAAAAAAAAABwA/QcAAAAAAAAAAAAAAPB/AAAAAAAAAAAAAAAAAAAAAAD4BwAIAAAAAAAAAAAA8H8AAAAAAAAAAAAAAAAAAAAAAPAHABAAAAAAAAAAAADwPwAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAPAPAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAA+AMAAAAAAAAAAAAAAAAAAAAAAIABAAwAAAAAAAAAAAD4AwAAAAAAAAAAAAAAAAAAAAAAAAEABgAAAAAAAAAAAPgDAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAwAEAAAAAAAAAAAD4AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAADwAQBAAMeH/wEAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAP//Af7//////wEAAAAAAAAAAAAAAOAHAAAAAAAAAID3//+B/////////wEAAAAAAAAAAAAAYA8AAAAACPz///////H//////////wAAAAAAAAAADwAgHwAAAID/////////////////////AQAAAACABoD///sfAAAA8P///////////////////38AAAAA+P///////wMAAAD4////////////////////HwAAAID///////83AAAA8P////////////////////8PAAAA/////////wcAwID//////////////////////x8AAGDA////////AQDwgfj/////////////////////BwAAAID///////8/HBwA//////////////////////8DAAAA+P////////8f/P///////////////////////w8AAAD4/////////////////////////////////////wD/HwD8/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w==";

let mask: Uint8Array | null = null;
function isLand(lat: number, lon: number) {
  if (!mask) mask = Uint8Array.from(atob(LAND), (c) => c.charCodeAt(0));
  const x = Math.min(255, Math.floor(((lon + 180) / 360) * 256));
  const y = Math.min(127, Math.floor(((90 - lat) / 180) * 128));
  const k = y * 256 + x;
  return (mask[k >> 3] >> (k & 7)) & 1;
}

/** x, y, z, land for every dot, spaced evenly by area */
function makeDots(density: number) {
  const rows = Math.max(4, Math.round(density / 2));
  const out: number[] = [];
  for (let i = 0; i < rows; i++) {
    const lat = -90 + ((i + 0.5) * 180) / rows;
    const c = Math.cos(lat * DEG);
    const n = Math.max(1, Math.round(density * c));
    for (let j = 0; j < n; j++) {
      const lon = -180 + ((j + 0.5) * 360) / n;
      out.push(c * Math.sin(lon * DEG), Math.sin(lat * DEG), c * Math.cos(lon * DEG), isLand(lat, lon));
    }
  }
  return new Float32Array(out);
}

/** tilt about x after spin about y, column-major for GLSL */
function rotation(spin: number, tilt: number) {
  const cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
  // rows: x' = cs x + ss z ; y' = st ss x + ct y - st cs z ; z' = -ct ss x + st y + ct cs z
  return new Float32Array([cs, st * ss, -ct * ss, 0, ct, st, ss, -st * cs, ct * cs]);
}

/** any CSS colour string to premultiplied-ready rgba 0..1 */
function readColor(el: HTMLElement, value: string, alpha = 1): [number, number, number, number] {
  el.style.color = value;
  const c = document.createElement("canvas").getContext("2d")!;
  c.fillStyle = getComputedStyle(el).color;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255, (d[3] / 255) * alpha];
}

const VS = `
attribute vec4 aDot;
uniform mat3 uRot;
uniform float uSize, uDpr, uLensR, uLensK, uLensA, uSea;
uniform vec2 uLens;
uniform vec4 uLandC, uSeaC;
varying vec4 vC;
varying float vS;
void main() {
  vec3 p = uRot * aDot.xyz;
  float sea = 1.0 - aDot.w;
  if (p.z <= 0.0 || sea * (1.0 - uSea) > 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec2 px = p.xy * ${R.toFixed(4)} * ${SIZE / 2}.0;
  float f = uLensR > 0.0 ? (1.0 - smoothstep(0.0, uLensR, distance(px, uLens))) * uLensA : 0.0;
  vec4 c = mix(uLandC, uSeaC, sea);
  float a = mix(c.a * (0.3 + 0.7 * p.z), mix(1.0, min(1.0, c.a * 2.5), sea), f);
  vC = vec4(c.rgb * a, a);
  vS = uSize * mix(1.0, 0.7, sea) * (0.55 + 0.45 * p.z) * (1.0 + (uLensK - 1.0) * f) * uDpr;
  gl_PointSize = vS;
  gl_Position = vec4(p.xy * ${R.toFixed(4)}, 0.0, 1.0);
}`;
const FS = `
precision mediump float;
varying vec4 vC;
varying float vS;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  gl_FragColor = vC * (1.0 - smoothstep(1.0 - 2.0 / max(vS, 2.0), 1.0, r));
}`;

export function DotGlobe({
  density = 100,
  dotSize = 2.4,
  speed = 8,
  tilt = 18,
  lens = 46,
  lensStrength = 1.8,
  accent = "Ink",
  sea = true,
  sound = true,
  volume = 70,
  onSound,
}: DotGlobeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const props = { density, dotSize, speed, tilt, lens, lensStrength, accent, sea, sound, volume, onSound };
  const P = useRef(props);
  P.current = props;
  // live state shared by the loop and the handlers
  const S = useRef({
    spin: 0, tilt: tilt * DEG, w: 0, tv: 0, // spin angle, tilt angle, spin speed (rad/s), tilt speed
    drag: null as null | { id: number; x: number; y: number; samples: { t: number; x: number; y: number }[] },
    lensX: 0, lensY: 0, lensOn: false, lensA: 0,
    reduced: false, lastWhoosh: 0, kick: () => {}, redraw: () => {},
  });

  // rebuild what depends on props
  useEffect(() => S.current.redraw(), [density, accent, sea, dotSize]);
  useEffect(() => S.current.kick(), [speed, tilt, lens, lensStrength]);

  useEffect(() => {
    const cv = cvRef.current!, root = rootRef.current!, probe = probeRef.current!;
    const st = S.current;
    const rq = matchMedia("(prefers-reduced-motion: reduce)");
    st.reduced = rq.matches;
    st.w = st.reduced ? 0 : P.current.speed * DEG;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = cv.height = Math.round(SIZE * dpr);

    let gl: WebGLRenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let u: Record<string, WebGLUniformLocation | null> = {};
    let count = 0, builtFor = -1;
    let colors = { land: [0, 0, 0, 1], sea: [0, 0, 0, 0.16] } as Record<string, number[]>;
    let raf = 0, last = 0, visible = false, fallback = false, dots = makeDots(P.current.density);

    const readColors = () => {
      const p = P.current;
      colors = { land: readColor(probe, `var(${TOKEN[p.accent] ?? TOKEN.Ink})`), sea: readColor(probe, "var(--fill-on)", 0.16) };
    };

    const build = () => {
      const g = gl!;
      const sh = (type: number, src: string) => {
        const s = g.createShader(type)!;
        g.shaderSource(s, src);
        g.compileShader(s);
        return s;
      };
      prog = g.createProgram()!;
      g.attachShader(prog, sh(g.VERTEX_SHADER, VS));
      g.attachShader(prog, sh(g.FRAGMENT_SHADER, FS));
      g.linkProgram(prog);
      g.useProgram(prog);
      for (const n of ["uRot", "uSize", "uDpr", "uLensR", "uLensK", "uLensA", "uSea", "uLens", "uLandC", "uSeaC"]) u[n] = g.getUniformLocation(prog, n);
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
      const loc = g.getAttribLocation(prog, "aDot");
      g.enableVertexAttribArray(loc);
      g.vertexAttribPointer(loc, 4, g.FLOAT, false, 0, 0);
      g.enable(g.BLEND);
      g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      g.viewport(0, 0, cv.width, cv.height);
      builtFor = -1;
    };

    const upload = () => {
      const p = P.current;
      if (builtFor === p.density) return;
      dots = makeDots(p.density);
      builtFor = p.density;
      count = dots.length / 4;
      if (gl) gl.bufferData(gl.ARRAY_BUFFER, dots, gl.STATIC_DRAW);
    };

    const drawGL = () => {
      const g = gl!, p = P.current;
      upload();
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      g.uniformMatrix3fv(u.uRot, false, rotation(st.spin, st.tilt));
      g.uniform1f(u.uSize, p.dotSize);
      g.uniform1f(u.uDpr, dpr);
      g.uniform1f(u.uLensR, p.lens);
      g.uniform1f(u.uLensK, p.lensStrength);
      g.uniform1f(u.uLensA, st.lensA);
      g.uniform1f(u.uSea, p.sea ? 1 : 0);
      g.uniform2f(u.uLens, st.lensX, st.lensY);
      g.uniform4fv(u.uLandC, colors.land);
      g.uniform4fv(u.uSeaC, colors.sea);
      g.drawArrays(g.POINTS, 0, count);
    };

    // no WebGL: the same projection on a 2D canvas, drawn once per change
    const draw2D = () => {
      const c = cv.getContext("2d");
      if (!c) return;
      const p = P.current, m = rotation(st.spin, st.tilt), h = SIZE / 2;
      if (builtFor !== p.density) { dots = makeDots(p.density); builtFor = p.density; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, SIZE, SIZE);
      for (let i = 0; i < dots.length; i += 4) {
        const [x, y, z, land] = [dots[i], dots[i + 1], dots[i + 2], dots[i + 3]];
        const pz = m[2] * x + m[5] * y + m[8] * z;
        if (pz <= 0 || (!land && !p.sea)) continue;
        const px = m[0] * x + m[3] * y + m[6] * z, py = m[1] * x + m[4] * y + m[7] * z;
        const col = land ? colors.land : colors.sea;
        c.fillStyle = `rgba(${col[0] * 255},${col[1] * 255},${col[2] * 255},${col[3] * (0.3 + 0.7 * pz)})`;
        c.beginPath();
        c.arc(h + px * R * h, h - py * R * h, (p.dotSize * (land ? 1 : 0.7) * (0.55 + 0.45 * pz)) / 2, 0, Math.PI * 2);
        c.fill();
      }
    };

    const step = (dt: number) => {
      const p = P.current;
      const idle = st.reduced ? 0 : p.speed * DEG;
      const k = 1 - Math.exp(-FRICTION * dt);
      if (!st.drag) {
        st.spin += st.w * dt;
        st.tilt += st.tv * dt;
        if (!st.reduced) {
          st.w += (idle - st.w) * k;
          st.tv -= st.tv * k;
          st.tilt += (p.tilt * DEG - st.tilt) * (1 - Math.exp(-2 * dt));
        }
      }
      const target = st.lensOn && !st.drag && p.lens > 0 ? 1 : 0;
      st.lensA += Math.sign(target - st.lensA) * Math.min(Math.abs(target - st.lensA), dt / 0.15);
      // still: nothing will change until the next input
      return !st.drag && Math.abs(st.w) < 1e-4 && Math.abs(st.tv) < 1e-4 && st.lensA === target &&
        (st.reduced || Math.abs(st.tilt - p.tilt * DEG) < 1e-4);
    };

    const frame = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const still = step(dt);
      if (gl && prog) drawGL();
      if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const start = () => {
      if (fallback) return draw2D();
      if (!raf && visible && gl && !document.hidden) raf = requestAnimationFrame(frame);
    };
    st.kick = start;
    st.redraw = () => {
      readColors();
      if (fallback) draw2D();
      else if (gl && prog) { drawGL(); start(); }
    };

    const init = () => {
      gl = cv.getContext("webgl", { premultipliedAlpha: true, antialias: true });
      if (!gl) { fallback = true; readColors(); draw2D(); return; }
      build();
      readColors();
    };

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !gl && !fallback) init();
      start();
    });
    io.observe(cv);

    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
      prog = null;
    };
    const onRestored = () => {
      if (!gl) return;
      build();
      start();
    };
    cv.addEventListener("webglcontextlost", onLost);
    cv.addEventListener("webglcontextrestored", onRestored);

    // tokens change with the Fill switch and the site theme
    const mo = new MutationObserver(() => st.redraw());
    const opts = { attributes: true, attributeFilter: ["data-theme", "data-fill"] };
    mo.observe(document.documentElement, opts);
    const themed = root.closest("[data-theme]");
    if (themed) mo.observe(themed, opts);
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => st.redraw();
    dark.addEventListener("change", onScheme);
    const onReduce = () => { st.reduced = rq.matches; st.redraw(); start(); };
    rq.addEventListener("change", onReduce);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cv.removeEventListener("webglcontextlost", onLost);
      cv.removeEventListener("webglcontextrestored", onRestored);
      dark.removeEventListener("change", onScheme);
      rq.removeEventListener("change", onReduce);
      st.kick = st.redraw = () => {};
    };
  }, []);

  const local = (e: PointerEvent) => {
    const r = cvRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: r.height / 2 - (e.clientY - r.top) };
  };

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic demo pointer */ }
    const st = S.current;
    st.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }] };
    st.w = st.tv = 0;
    st.kick();
  };

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const st = S.current;
    const l = local(e);
    st.lensX = l.x;
    st.lensY = l.y;
    st.lensOn = e.pointerType !== "touch";
    const d = st.drag;
    if (d && d.id === e.pointerId) {
      const r = (SIZE / 2) * R;
      st.spin += (e.clientX - d.x) / r;
      st.tilt = Math.max(-60 * DEG, Math.min(60 * DEG, st.tilt + (e.clientY - d.y) / r));
      d.x = e.clientX;
      d.y = e.clientY;
      const t = performance.now();
      d.samples.push({ t, x: e.clientX, y: e.clientY });
      while (d.samples.length > 2 && t - d.samples[0].t > 100) d.samples.shift();
      st.kick();
    } else st.kick();
  };

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const st = S.current, d = st.drag;
    if (!d || d.id !== e.pointerId) return;
    st.drag = null;
    if (e.pointerType === "touch") st.lensOn = false;
    const p = P.current;
    if (st.reduced) { st.w = st.tv = 0; st.kick(); return; }
    const a = d.samples[0], b = d.samples[d.samples.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    const r = (SIZE / 2) * R;
    st.w = (b.x - a.x) / r / dt;
    st.tv = (b.y - a.y) / r / dt;
    if (performance.now() - a.t > 160) st.w = st.tv = 0; // held still before letting go
    const deg = Math.abs(st.w) / DEG;
    const now = performance.now();
    if (deg > 180 && p.sound && p.onSound && now - st.lastWhoosh > 300) {
      st.lastWhoosh = now;
      const k = Math.min(deg / 720, 1);
      p.onSound("whoosh", { volume: (0.3 + 0.4 * k) * (p.volume / 100), pitch: 0.9 + 0.3 * k });
    }
    st.kick();
  };

  const onLeave = () => {
    S.current.lensOn = false;
    S.current.kick();
  };

  const onKey = (e: KeyboardEvent) => {
    const st = S.current;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => (st.reduced ? (st.spin -= 15 * DEG) : (st.w -= 30 * DEG)),
      ArrowRight: () => (st.reduced ? (st.spin += 15 * DEG) : (st.w += 30 * DEG)),
      ArrowUp: () => (st.tilt = Math.max(-60 * DEG, st.tilt - 8 * DEG)),
      ArrowDown: () => (st.tilt = Math.min(60 * DEG, st.tilt + 8 * DEG)),
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
    st.kick();
  };

  return (
    <div ref={rootRef} className="dgl" role="img" aria-label="Spinning globe" tabIndex={0} onKeyDown={onKey}>
      <canvas
        ref={cvRef}
        className="dgl-cv"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onLeave}
      />
      <span ref={probeRef} className="dgl-probe" aria-hidden="true" />
    </div>
  );
}
