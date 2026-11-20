import { Icon } from "@iconify/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { blocks, type Knob } from "../lab";
import { play } from "../lab/sound";
import Block from "./Block";

type Code = { files: { name: string; html: string }[]; how: { title: string; text: string }[] };

const COPY = "ph:copy";
const CHECK = "ph:check";

/* the player handed out with "Copy prompt", so the copied component can make its sounds */
const PLAYER = `// sound.ts: plays /sounds/<name>.mp3 through Web Audio, decoded once and cached
const ctx = new AudioContext();
const cache = new Map<string, Promise<AudioBuffer>>();

export function play(name: string, { volume = 1, pitch = 1, loop = false } = {}) {
  ctx.resume();
  if (!cache.has(name))
    cache.set(name, fetch(\`/sounds/\${name}.mp3\`).then((r) => r.arrayBuffer()).then((d) => ctx.decodeAudioData(d)));
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.playbackRate.value = pitch;
  source.loop = loop;
  gain.gain.value = volume;
  source.connect(gain).connect(ctx.destination);
  let stopped = false;
  cache.get(name)!.then((buffer) => {
    if (stopped) return;
    source.buffer = buffer;
    source.start();
  });
  /* a loop (loop: true) follows a hold or progress, then fades out */
  return {
    stop(fadeMs = 0) {
      stopped = true;
      gain.gain.setTargetAtTime(0, ctx.currentTime, fadeMs / 3000 || 0.001);
      if (source.buffer) source.stop(ctx.currentTime + fadeMs / 1000 + 0.05);
    },
    setPitch: (n: number) => source.playbackRate.setTargetAtTime(n, ctx.currentTime, 0.02),
    setVolume: (n: number) => gain.gain.setTargetAtTime(n, ctx.currentTime, 0.02),
  };
}`;

/* copies what `text` returns, and says so for a moment */
function Copy({ text, label, className = "icon", icon }: { text: () => string; label: string; className?: string; icon?: string }) {
  const [state, setState] = useState("");
  return (
    <button
      type="button"
      className={className}
      data-quiet /* its sound is the pop on success */
      aria-label={className === "icon" ? label : undefined}
      onClick={async (e) => {
        e.preventDefault(); // inside a <summary>, a click would also toggle it
        try {
          await navigator.clipboard.writeText(text());
          setState("Copied");
          play("pop", { volume: 0.4 });
        } catch {
          setState("Copy failed");
        }
        setTimeout(() => setState(""), 1500);
      }}
    >
      {className === "icon" ? <Icon icon={state === "Copied" ? CHECK : COPY} /> : <>{icon && <Icon icon={icon} />}{state || label}</>}
    </button>
  );
}

function Section({ title, open, copy = true, text, children }: { title: string; open?: boolean; copy?: boolean; text?: () => string; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <details className="sec" open={open}>
      <summary>
        <Icon icon="ph:caret-right" />
        {title}
        {copy && <Copy label={`Copy ${title.toLowerCase()}`} text={text ?? (() => body.current!.innerText)} />}
      </summary>
      <div className="sec-body" ref={body}>
        {children}
      </div>
    </details>
  );
}

const TICKS = 47; // at most one every 6px across the 280px panel
const CHEVRON = "ph:caret-down";

/* "Size (px)" -> the label "Size" and the unit "px", so the value reads "40px" like a design tool */
const unitOf = (label: string) => {
  const m = label.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { name: m[1], unit: m[2] } : { name: label, unit: "" };
};

/* a row with a label and a switch: every on/off setting */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="knob toggle">
      <span>{label}</span>
      <input type="checkbox" className="switch" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/* one component, opened: the live block, its knobs, and its code */
/* a slider: a line with a dot until the pointer arrives, then a row of ticks (one per allowed value) with a tall handle.
   Dragging leaves a wake: every tick the handle passes jumps up by how fast it was dragged, then settles back
   (an exponential fall, like the wake slider), so quick drags leave a taller wave than slow ones. */
