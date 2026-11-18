/* ══ Heat text ════════════════════════════════════
   Words that heat up under your pointer. Move across the text and you leave
   a thermal-camera trail that blooms from blue to red to yellow, swallows the
   letters, and cools away by itself. The words stay real, selectable text.

   ── A HEAT FIELD ON THE GPU ───────────────────────
   Heat lives in a small floating-point texture, about 128 × 144 cells, that
   two framebuffers pass back and forth every frame. One shader pass blurs it
   a little (so heat spreads and blobs merge), multiplies it by a decay worked
   out from the cooling time and the frame time, and adds soft Gaussian
   splats along every pointer movement since the last frame, spaced half a
   brush apart so fast strokes still leave a continuous line.

   ── FASTER IS HOTTER ──────────────────────────────
   Each splat's strength is the heat setting scaled by pointer speed, and
   scaled down for tiny moves, so a resting pointer adds nothing while a quick
   stroke, or one crossing an old trail, piles up enough heat to reach yellow
   and white.

   ── FROM HEAT TO COLOUR ───────────────────────────
   A second pass reads the heat and looks its colour up in a one-pixel-tall
   gradient texture (the palette). Below a threshold the pixel is
   transparent; Goo sets how sharp that threshold is, from a soft fog to the
   hard, blobby edges of a thermal camera. Ink and Pick build the gradient
   from the site's colour tokens and rebuild it when the theme changes.

   ── RESTING ───────────────────────────────────────
   When the heat has had time to fade the loop stops and the sizzle fades
   out. With idle drift on, a faint warm spot wanders over the words after a
   few seconds without a pointer. The WebGL context exists only while the
   block is near the screen, and without WebGL the text simply stands alone. */

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Loop = { stop?: (fadeMs?: number) => void; setPitch?: (n: number) => void; setVolume?: (n: number) => void };
type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type HeatTextProps = {
  /** the words, one per line */
  text?: string;
  /** px */
  fontSize?: number;
  /** em */
  tracking?: number;
  /** heat splat radius in px */
  brush?: number;
  /** 10 to 100: heat each movement adds */
  heat?: number;
  /** seconds for heat to fall to 5% */
  cooling?: number;
  palette?: "Thermal" | "Infrared" | "Ink" | "Pick";
  /** 0 soft fog to 100 hard blobs */
  goo?: number;
  /** a warm spot wanders when untouched */
  drift?: boolean;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const RAMPS: Record<NonNullable<HeatTextProps["palette"]>, [number, string][]> = {
  Thermal: [[0, "#3d7bff"], [0.35, "#c2185b"], [0.6, "#ff9ec4"], [0.85, "#fff36b"], [1, "#ffffff"]],
  Infrared: [[0, "#3b0000"], [0.35, "#c81e1e"], [0.6, "#ff7a1a"], [0.85, "#ffe9b0"], [1, "#ffffff"]],
  Ink: [[0, "color-mix(in srgb, var(--fill-on) 30%, transparent)"], [0.6, "var(--fill-on)"], [1, "var(--ink-3)"]],
  Pick: [[0, "color-mix(in srgb, var(--pick) 30%, var(--fill-slab))"], [0.6, "var(--pick)"], [1, "color-mix(in srgb, var(--pick) 40%, white)"]],
};

const BLEED = 16;
const MAXPTS = 32;

const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;`;
const UPDATE = `${HEAD}
uniform sampler2D u_prev;uniform vec2 u_texel,u_size;uniform float u_decay,u_sub,u_sigma;
uniform vec3 u_pts[${MAXPTS}];uniform int u_n;
float s(vec2 o){return texture2D(u_prev,v+o*u_texel).r;}
void main(){
  float h=s(vec2(0.))*.6+(s(vec2(1.,0.))+s(vec2(-1.,0.))+s(vec2(0.,1.))+s(vec2(0.,-1.)))*.1;
  h=max(0.,h*u_decay-u_sub);
  vec2 px=v*u_size;
  for(int i=0;i<${MAXPTS};i++){if(i>=u_n)break;vec2 d=px-u_pts[i].xy;h+=u_pts[i].z*exp(-dot(d,d)/(2.*u_sigma*u_sigma));}
  gl_FragColor=vec4(h,0.,0.,1.);
}`;
const DISPLAY = `${HEAD}
uniform sampler2D u_heat,u_ramp;uniform float u_t,u_w,u_k;
void main(){
  float h=texture2D(u_heat,v).r/u_k;
  vec4 c=texture2D(u_ramp,vec2(clamp(h*.8,0.,1.),.5));
  float a=smoothstep(u_t,u_t+u_w,h)*c.a;
  gl_FragColor=vec4(c.rgb*a,a);
}`;

export function HeatText({
  text = "COLOR CHANGES EVERYTHING DEPENDING ON HOW LIGHT TOUCHES IT",
  fontSize = 30,
  tracking = 0.04,
  brush = 26,
  heat = 60,
  cooling = 2.2,
  palette = "Thermal",
  goo = 70,
  drift = true,
  sound = true,
  volume = 70,
  onSound,
}: HeatTextProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [inCard, setInCard] = useState(false);
  const live = useRef({ brush, heat, cooling, palette, goo, drift, loud: 0, onSound, kick: () => {}, rampDirty: true });
  Object.assign(live.current, { brush, heat, cooling, palette, goo, drift, loud: sound && onSound ? volume / 100 : 0, onSound });

  const words = text.trim().split(/\s+/).filter(Boolean);
  // on the wall, shrink the type so every line fits the card's stage
  const fs = inCard ? Math.min(fontSize, 320 / (Math.max(1, words.length) * 1.05)) : fontSize;

  useEffect(() => setInCard(!!root.current?.closest(".card")), []);
  useEffect(() => {
    live.current.rampDirty = true;
    live.current.kick();
  }, [palette, drift]);

  useEffect(() => {
    const el = root.current!, cv = canvas.current!;
    const L = live.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let gl: WebGLRenderingContext | null = null;
    let g: ReturnType<typeof build> | null = null;
    let raf = 0, last = 0, lastInput = performance.now(), inside = false;
    let prev: { x: number; y: number; t: number } | null = null;
    let segs: { x0: number; y0: number; x1: number; y1: number; amt: number }[] = [];
    let energy = 0, speed = 0, loop: Loop | null = null;
    let cw = 1, ch = 1;

    const shader = (c: WebGLRenderingContext, type: number, src: string) => {
      const s = c.createShader(type)!;
      c.shaderSource(s, src);
      c.compileShader(s);
      return s;
    };
    const program = (c: WebGLRenderingContext, frag: string) => {
      const p = c.createProgram()!;
      c.attachShader(p, shader(c, c.VERTEX_SHADER, VERT));
      c.attachShader(p, shader(c, c.FRAGMENT_SHADER, frag));
      c.bindAttribLocation(p, 0, "p");
      c.linkProgram(p);
      if (!c.getProgramParameter(p, c.LINK_STATUS)) throw new Error(c.getProgramInfoLog(p) ?? "link");
      const u = (n: string) => c.getUniformLocation(p, n);
      return { p, u };
    };

    // every GL object, built from scratch (also after a lost context)
    function build(c: WebGLRenderingContext) {
      const half = c.getExtension("OES_texture_half_float");
      const lin = c.getExtension("OES_texture_half_float_linear");
      c.getExtension("EXT_color_buffer_half_float");
      const buf = c.createBuffer();
      c.bindBuffer(c.ARRAY_BUFFER, buf);
      c.bufferData(c.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), c.STATIC_DRAW);
      c.enableVertexAttribArray(0);
      c.vertexAttribPointer(0, 2, c.FLOAT, false, 0, 0);
      const up = program(c, UPDATE), dp = program(c, DISPLAY);
      const ramp = c.createTexture();
      return { half, lin, up, dp, ramp, tex: [] as WebGLTexture[], fb: [] as WebGLFramebuffer[], cur: 0, sw: 1, sh: 1, k: 1 };
    }

    // sim textures sized to the canvas aspect; half float if renderable, else bytes
    function resizeSim() {
      if (!gl || !g) return;
      const c = gl;
      g.tex.forEach((t) => c.deleteTexture(t));
      g.fb.forEach((f) => c.deleteFramebuffer(f));
      g.sh = 144;
      g.sw = Math.max(32, Math.min(256, Math.round((144 * cw) / ch)));
      const make = (type: number, filter: number) => {
        const tex: WebGLTexture[] = [], fb: WebGLFramebuffer[] = [];
        for (let i = 0; i < 2; i++) {
          const t = c.createTexture()!;
          c.bindTexture(c.TEXTURE_2D, t);
          c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, g!.sw, g!.sh, 0, c.RGBA, type, null);
          c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, filter);
          c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, filter);
          c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.CLAMP_TO_EDGE);
          c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.CLAMP_TO_EDGE);
          const f = c.createFramebuffer()!;
          c.bindFramebuffer(c.FRAMEBUFFER, f);
          c.framebufferTexture2D(c.FRAMEBUFFER, c.COLOR_ATTACHMENT0, c.TEXTURE_2D, t, 0);
          tex.push(t);
          fb.push(f);
        }
        const ok = c.checkFramebufferStatus(c.FRAMEBUFFER) === c.FRAMEBUFFER_COMPLETE;
        if (!ok) {
          tex.forEach((t) => c.deleteTexture(t));
          fb.forEach((f) => c.deleteFramebuffer(f));
        }
        return ok ? { tex, fb } : null;
      };
      let r = g.half ? make(g.half.HALF_FLOAT_OES, g.lin ? c.LINEAR : c.NEAREST) : null;
      g.k = 1;
      if (!r) {
        r = make(c.UNSIGNED_BYTE, c.LINEAR);
        g.k = 0.5; // bytes clamp at 1: store half the heat so white is still reachable
      }
      g.tex = r?.tex ?? [];
      g.fb = r?.fb ?? [];
      c.bindFramebuffer(c.FRAMEBUFFER, null);
    }

    function buildRamp() {
      if (!gl || !g || !probe.current) return;
      const cnv = document.createElement("canvas");
      cnv.width = 256;
      cnv.height = 1;
      const x = cnv.getContext("2d")!;
      const grad = x.createLinearGradient(0, 0, 256, 0);
      for (const [at, css] of RAMPS[L.palette] ?? RAMPS.Thermal) {
        probe.current.style.color = css;
        grad.addColorStop(at, getComputedStyle(probe.current).color);
      }
      x.fillStyle = grad;
      x.fillRect(0, 0, 256, 1);
      gl.bindTexture(gl.TEXTURE_2D, g.ramp);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cnv);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      L.rampDirty = false;
    }

    function size() {
      cw = el.clientWidth + BLEED * 2;
      ch = el.clientHeight + BLEED * 2;
      const dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      resizeSim();
    }

    function init() {
      try {
        gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
        if (!gl) return;
        g = build(gl);
        size();
        L.rampDirty = true;
        start();
      } catch {
        gl = null;
        g = null;
      }
    }

    function release() {
      stop();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      gl = null;
      g = null;
    }

    const drifting = (t: number) => L.drift && !reduced.matches && !inside && t - lastInput > 3000;

    function frame(t: number) {
      raf = 0;
      if (!gl || !g || !g.fb.length) return;
      const c = gl;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      if (L.rampDirty) buildRamp();
      const cool = L.cooling * (reduced.matches ? 0.5 : 1);
      const decay = Math.pow(0.05, dt / cool);

      // pointer segments → splat points, half a brush apart
      const pts: number[] = [];
      const step = L.brush / 2;
      let added = 0;
      for (const s of segs) {
        const len = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
        const n = Math.min(Math.max(1, Math.ceil(len / step)), MAXPTS - pts.length / 3);
        const a = s.amt * Math.min(1, len / step);
        for (let i = 1; i <= n; i++) {
          pts.push(s.x0 + ((s.x1 - s.x0) * i) / n, ch - (s.y0 + ((s.y1 - s.y0) * i) / n), a * g.k);
          added += a;
        }
      }
      segs = [];
      const dr = drifting(t);
      if (dr) {
        const k = t / 1000;
        const x = cw / 2 + (cw / 2 - BLEED * 2) * (0.6 * Math.sin(k * 0.31) + 0.4 * Math.sin(k * 0.73 + 1.7));
        const y = ch / 2 + (ch / 2 - BLEED * 2) * (0.6 * Math.sin(k * 0.23 + 0.5) + 0.4 * Math.sin(k * 0.57 + 2.9));
        pts.push(x, ch - y, 0.012 * g.k * (L.heat / 60));
        added += 0.012;
      }

      // update: blur, cool, add
      const nxt = 1 - g.cur;
      c.bindFramebuffer(c.FRAMEBUFFER, g.fb[nxt]);
      c.viewport(0, 0, g.sw, g.sh);
      c.useProgram(g.up.p);
      c.activeTexture(c.TEXTURE0);
      c.bindTexture(c.TEXTURE_2D, g.tex[g.cur]);
      c.uniform1i(g.up.u("u_prev"), 0);
      c.uniform2f(g.up.u("u_texel"), 1 / g.sw, 1 / g.sh);
      c.uniform2f(g.up.u("u_size"), cw, ch);
      c.uniform1f(g.up.u("u_decay"), decay);
      // a small floor-cut so heat really reaches zero (bytes need a full step)
      c.uniform1f(g.up.u("u_sub"), (g.k < 1 ? 0.0025 : 0.0003) * dt * 60);
      c.uniform1f(g.up.u("u_sigma"), L.brush / 2);
      c.uniform1i(g.up.u("u_n"), pts.length / 3);
      if (pts.length) c.uniform3fv(g.up.u("u_pts"), new Float32Array(pts));
      c.drawArrays(c.TRIANGLES, 0, 3);
      g.cur = nxt;

      // display
      c.bindFramebuffer(c.FRAMEBUFFER, null);
      c.viewport(0, 0, cv.width, cv.height);
      c.clearColor(0, 0, 0, 0);
      c.clear(c.COLOR_BUFFER_BIT);
      c.useProgram(g.dp.p);
      c.bindTexture(c.TEXTURE_2D, g.tex[g.cur]);
      c.uniform1i(g.dp.u("u_heat"), 0);
      c.activeTexture(c.TEXTURE1);
      c.bindTexture(c.TEXTURE_2D, g.ramp);
      c.uniform1i(g.dp.u("u_ramp"), 1);
      c.activeTexture(c.TEXTURE0);
      const gooF = Math.max(0, Math.min(1, L.goo / 100));
      c.uniform1f(g.dp.u("u_t"), 0.06);
      c.uniform1f(g.dp.u("u_w"), 0.004 + 0.3 * (1 - gooF) ** 2);
      c.uniform1f(g.dp.u("u_k"), g.k);
      c.drawArrays(c.TRIANGLES, 0, 3);

      // the sizzle follows a CPU estimate of the total heat
      energy = energy * decay + added;
      speed *= Math.pow(0.02, dt);
      const quiet = t - lastInput > cool * 2500 + 300;
      if (L.loud && L.onSound) {
        const v = Math.min(1, energy / 1.5) * (dr && quiet ? 0.1 : 0.6) * L.loud;
        if (!loop && added > 0) {
          const h = L.onSound("heat", { loop: true, volume: v });
          loop = (h && typeof h === "object" ? h : {}) as Loop;
        }
        loop?.setVolume?.(v);
        loop?.setPitch?.(0.9 + 0.2 * Math.min(1, speed));
      } else stopLoop();

      if (quiet && !(L.drift && !reduced.matches)) {
        stopLoop();
        energy = 0;
        last = 0;
        return; // at rest: the next pointer move restarts the loop
      }
      raf = requestAnimationFrame(frame);
    }

    function stopLoop() {
      loop?.stop?.(300);
      loop = null;
    }
    function start() {
      if (!raf && gl) raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      stopLoop();
    }
    L.kick = start;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left + BLEED, y = e.clientY - r.top + BLEED, t = e.timeStamp || performance.now();
      inside = true;
      lastInput = performance.now();
      if (prev) {
        const len = Math.hypot(x - prev.x, y - prev.y);
        const v = len / Math.max(8, t - prev.t);
        speed = Math.max(speed, Math.min(2, v));
        const amt = 1.1 * (L.heat / 100) * Math.min(1.8, Math.max(0.6, 0.6 + 0.8 * v));
        segs.push({ x0: prev.x, y0: prev.y, x1: x, y1: y, amt });
      }
      prev = { x, y, t };
      start();
    };
    const onLeave = () => {
      prev = null;
      inside = false;
      lastInput = performance.now();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);

    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
      g = null;
    };
    const onRestored = () => {
      if (!gl) return;
      g = build(gl);
      size();
      L.rampDirty = true;
      start();
    };
    cv.addEventListener("webglcontextlost", onLost);
    cv.addEventListener("webglcontextrestored", onRestored);

    const ro = new ResizeObserver(() => {
      if (!gl) return;
      size();
      start();
    });
    ro.observe(el);

    // create the context lazily near the screen, drop it when far away
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting && !gl) init();
        else if (!en.isIntersecting && gl) release();
      },
      { rootMargin: "400px" },
    );
    io.observe(el);

    // Ink and Pick read tokens: rebuild the ramp when the theme changes
    const mo = new MutationObserver(() => {
      L.rampDirty = true;
      start();
    });
    const themed = el.closest("[data-theme]");
    const opts = { attributes: true, attributeFilter: ["data-theme", "data-fill"] };
    mo.observe(document.documentElement, opts);
    if (themed) mo.observe(themed, opts);
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      L.rampDirty = true;
      start();
    };
    dark.addEventListener("change", onScheme);

    return () => {
      release();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      dark.removeEventListener("change", onScheme);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      cv.removeEventListener("webglcontextlost", onLost);
      cv.removeEventListener("webglcontextrestored", onRestored);
      L.kick = () => {};
    };
  }, []);

  return (
    <div
      ref={root}
      className="htx"
      style={{ "--htx-fs": `${fs}px`, "--htx-track": `${tracking}em`, "--htx-bleed": `${BLEED}px` } as CSSProperties}
    >
      <p className="htx-text">
        {words.map((w, i) => (
          <span key={i} className="htx-word">
            {w}{" "}
          </span>
        ))}
      </p>
      <canvas ref={canvas} className="htx-canvas" aria-hidden="true" />
      <span ref={probe} className="htx-probe" aria-hidden="true" />
    </div>
  );
}
