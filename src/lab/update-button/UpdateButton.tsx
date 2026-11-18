/* ══ Update button ═════════════════════════════════
   An update button that does the whole job in one press. It counts the
   download, installs, restarts and reports "Up to date", changing its label
   letter by letter between steps.

   ── ONE LABEL, TWO LAYERS ────────────────────────
   When the label changes, each character is compared with the one in the same
   place in the old label. Shared characters stay. The others in the new label
   mount and blur in, 15 ms apart from left to right. The changed characters of
   the old label are drawn once more in a ghost layer on top, which blurs and
   fades them out in 120 ms and is then removed.

   ── WIDTH FROM THE TEXT ──────────────────────────
   The label sits in a wrapper that is never squeezed. After each change its
   width is measured and the button's width is set to it plus the padding, so a
   CSS transition (a linear() spring) slides the pill to its new size. The
   circle used for Install and Restart is the same button at 40 px wide with no
   padding; the label fades out and a ring fades in.

   ── THE RING ─────────────────────────────────────
   A circle drawn with stroke-dasharray. It is reset to empty with transitions
   off, then set to full with a transition as long as the step, so the browser
   fills it clockwise from the top with no per-frame work.

   ── THE DOWNLOAD COUNT ───────────────────────────
   One requestAnimationFrame loop maps elapsed time through an ease-in-out
   curve to a percentage, with three short random freezes so it looks real.
   While it counts, the digits swap in place instead of morphing. */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type UpdateButtonProps = {
  /** show the counting percentage */
  download?: boolean;
  /** show the Install label and ring */
  install?: boolean;
  /** show the Restart label and ring */
  restart?: boolean;
  accent?: "Ink" | "Pick" | "Ok";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  /** called when "Up to date" has been shown and the button resets */
  onDone?: () => void;
  onSound?: Sound;
};

const ACCENT = { Ink: "var(--fill-on)", Pick: "var(--pick)", Ok: "var(--ok)" };
const PAD = 36; // left and right padding together
const RING_C = 2 * Math.PI * 9.75;
const DOWNLOAD_MS = 3000;