function Range({ k, value, onChange }: { k: Extract<Knob, { type: "range" }>; value: number; onChange: (n: number) => void }) {
  const { name, unit } = unitOf(k.label);
  const ticks = Math.max(2, Math.min(TICKS, Math.round((k.max - k.min) / (k.step ?? 1)) + 1));
  const at = (v: number) => Math.round(((v - k.min) / (k.max - k.min)) * (ticks - 1));
  const here = at(value);
  const els = useRef<(HTMLElement | null)[]>([]);
  const w = useRef({ energy: new Float32Array(ticks), raf: 0, last: here, t: 0, speed: 0 });

  /* a new tick count is a new row */
  useEffect(() => {
    w.current.energy = new Float32Array(ticks);
  }, [ticks]);
  useEffect(() => () => cancelAnimationFrame(w.current.raf), []);

  const loop = () => {
    const s = w.current;
    if (s.raf) return;
    let prev = performance.now();
    const run = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const fall = Math.exp(-dt * 6.5);
      let live = false;
      for (let i = 0; i < s.energy.length; i++) {
        s.energy[i] *= fall;
        if (s.energy[i] < 0.002) s.energy[i] = 0;
        else live = true;
        const el = els.current[i];
        if (el) el.style.transform = s.energy[i] ? `scaleY(${(1 + s.energy[i] * (1 / 0.6 - 1)).toFixed(3)})` : "";
      }
      s.raf = live ? requestAnimationFrame(run) : 0;
    };
    s.raf = requestAnimationFrame(run);
  };

  const change = (n: number) => {
    const s = w.current;
    const b = at(n);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && b !== s.last) {
      const now = performance.now();
      const dt = Math.max(0.008, (now - s.t) / 1000);
      s.t = now;
      /* speed in px per second (ticks sit about 6px apart), smoothed so one jittery frame cannot fake a fling */
      s.speed = s.speed * 0.5 + ((Math.abs(b - s.last) * 6) / dt) * 0.5;
      const push = Math.min(1, 0.4 + s.speed / 500); // a gentle drag lifts the wake 40% of the way, an ordinary one reaches the full slider height
      for (let i = Math.min(b, s.last); i <= Math.max(b, s.last); i++) s.energy[i] = Math.max(s.energy[i], push);
      loop();
    }
    s.last = b;
    onChange(n);
  };

  return (
    <label className="knob range" style={{ "--p": `${((value - k.min) / (k.max - k.min)) * 100}%` } as CSSProperties}>
      <span>{name}</span>
      <output>
        {value}
        {unit && <small>{unit}</small>}
      </output>
      <span className="rail" aria-hidden="true">
        <span className="ticks">
          {Array.from({ length: ticks }, (_, i) => (
            <i
              key={i}
              ref={(el) => {
                els.current[i] = el;
              }}
              data-on={i <= here || undefined}
              data-here={i === here || undefined}
            />
          ))}
        </span>
        <i className="fill" />
        <i className="thumb" />
      </span>
      <input type="range" min={k.min} max={k.max} step={k.step ?? 1} value={value} onChange={(e) => change(Number(e.target.value))} />
    </label>
  );
}

