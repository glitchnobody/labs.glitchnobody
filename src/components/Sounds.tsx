import { useEffect, useRef, useState, type CSSProperties } from "react";
import Block from "./Block";
import { play } from "../lab/sound";

export type SoundInfo = { name: string; what: string; users: { slug: string; name: string }[] };

/* a family for each sound, shown before its name */
const FAMILY: Record<string, string> = {
  tick: "Step", blip: "Step", pop: "Feedback", error: "Feedback", crunch: "Actions", coins: "Feedback",
  expand: "Movement", collapse: "Movement", swipe: "Movement", slide: "Movement", shuffle: "Movement", whoosh: "Movement", jelly: "Movement",
  join: "Notifications", leave: "Notifications", ping: "Notifications",
  charge: "Loops", heat: "Loops", rustle: "Loops", "rain-clip": "Ambience",
};
const LOOPS = ["charge", "heat", "rustle"];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const orb = (s: string): CSSProperties => {
  const h = hash(s), a = h % 360, b = (a + 40 + ((h >> 8) % 80)) % 360;
  return { "--o1": `hsl(${a} 85% 62%)`, "--o2": `hsl(${b} 85% 58%)` } as CSSProperties;
};

function hear(name: string) {
  if (LOOPS.includes(name)) { const h = play(name, { loop: true }); setTimeout(() => h.stop(300), 2000); }
  else play(name);
}

export default function Sounds({ sounds }: { sounds: SoundInfo[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [pulse, setPulse] = useState<Record<string, number>>({});
  const [view, setView] = useState<"orb" | "example">("orb");
  const [len, setLen] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const cur = sounds.find((s) => s.name === open);

  const ring = (name: string) => { hear(name); setPulse((p) => ({ ...p, [name]: (p[name] ?? 0) + 1 })); };

  /* the URL hash is the open sound */
  useEffect(() => {
    const sync = () => { const n = decodeURIComponent(location.hash.slice(1)); setOpen(sounds.some((s) => s.name === n) ? n : null); };
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, [sounds]);
  useEffect(() => {
    const el = dialog.current!;
    if (open && !el.open) { el.showModal(); setView("orb"); setCopied(false); }
    if (!open && el.open) el.close();
    if (open && len[open] === undefined) {
      fetch(`/sounds/${open}.mp3`).then((r) => r.arrayBuffer()).then((b) => new OfflineAudioContext(1, 44100, 44100).decodeAudioData(b))
        .then((buf) => setLen((l) => ({ ...l, [open]: buf.duration }))).catch(() => {});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const show = (n: string | null) => { history.replaceState(null, "", n ? `#${n}` : location.pathname); setOpen(n); };
  const ms = (s?: number) => (s === undefined ? "…" : s >= 2 ? `${s.toFixed(1)}s` : `${Math.round(s * 1000)}ms`);

  return (
    <>
      <main className="sfx-grid" data-quiet>
        {sounds.map((s) => (
          <article key={s.name} className="sfx-pad" style={orb(s.name)}>
            <button type="button" className="sfx-hit" aria-label={`Play ${s.name}`} onClick={() => ring(s.name)}>
              <span key={pulse[s.name] ?? 0} className="sfx-orb" data-ring={!!pulse[s.name]} />
            </button>
            <span className="sfx-label"><span>{FAMILY[s.name] ?? "Sound"}</span> {s.name}</span>
            <button type="button" className="icon sfx-open" aria-label={`Open ${s.name}`} onClick={() => show(s.name)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h9m4 0h3M4 16h3m4 0h9" /><circle cx="15" cy="8" r="2" /><circle cx="9" cy="16" r="2" /></svg>
            </button>
          </article>
        ))}
      </main>
      <dialog ref={dialog} className="sfx-modal" data-quiet onClose={() => open && show(null)} onClick={(e) => { if (e.target === e.currentTarget) show(null); }}>
        {cur && (
          <div className="sfx-detail">
            <section className="sfx-stage" style={orb(cur.name)} data-shortcut-scope>
              <div className="sfx-bar">
                <div className="sfx-seg" role="radiogroup" aria-label="Preview">
                  <button type="button" role="radio" aria-checked={view === "orb"} aria-label="Orb" onClick={() => setView("orb")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /></svg>
                  </button>
                  <button type="button" role="radio" aria-checked={view === "example"} aria-label="Example component" disabled={!cur.users.length} onClick={() => setView("example")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3" /></svg>
                  </button>
                </div>
                <button type="button" className="icon sfx-speak" aria-label={`Play ${cur.name}`} onClick={() => ring(cur.name)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
                </button>
              </div>
              {view === "orb" || !cur.users.length ? (
                <button type="button" className="sfx-hit sfx-big" aria-label={`Play ${cur.name}`} onClick={() => ring(cur.name)}>
                  <span key={pulse[cur.name] ?? 0} className="sfx-orb" data-ring={!!pulse[cur.name]} />
                </button>
              ) : (
                <div className="sfx-example stage-block"><Block key={cur.users[0].slug} slug={cur.users[0].slug} /></div>
              )}
              {view === "example" && cur.users[0] && <a className="sfx-ex-name" href={`/${cur.users[0].slug}`}>{cur.users[0].name}</a>}
            </section>
            <aside className="sfx-info">
              <div className="sfx-head">
                <div>
                  <h2>{cur.name}</h2>
                  <p className="sfx-fam">{FAMILY[cur.name] ?? "Sound"}</p>
                </div>
                <button type="button" className="icon" aria-label="Close" onClick={() => show(null)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
                </button>
              </div>
              <p className="sfx-what">{cur.what}</p>
              <dl className="sfx-rows">
                <div><dt>Length</dt><dd>{ms(len[cur.name])}{LOOPS.includes(cur.name) ? " loop" : ""}</dd></div>
                <div><dt>Used by</dt><dd>{cur.users.length} {cur.users.length === 1 ? "component" : "components"}</dd></div>
              </dl>
              <div className="sfx-acts">
                <button type="button" className="sfx-btn" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/sounds#${cur.name}`); setCopied(true); }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
                  {copied ? "Link copied" : "Share"}
                </button>
                <a className="sfx-btn sfx-dl" href={`/sounds/${cur.name}.mp3`} download={`${cur.name}.mp3`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14" /></svg>
                  Download
                </a>
              </div>
            </aside>
          </div>
        )}
      </dialog>
    </>
  );
}
