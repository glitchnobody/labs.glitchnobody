/* ══ Halftone field ═══════════════════════════════════
   A field of halftone dots that swell under the pointer. Move across it and
   the dots near you grow and melt into a blob that trails behind; click to
   send a ripple ring outward. Enter or Space ripples from the centre.

   ── A SHADER PER PIXEL ───────────────────────────────
   The field is one WebGL fragment shader. For every pixel it looks at the
   nine nearest grid dots, works out how big each one should be from the
   pointer blob and any ripples, and measures the pixel's signed distance to
   each dot's shape. Nothing is drawn as separate circles.

   ── MELTING DOTS ─────────────────────────────────────
   The nine distances are combined with a smooth minimum instead of a plain
   minimum. Where two swollen dots come close, the smooth minimum bridges
   them with a soft neck, so neighbours merge into one blob like ink, while
   small resting dots stay crisp and separate.

   ── THE TRAIL ────────────────────────────────────────
   The blob's centre does not sit on the pointer; each frame it eases a
   share of the way toward it, so fast moves leave a stretched trail. A
   ripple is a ring whose radius grows at about 300 px a second; dots on
   the ring swell and shrink behind it. The loop stops when nothing moves,
   pauses off screen, and falls back to plain canvas circles without WebGL. */
import { useEffect, useRef, type CSSProperties } from "react";