export default function Detail({ slug, onClose }: { slug: string; onClose: () => void }) {
  const meta = blocks[slug];
  const [props, setProps] = useState<Record<string, any>>(() =>
    Object.fromEntries(meta.knobs.map((k) => [k.prop, k.default])),
  );
  const set = (prop: string, value: unknown) => setProps((p) => ({ ...p, [prop]: value }));
  const [view, setView] = useState<"block" | "code">("block");
  /* the stage starts in the page's theme, then goes its own way */
  const [fill, setFill] = useState(
    () => document.documentElement.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
  /* the code view (highlighted files and how-it-works notes) comes from the server
     route /api/code/$slug, cached by TanStack Query so reopening a component is instant */
  const { data, isError } = useQuery({
    queryKey: ["code", slug],
    queryFn: () => fetch(`/api/code/${slug}`).then((r) => r.json() as Promise<Code>),
    staleTime: Infinity,
  });
  const code: Code | null = data ?? (isError ? { files: [], how: [] } : null);

  /* the usage snippet follows the knobs, so what is copied is what is on the stage */
  const name = code?.files[0]?.name.replace(".tsx", "") ?? "";
  const sounds = meta.sounds ?? [];
  const attrs =
    meta.knobs
      .map(({ prop }) => {
        const v = props[prop];
        if (typeof v !== "string") return ` ${prop}={${v}}`;
        return /["{}]/.test(v) ? ` ${prop}={${JSON.stringify(v)}}` : ` ${prop}="${v}"`;
      })
      .join("") + (sounds.length ? " onSound={play}" : "");
  const usage = `import { ${name} } from "./${name}";\nimport "./${name}.css";\n${sounds.length ? `import { play } from "./sound";\n` : ""}\nexport default function Demo() {\n  return <${name}${attrs} />;\n}`;
  const soundUrl = (s: string) => `${location.origin}/sounds/${s}.mp3`;

  const plain = (html: string) => new DOMParser().parseFromString(html, "text/html").body.innerText;
  const prompt = () =>
    [
      `Add the "${meta.name}" React component to this project. ${meta.description}`,
      meta.install && `Install its packages:\n\n${meta.install}`,
      ...(code?.files ?? []).map((f) => `Create ${f.name}:\n\n${plain(f.html)}`),
      `It reads its colours from CSS custom properties (--fill-on, --fill-slab, --ink…). Map them to the project's theme.`,
      sounds.length &&
        `It makes sounds through its onSound prop. Download these files into public/sounds/:\n\n${sounds.map(soundUrl).join("\n")}\n\nThen create sound.ts, the player Usage passes as onSound:\n\n${PLAYER}`,
      `Use it like this:\n\n${usage}`,
    ]
      .filter(Boolean)
      .join("\n\n");

  const knob = (k: Knob) => {
    const value = props[k.prop];
    if (k.type === "range") return <Range key={k.prop} k={k} value={value} onChange={(n) => set(k.prop, n)} />;
    if (k.type === "text")
      return (
        <label key={k.prop} className="knob text">
          <span>{k.label}</span>
          <input
            type="text"
            value={value}
            maxLength={k.maxLength}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => set(k.prop, e.target.value)}
          />
        </label>
      );
    if (k.type === "select" && k.options.length <= 4)
      return (
        <div key={k.prop} className="knob choice" role="radiogroup" aria-label={k.label}>
          <span>{k.label}</span>
          <div className="opts">
            {k.options.map((o) => (
              <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => set(k.prop, o)}>
                {o}
              </button>
            ))}
          </div>
        </div>
      );
    if (k.type === "select")
      return (
        <label key={k.prop} className="knob select">
          <span>{k.label}</span>
          <span className="val">
            {value}
            <Icon icon={CHEVRON} />
          </span>
          <select value={value} onChange={(e) => set(k.prop, e.target.value)} aria-label={k.label}>
            {k.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      );
    return <Toggle key={k.prop} label={k.label} on={!!value} onChange={(v) => set(k.prop, v)} />;
  };

  return (
    <div className="detail">
      <section className="stage" data-shortcut-scope data-theme={fill} data-fill={fill} aria-label={`${meta.name} preview`}>
        <div className="stage-bar">
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "block"} onClick={() => setView("block")}>
              Block
            </button>
            <button type="button" aria-pressed={view === "code"} onClick={() => setView("code")}>
              Code
            </button>
          </div>
          <div className="bar-actions">
            {view === "code" ? (
              <Copy className="pill solid" label="Copy prompt" text={prompt} />
            ) : (
              <button
                type="button"
                className="icon"
                aria-label={fill === "dark" ? "Preview in light mode" : "Preview in dark mode"}
                title={fill === "dark" ? "Light mode" : "Dark mode"}
                onClick={() => setFill(fill === "dark" ? "light" : "dark")}
              >
                <Icon icon={fill === "dark" ? "ph:sun" : "ph:moon"} />
              </button>
            )}
          </div>
        </div>

        <div className="stage-block" hidden={view !== "block"}>
          <Block slug={slug} props={props} />
        </div>

        <div className="stage-code" hidden={view !== "code"}>
          {/* always there, so every component reads the same; nothing to copy when there is nothing to install */}
          <Section title="Install" open copy={!!meta.install}>
            {meta.install ? <pre>{meta.install}</pre> : <p className="none">No packages beyond React.</p>}
          </Section>
          <Section title="Usage">
            <pre>{usage}</pre>
          </Section>
          <Section title="Code">
            {code?.files.map((f) => (
              <div key={f.name} className="file">
                <h3>{f.name}</h3>
                <div dangerouslySetInnerHTML={{ __html: f.html }} />
              </div>
            ))}
          </Section>
          {!!sounds.length && (
            <Section title="Sound" text={() => sounds.map(soundUrl).join("\n")}>
              <p className="none">Played through the onSound prop; "Copy prompt" includes the files and a small player.</p>
              <ul className="sounds">
                {sounds.map((s) => (
                  <li key={s}>
                    <span>{s}.mp3</span>
                    <button type="button" className="pill" onClick={() => play(s)}>
                      Play
                    </button>
                    <a className="pill" href={`/sounds/${s}.mp3`} download>
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {!!code?.how.length && (
            <Section title="How it works">
              <div className="how">
                {code.how.map((note, i) => (
                  <p key={i}>
                    {note.title && <strong>{note.title}. </strong>}
                    {note.text}
                  </p>
                ))}
              </div>
            </Section>
          )}
        </div>
      </section>

      <aside className="panel">
        <header>
          <h2>{meta.name}</h2>
          <button type="button" className="icon" onClick={onClose} aria-label="Close">
            <Icon icon="ph:x" />
          </button>
        </header>
        <p>{meta.description}</p>
        {meta.knobs.map(knob)}
        {meta.adaptedFrom && (
          <p className="credit">
            Adapted from <a href={meta.adaptedFrom}>this source</a>; see THIRD_PARTY.md.
          </p>
        )}
        <Copy className="pill outline" label="Share" icon="ph:link" text={() => location.href} />
      </aside>
    </div>
  );
}
