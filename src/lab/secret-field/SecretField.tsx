/* ══ Secret field ═════════════════════════════
   A card number that hides itself. Copy it while it is showing; when the ring
   runs out the middle digits scramble away into a mask, and the eye button
   scrambles them back and restarts the countdown.

   ── THE RING ─────────────────────────────────
   The ring is an SVG rect with the button's rounded outline. Its pathLength is
   1, so stroke-dashoffset is simply the share of time used. A
   requestAnimationFrame loop sets it from a deadline, which makes restarting
   (after a copy, a reveal or a changed reveal time) a matter of moving the
   deadline.

   ── THE SCRAMBLE ─────────────────────────────
   Every hidden digit gets a start time, 30 ms after the one to its left. From
   then until its landing time it shows a new random character every 40 ms,
   then lands on its target: the mask character or the real digit. One timer
   steps all digits, so a press mid-scramble simply starts a new run from
   whatever each digit shows now. With reduced motion the digits swap at once.

   ── COPYING ──────────────────────────────────
   Copy writes the digits only, no spaces, with the Clipboard API. If the
   browser refuses, the number is selected so it can be copied by hand. Masked
   digits are aria-hidden and the label reads "Card ending 0420". */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type SecretFieldProps = {
  /** the secret, shown in groups of four */
  value?: string;
  /** accessible name of the field */
  label?: string;
  /** seconds the number stays visible */
  reveal?: number;
  /** start hidden (eye) instead of revealed */
  masked?: boolean;
  /** digits left showing at each end when masked */
  visible?: number;
  maskChar?: "×" | "•" | "*";
  /** ms a digit scrambles before landing */
  scramble?: number;
  ring?: "Ok" | "Pick" | "Ink";
  grouping?: boolean;
  sound?: boolean;
  volume?: number;
  onSound?: Sound;
};

const NOISE = "0123456789#%&?@$";
const rnd = () => NOISE[Math.floor(Math.random() * NOISE.length)];
const COLOR = { Ok: "var(--ok)", Pick: "var(--pick)", Ink: "var(--fill-on)" };

export function SecretField({
  value = "6969042067670420",
  label = "Card number",
  reveal = 6,
  masked = false,
  visible = 4,
  maskChar = "×",
  scramble = 420,
  ring = "Ok",
  grouping = true,
  sound = true,
  volume = 70,
  onSound,
}: SecretFieldProps) {
  const chars = [...value];
  const n = chars.length;
  const v = Math.min(visible, Math.floor(n / 2));
  const hid = (i: number) => i >= v && i < n - v;
  const [hidden, setHidden] = useState(masked);
  const [shown, setShown] = useState<string[]>(() => chars.map((c, i) => (masked && hid(i) ? maskChar : c)));
  const [copy, setCopy] = useState<"" | "ok" | "fail">("");
  const [say, setSay] = useState("");
  const [restart, setRestart] = useState(0);
  const rect = useRef<SVGRectElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number>(0);
  const first = useRef(true);
  const last = useRef(0);
  const cur = useRef(shown);
  cur.current = shown;
  const target = (h: boolean) => chars.map((c, i) => (h && hid(i) ? maskChar : c));
  const key = `${value}|${v}|${maskChar}`;

  const play = (name: string, vol: number, pitch = 1) => {
    if (sound) onSound?.(name, { volume: (vol * volume) / 100, pitch });
  };

  // Scramble toward the target on every mask/reveal.
  const run = (h: boolean) => {
    window.clearInterval(timer.current);
    const goal = target(h);
    const instant = scramble <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (instant) return setShown(goal);
    const t0 = performance.now();
    const order = chars.map((_, i) => i).filter(hid);
    const landed = new Set<number>();
    timer.current = window.setInterval(() => {
      const t = performance.now() - t0;
      const next = [...cur.current];
      order.forEach((i, k) => {
        const s = k * 30;
        if (t < s) return;
        if (t >= s + scramble) {
          next[i] = goal[i];
          if (!landed.has(i)) {
            landed.add(i);
            const now = performance.now();
            if (now - last.current >= 25) {
              last.current = now;
              play("tick", 0.25, 1 + 0.05 * k);
            }
          }
        } else next[i] = rnd();
      });
      goal.forEach((c, i) => { if (!hid(i)) next[i] = c; });
      setShown(next);
      if (order.every((i) => landed.has(i))) window.clearInterval(timer.current);
    }, 40);
  };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    run(hidden);
    setSay(hidden ? "Card number hidden" : "");
  }, [hidden]);

  useEffect(() => {
    window.clearInterval(timer.current);
    setShown(target(hidden));
  }, [key]);

  useEffect(() => setHidden(masked), [masked]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  // Countdown ring.
  useEffect(() => {
    const el = rect.current;
    if (hidden || !el) return;
    const end = performance.now() + reveal * 1000;
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, end - performance.now()) / (reveal * 1000);
      el.style.strokeDashoffset = String(1 - left);
      if (left <= 0) setHidden(true);
      else raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [hidden, reveal, restart]);

  useEffect(() => {
    if (!copy) return;
    const id = window.setTimeout(() => setCopy(""), 1200);
    return () => window.clearTimeout(id);
  }, [copy]);

  const press = async () => {
    if (hidden) { setHidden(false); setRestart((r) => r + 1); return; }
    try {
      await navigator.clipboard.writeText(value.replace(/\D/g, ""));
      setCopy("ok");
      setSay("Card number copied");
      play("pop", 0.6);
    } catch {
      const sel = window.getSelection();
      if (numRef.current && sel) {
        const r = document.createRange();
        r.selectNodeContents(numRef.current);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      setCopy("fail");
    }
    setRestart((r) => r + 1);
  };

  const cells = chars.map((_, i) => (
    <span key={i} className="sf-ch" data-mask={hid(i) && shown[i] === maskChar ? "" : undefined}>
      {shown[i]}
    </span>
  ));
  const groups: React.ReactNode[] = [];
  if (grouping) for (let i = 0; i < n; i += 4) groups.push(<span key={i} className="sf-grp">{cells.slice(i, i + 4)}</span>);

  return (
    <div className="sf" data-hidden={hidden || undefined} data-copy={copy || undefined} style={{ "--ring": COLOR[ring] } as CSSProperties}>
      <span
        ref={numRef}
        className="sf-num"
        role="text"
        aria-label={hidden ? `Card ending ${chars.slice(-4).join("")}` : `${label} ${value}`}
        data-hidden={hidden || undefined}
      >
        <span aria-hidden={hidden || undefined}>{grouping ? groups : cells}</span>
      </span>
      <button type="button" className="sf-btn" onClick={press} aria-label={hidden ? "Show card number" : "Copy card number"}>
        <svg className="sf-ringsvg" viewBox="0 0 28 28" aria-hidden="true">
          <rect ref={rect} x="1" y="1" width="26" height="26" rx="5" pathLength={1} />
        </svg>
        <Icon className="sf-i sf-i-copy" icon="ph:copy-fill" width={16} />
        <Icon className="sf-i sf-i-eye" icon="ph:eye-fill" width={16} />
        <Icon className="sf-i sf-i-check" icon="ph:check-bold" width={12} />
        <span className="sf-fail" aria-hidden="true">Ctrl+C</span>
      </button>
      <span className="sf-live" aria-live="polite">{say}</span>
    </div>
  );
}