export type HalftoneFieldProps = {
  radius?: number;
  strength?: number;
  lag?: number;
  shape?: "Circle" | "Square" | "Diamond";
  inverted?: boolean;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const W = 320, H = 220, S = 14, REST = 1.25, MAXR = 6;

const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uDpr, uS, uRest, uMax, uRad, uShape, uInv;
uniform vec3 uBlob; uniform vec4 uRip[${MAXR}]; uniform vec3 uFg, uBg;
float sd(vec2 q, float r) {
  if (uShape < .5) return length(q) - r;
  if (uShape < 1.5) { vec2 a = abs(q); return max(a.x, a.y) - r; }
  return (abs(q.x) + abs(q.y)) * .7071 - r;
}
float smin(float a, float b, float k) { k = max(k, 1e-4); float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 cell = floor(p / uS);
  float d = 1e3;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    vec2 c = (cell + vec2(float(i), float(j)) + .5) * uS;
    float bd = distance(c, uBlob.xy);
    float inf = uBlob.z * (1. - smoothstep(0., uRad, bd));
    float r = mix(uRest, uMax, inf);
    for (int k = 0; k < ${MAXR}; k++) {
      vec4 rp = uRip[k];
      if (rp.w <= 0.) continue;
      float ring = exp(-pow((distance(c, rp.xy) - rp.z) / 16., 2.)) * rp.w;
      r = max(r, mix(uRest, uS * .45, ring));
    }
    d = smin(d, sd(p - c, r), uS * .22 * smoothstep(uRest * 1.6, uS * .45, r));
  }
  float a = 1. - smoothstep(-.6, .6, d);
  gl_FragColor = vec4(mix(uBg, uFg, a), mix(uInv, 1., a));
}`;

const toRgb = (() => {
  let ctx: CanvasRenderingContext2D | null = null;
  return (css: string) => {
    ctx ??= document.createElement("canvas").getContext("2d");
    if (!ctx) return [0, 0, 0];
    ctx.fillStyle = "#000"; ctx.fillStyle = css;
    const v = ctx.fillStyle as string;
    if (v.startsWith("#")) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
    return (v.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((n) => +n / 255);
  };
})();

export function HalftoneField({
  radius = 70, strength = 1.15, lag = 45, shape = "Circle", inverted = false, sound = true, volume = 70, onSound,
}: HalftoneFieldProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const opts = useRef({ radius, strength, lag, shape, inverted, sound, volume, onSound });
  opts.current = { radius, strength, lag, shape, inverted, sound, volume, onSound };
  const api = useRef<{ kick: () => void; ripple: (x: number, y: number) => void; aim: (x: number, y: number, on: boolean) => void } | null>(null);
  const lastSnd = useRef({ whoosh: 0, jelly: 0, x: 0, y: 0, t: 0 });

  useEffect(() => { api.current?.kick(); }, [radius, strength, shape, inverted]);

  useEffect(() => {
    const canvas = cv.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const blob = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, amp: 0, on: false };
    const rips: { x: number; y: number; t0: number; pulse: boolean }[] = [];
    let colors = { fg: [0, 0, 0], bg: [1, 1, 1] };
    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const on = toRgb(cs.getPropertyValue("--fill-on").trim() || "#111"), slab = toRgb(cs.getPropertyValue("--fill-slab").trim() || "#fff");
      colors = opts.current.inverted ? { fg: slab, bg: on } : { fg: on, bg: slab };
    };

    let gl: WebGLRenderingContext | null = null, prog: WebGLProgram | null = null, ctx2d: CanvasRenderingContext2D | null = null;
    const U: Record<string, WebGLUniformLocation | null> = {};
    const init = () => {
      gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
      if (!gl) { ctx2d = canvas.getContext("2d"); return; }
      const sh = (type: number, src: string) => { const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s); return s; };
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; ctx2d = canvas.getContext("2d"); return; }
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ["uRes", "uDpr", "uS", "uRest", "uMax", "uRad", "uShape", "uInv", "uBlob", "uRip", "uFg", "uBg"]) U[n] = gl.getUniformLocation(prog, n);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    };

    const ripData = (now: number) => {
      const out = new Float32Array(MAXR * 4);
      rips.forEach((r, i) => {
        const t = (now - r.t0) / 1000;
        const z = r.pulse ? 0 : t * 300, w = r.pulse ? Math.max(0, 1 - t / 0.2) : Math.max(0, 1 - t / 1.4);
        out.set([r.x, r.y, z, w], i * 4);
      });
      return out;
    };

    const draw = (now: number) => {
      const o = opts.current;
      const maxR = (o.strength * S) / 2, sh = o.shape === "Square" ? 1 : o.shape === "Diamond" ? 2 : 0;
      if (gl && prog) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uDpr, dpr);
        gl.uniform1f(U.uS, S); gl.uniform1f(U.uRest, REST); gl.uniform1f(U.uMax, maxR); gl.uniform1f(U.uRad, o.radius);
        gl.uniform1f(U.uShape, sh); gl.uniform1f(U.uInv, o.inverted ? 1 : 0);
        gl.uniform3f(U.uBlob, blob.x, blob.y, blob.amp); gl.uniform4fv(U.uRip, ripData(now));
        gl.uniform3fv(U.uFg, colors.fg); gl.uniform3fv(U.uBg, colors.bg);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else if (ctx2d) {
        const c = ctx2d, rd = ripData(now);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, W, H);
        const rgb = (v: number[]) => `rgb(${v.map((n) => Math.round(n * 255)).join(",")})`;
        if (o.inverted) { c.fillStyle = rgb(colors.bg); c.fillRect(0, 0, W, H); }
        c.fillStyle = rgb(colors.fg);
        for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) {
          const bd = Math.hypot(x - blob.x, y - blob.y);
          const inf = blob.amp * (1 - Math.min(1, Math.max(0, bd / o.radius)) ** 2 * (3 - 2 * Math.min(1, bd / o.radius)));
          let r = REST + (maxR - REST) * inf;
          for (let k = 0; k < MAXR; k++) if (rd[k * 4 + 3] > 0) r = Math.max(r, REST + (S * 0.45 - REST) * Math.exp(-(((Math.hypot(x - rd[k * 4], y - rd[k * 4 + 1]) - rd[k * 4 + 2]) / 16) ** 2)) * rd[k * 4 + 3]);
          c.beginPath();
          if (sh === 1) c.rect(x - r, y - r, r * 2, r * 2);
          else if (sh === 2) { c.moveTo(x, y - r * 1.41); c.lineTo(x + r * 1.41, y); c.lineTo(x, y + r * 1.41); c.lineTo(x - r * 1.41, y); }
          else c.arc(x, y, r, 0, Math.PI * 2);
          c.fill();
        }
      }
    };

    let raf = 0, running = false, visible = false, last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const o = opts.current;
      const k = reduced || o.lag <= 0 ? 1 : 1 - Math.pow(1 - (0.5 - (o.lag / 100) * 0.46), dt * 60);
      blob.x += (blob.tx - blob.x) * k; blob.y += (blob.ty - blob.y) * k;
      blob.amp = blob.on ? Math.min(1, blob.amp + dt * 6) : Math.max(0, blob.amp - dt / 0.4);
      for (let i = rips.length - 1; i >= 0; i--) if ((now - rips[i].t0) / 1000 > (rips[i].pulse ? 0.2 : 1.4)) rips.splice(i, 1);
      draw(now);
      const settled = !blob.on && blob.amp <= 0 && !rips.length;
      const still = blob.on && Math.abs(blob.tx - blob.x) < 0.2 && Math.abs(blob.ty - blob.y) < 0.2 && blob.amp >= 1 && !rips.length;
      if (settled || still || !visible) { running = false; last = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!visible) return;
      if (!gl && !ctx2d) init();
      readColors();
      if (!running) { running = true; raf = requestAnimationFrame(frame); }
    };
    api.current = {
      kick,
      aim: (x, y, on) => { if (on && !blob.on && blob.amp <= 0) { blob.x = x; blob.y = y; } blob.tx = x; blob.ty = y; blob.on = on; kick(); },
      ripple: (x, y) => { rips.push({ x, y, t0: performance.now(), pulse: reduced }); if (rips.length > MAXR) rips.shift(); kick(); },
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(canvas);
    const mo = new MutationObserver(() => kick());
    mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["data-theme"] });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); api.current = null; };
  }, []);

  const snd = (name: string, o: { volume?: number; pitch?: number }) => {
    const p = opts.current;
    if (p.sound && p.onSound) p.onSound(name, { ...o, volume: (o.volume ?? 1) * (p.volume / 100) });
  };
  const local = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  return (
    <div className="htf" data-inverted={inverted} style={{ "--htf-w": `${W}px`, "--htf-h": `${H}px` } as CSSProperties}>
      <canvas
        ref={cv}
        className="htf-cv"
        tabIndex={0}
        role="img"
        aria-label="Halftone dot field"
        onPointerMove={(e) => {
          const p = local(e);
          api.current?.aim(p.x, p.y, true);
          const l = lastSnd.current, t = performance.now();
          if (l.t) {
            const v = Math.hypot(e.clientX - l.x, e.clientY - l.y) / Math.max(1, t - l.t) * 1000;
            if (v > 1200 && t - l.whoosh > 400) { l.whoosh = t; snd("whoosh", { volume: 0.25 + 0.3 * Math.min(v / 3000, 1) }); }
          }
          l.x = e.clientX; l.y = e.clientY; l.t = t;
        }}
        onPointerLeave={(e) => { const p = local(e); api.current?.aim(p.x, p.y, false); lastSnd.current.t = 0; }}
        onPointerUp={(e) => { if (e.pointerType === "touch") { const p = local(e); api.current?.aim(p.x, p.y, false); } }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          api.current?.ripple(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
          const t = performance.now();
          if (t - lastSnd.current.jelly > 150) { lastSnd.current.jelly = t; snd("jelly", { volume: 0.45, pitch: 0.95 + Math.random() * 0.1 }); }
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          api.current?.ripple(W / 2, H / 2);
          snd("jelly", { volume: 0.45 });
        }}
      />
    </div>
  );
}