type Label = { text: string; prev: string; seq: number; morph: boolean };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function UpdateButton({
  download = true,
  install = true,
  restart = true,
  accent = "Ink",
  sound = true,
  volume = 70,
  onDone,
  onSound,
}: UpdateButtonProps) {
  const [label, setLabel] = useState<Label>({ text: "Update", prev: "", seq: 0, morph: false });
  const [circle, setCircle] = useState(false);
  const [ring, setRing] = useState({ fill: false, dur: 0 });
  const [check, setCheck] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const [running, setRunning] = useState(false);

  const inner = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const alive = useRef(true);
  const textRef = useRef("Update");
  const props = useRef({ download, install, restart, sound, volume, onDone, onSound });
  props.current = { download, install, restart, sound, volume, onDone, onSound };

  const say = (name: string, v: number, pitch = 1) => {
    const p = props.current;
    if (p.sound && p.onSound) p.onSound(name, { volume: v * (p.volume / 100), pitch });
  };

  /* change the label; with morph the changed characters blur out and in */
  const show = (text: string, morph = true) => {
    const prev = textRef.current;
    textRef.current = text;
    setLabel((l) => ({ text, prev, seq: l.seq + 1, morph }));
    if (morph) later(260, () => setLabel((l) => (l.text === text ? { ...l, morph: false } : l)));
  };

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const wait = (ms: number) =>
    new Promise<void>((res, rej) =>
      later(ms, () => (alive.current ? res() : rej(new Error("gone")))),
    );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach(clearTimeout);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  /* the pill is as wide as its label; measure it after every change */
  useLayoutEffect(() => {
    if (inner.current) setWidth(inner.current.offsetWidth + PAD);
  }, [label.text, check]);

  const count = () =>
    new Promise<void>((res) => {
      /* three random freezes, so the count does not look like a tween */
      const stops = [0, 1, 2].map((i) => ({ at: 0.12 + i * 0.28 + Math.random() * 0.2, ms: 120 + Math.random() * 180 }));
      const frozen = stops.reduce((s, p) => s + p.ms, 0);
      const live = DOWNLOAD_MS - frozen;
      const t0 = performance.now();
      let last = -1;
      const tick = (now: number) => {
        if (!alive.current) return;
        const el = now - t0;
        let t = el;
        for (const s of stops) {
          const start = s.at * live + (el - t);
          if (el > start + s.ms) t -= s.ms;
          else if (el > start) t -= el - start;
        }
        const p = Math.min(1, Math.max(0, t / live));
        const pct = Math.round(ease(p) * 100);
        if (pct !== last) {
          last = pct;
          show(`${pct}%`, false);
          if (pct % 25 === 0 && pct > 0 && pct < 100) setAnnounce(`${pct}%`);
        }
        if (el >= DOWNLOAD_MS) {
          if (last !== 100) show("100%", false);
          res();
        } else raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    });

  const fillRing = async (ms: number) => {
    setRing({ fill: false, dur: 0 });
    await wait(40);
    setRing({ fill: true, dur: ms });
    await wait(ms);
  };

  const run = async () => {
    const { download: d, install: i, restart: r } = props.current;
    setRunning(true);
    setCheck(false);
    say("tick", 0.5);
    try {
      if (d) {
        setAnnounce("Downloading");
        show("0%");
        await wait(160);
        await count();
        await wait(250);
      }
      if (i) {
        setAnnounce("Installing");
        show("Install");
        await wait(500);
        setCircle(true);
        await wait(380);
        await fillRing(1500);
        await wait(200);
      }
      if (r) {
        setAnnounce("Restarting");
        setCircle(false);
        show("Restart");
        await wait(550);
        setCircle(true);
        await wait(380);
        await fillRing(1200);
        await wait(200);
      }
      setCircle(false);
      setCheck(true);
      show("Up to date");
      setAnnounce("Up to date");
      await wait(1500);
      setCheck(false);
      show("Update");
      await wait(300);
      props.current.onDone?.();
      setRunning(false);
    } catch {
      /* unmounted */
    }
  };

  const chars = [...label.text];
  const old = [...label.prev];
  const ghost = label.morph && !!label.prev;

  return (
    <div className="ub" style={{ "--accent": ACCENT[accent] } as CSSProperties}>
      <button
        type="button"
        className="ub-btn"
        data-circle={circle ? "" : undefined}
        data-running={running ? "" : undefined}
        aria-disabled={running}
        aria-busy={running}
        style={width == null ? undefined : { width: circle ? 40 : width }}
        onClick={() => {
          if (!running) void run();
        }}
      >
        <span className="ub-inner" ref={inner}>
          <span className="ub-text">
            {chars.map((c, i) => {
              const changed = c !== old[i];
              return (
                <span
                  key={changed ? `${label.seq}-${i}` : `k${i}`}
                  className="ub-ch"
                  data-in={label.morph && changed ? "" : undefined}
                  style={{ "--d": `${i * 15}ms` } as CSSProperties}
                >
                  {c}
                </span>
              );
            })}
            {ghost && (
              <span className="ub-ghost" key={label.seq} aria-hidden="true">
                {old.map((c, i) => (
                  <span key={i} className="ub-ch" data-out={c !== chars[i] ? "" : undefined}>
                    {c}
                  </span>
                ))}
              </span>
            )}
          </span>
          {check && <Icon className="ub-check" icon="ph:check-bold" width={14} height={14} aria-hidden="true" />}
        </span>
        <svg className="ub-ring" viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">
          <circle className="ub-track" cx="11" cy="11" r="9.75" />
          <circle
            className="ub-prog"
            cx="11"
            cy="11"
            r="9.75"
            strokeDasharray={RING_C}
            strokeDashoffset={ring.fill ? 0 : RING_C}
            style={{ transitionDuration: `${ring.dur}ms` }}
          />
        </svg>
      </button>
      <span className="ub-live" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
