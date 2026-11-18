/* ══ Coupon copy ═════════════════════════════
   A promo-code pill with a Copy button. Press Copy and the code blurs into
   "Code copied!" while a fill sweeps across the pill like a timer; when it
   reaches the right edge the code blurs back. Press the pill while it says
   copied to copy again and restart the sweep.

   ── TWO LAYERS, ONE PILL ─────────────────
   The code and the copied message sit on top of each other. A data-state
   attribute flips between them: the hidden layer is blurred, transparent and
   inert, so a CSS transition does the blur swap and nothing hidden can be
   pressed or tabbed to.

   ── THE SWEEP ────────────────────────────
   The fill is a full-width element scaled from 0 to 1 on the x axis from the
   left edge, linearly, over the hold time. It is remounted on every copy, so
   pressing again restarts it from the left. A timer of the same length sends
   the pill back to the code, and the pill's rounded overflow clips the fill.

   ── WHEN THE CLIPBOARD SAYS NO ───────────
   If writeText is refused, a hidden input holding the code is selected and the
   message reads "Press Ctrl+C", so the code can still be copied by hand. */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => void;

export type CouponCopyProps = {
  code?: string;
  /** seconds the copied state (and the sweep) lasts */
  hold?: number;
  accent?: "Ink" | "Ok" | "Pick";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onCopy?: (code: string) => void;
  onSound?: Sound;
};

const ACCENT = { Ink: "var(--fill-on)", Ok: "var(--ok)", Pick: "var(--pick)" };

export function CouponCopy({
  code = "B3E45S7T",
  hold = 3,
  accent = "Ink",
  sound = true,
  volume = 70,
  onCopy,
  onSound,
}: CouponCopyProps) {
  const [copied, setCopied] = useState(false);
  const [refused, setRefused] = useState(false);
  const [run, setRun] = useState(0); // remounts the sweep
  const timer = useRef<number>(0);
  const input = useRef<HTMLInputElement>(null);
  const snd = (name: string, k: number) => sound && onSound?.(name, { volume: k * (volume / 100) });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      ok = false;
    }
    setRefused(!ok);
    if (!ok) requestAnimationFrame(() => input.current?.select());
    if (!copied) snd("pop", 0.6);
    setCopied(true);
    setRun((n) => n + 1);
    onCopy?.(code);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      snd("tick", 0.4);
    }, hold * 1000);
  };

  const style = {
    "--hold": `${hold}s`,
    "--accent": ACCENT[accent],
    "--code-size": code.length > 12 ? `${Math.max(13, Math.floor((16 * 12) / code.length))}px` : "16px",
  } as CSSProperties;

  return (
    <div className="cc" data-state={copied ? "copied" : "code"} data-accent={accent} style={style}>
      {run > 0 && <span className="cc-fill" key={run} />}
      <div className="cc-code" aria-hidden={copied} inert={copied}>
        <span className="cc-text">{code}</span>
        <button type="button" className="cc-btn" aria-label={`Copy code ${code}`} onClick={copy}>
          Copy
        </button>
      </div>
      <button type="button" className="cc-done" tabIndex={copied ? 0 : -1} aria-hidden={!copied} onClick={copy}>
        <Icon icon="ph:check-circle-fill" className="cc-icon" />
        {refused ? "Press Ctrl+C" : "Code copied!"}
      </button>
      <input ref={input} className="cc-hidden" readOnly tabIndex={-1} aria-hidden value={code} />
      <span className="cc-live" role="status">{copied ? "Code copied" : ""}</span>
    </div>
  );
}
