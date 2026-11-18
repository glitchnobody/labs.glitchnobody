import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { blocks, type Knob } from "../lab";
import { play } from "../lab/sound";
import Block from "./Block";

type Code = { files: { name: string; html: string }[]; how: { title: string; text: string }[] };

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

const COPY = "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1";
const CHECK = "m5 12.5 4.5 4.5L19 7.5";

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
      {className === "icon" ? <Icon d={state === "Copied" ? CHECK : COPY} /> : <>{icon && <Icon d={icon} />}{state || label}</>}
    </button>
  );
}

function Section({ title, open, copy = true, text, children }: { title: string; open?: boolean; copy?: boolean; text?: () => string; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <details className="sec" open={open}>
      <summary>
        <Icon d="m9 6 6 6-6 6" />
        {title}
        {copy && <Copy label={`Copy ${title.toLowerCase()}`} text={text ?? (() => body.current!.innerText)} />}
      </summary>
      <div className="sec-body" ref={body}>
        {children}
      </div>
    </details>
  );
}

/* a row of options; every knob that is not a range is one of these */
function Seg<T>({ label, value, options, onChange }: { label: string; value: T; options: [string, T][]; onChange: (v: T) => void }) {
  return (
    <div className="knob" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div className="seg">
        {options.map(([name, v]) => (
          <label key={name}>
            <input type="radio" name={label} checked={value === v} onChange={() => onChange(v)} />
            {name}
          </label>
        ))}
      </div>
    </div>
  );
}

/* one component, opened: the live block, its knobs, and its code */
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
  const [stroke, setStroke] = useState("off");
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
    if (k.type === "range")
      return (
        <label
          key={k.prop}
          className="knob range"
          style={{ "--p": `${((value - k.min) / (k.max - k.min)) * 100}%` } as CSSProperties}
        >
          <span>{k.label}</span>
          <output>{value}</output>
          <input
            type="range"
            min={k.min}
            max={k.max}
            step={k.step ?? 1}
            value={value}
            onChange={(e) => set(k.prop, Number(e.target.value))}
          />
        </label>
      );
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
    const options: [string, unknown][] =
      k.type === "select" ? k.options.map((o) => [o, o]) : [["Off", false], ["On", true]];
    return <Seg key={k.prop} label={k.label} value={value} options={options} onChange={(v) => set(k.prop, v)} />;
  };

  return (
    <div className="detail">
      <section className="stage" data-shortcut-scope data-theme={fill} data-fill={fill} data-stroke={stroke} aria-label={`${meta.name} preview`}>
        <div className="stage-bar">
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "block"} onClick={() => setView("block")}>
              Block
            </button>
            <button type="button" aria-pressed={view === "code"} onClick={() => setView("code")}>
              Code
            </button>
          </div>
          {view === "code" && (
            <div className="bar-actions">
              <Copy className="pill solid" label="Copy prompt" text={prompt} />
            </div>
          )}
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
            <Icon d="m7 7 10 10M17 7 7 17" />
          </button>
        </header>
        <p>{meta.description}</p>
        <Seg label="Dark mode" value={fill} options={[["Off", "light"], ["On", "dark"]]} onChange={setFill} />
        <Seg label="Stroke" value={stroke} options={[["Off", "off"], ["On", "on"]]} onChange={setStroke} />
        {meta.knobs.map(knob)}
        {meta.adaptedFrom && (
          <p className="credit">
            Adapted from <a href={meta.adaptedFrom}>this source</a>; see THIRD_PARTY.md.
          </p>
        )}
        <Copy className="pill outline" label="Share" icon="M9 17H7A5 5 0 0 1 7 7h2m6 0h2a5 5 0 0 1 0 10h-2m-7-5h8" text={() => location.href} />
      </aside>
    </div>
  );
}
