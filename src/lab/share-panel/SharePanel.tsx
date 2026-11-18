/* ══ Share panel ═════════════════════════════════
   A small share panel with an "Anyone with the link" switch. Flip it on and
   the Invite section folds away under the panel; flip it off and it unfolds
   again. The invite field and button are for show.

   ── FOLDING BY GRID ROWS ─────────────────
   The Invite section sits in a grid whose single row animates between 0fr and
   1fr. That animates to the content's real height without measuring it, and
   the panel grows and shrinks around its centre with it.

   ── BLUR AND INERT ───────────────────────
   While folding, the content also blurs and fades; unfolding, it blurs in and
   rises 4 px. A folded section is inert, so keyboard focus can never land on
   something you cannot see. With reduced motion there is no blur or height
   animation, only a short fade. */

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type SharePanelProps = {
  /** switch on at load (Invite folded) */
  public?: boolean;
  /** 0 to 100 */
  speed?: number;
  /** blur in px while folding */
  blur?: number;
  link?: string;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onChange?: (isPublic: boolean) => void;
  onSound?: Sound;
};

export function SharePanel({
  public: startPublic = false,
  speed = 60,
  blur = 6,
  link = "labs.glitchnobody.com/share/453",
  sound = true,
  volume = 70,
  onChange,
  onSound,
}: SharePanelProps) {
  const [on, setOn] = useState(startPublic);
  const [mounted, setMounted] = useState(false);
  const switchRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => setOn(startPublic), [startPublic]);

  const play = (name: string, v: number) => {
    if (sound) onSound?.(name, { volume: (v * volume) / 100 });
  };

  const toggle = () => {
    const next = !on;
    if (next && bodyRef.current?.contains(document.activeElement)) switchRef.current?.focus();
    setOn(next);
    onChange?.(next);
    play("tick", 0.5);
    setTimeout(() => play(next ? "collapse" : "expand", 0.4), 60);
  };

  const ms = Math.round(700 - 6 * speed);
  const Ic = ({ i, size = 16 }: { i: string; size?: number }) =>
    mounted ? <Icon icon={i} width={size} height={size} /> : <span style={{ width: size, height: size }} />;

  return (
    <div
      className="shp"
      data-public={on}
      style={{ "--shp-ms": `${ms}ms`, "--shp-blur": `${blur}px` } as React.CSSProperties}
    >
      <div className="shp-title">Share</div>
      <div className="shp-access" onClick={toggle}>
        <span className="shp-tile"><Ic i="ph:globe-simple" size={16} /></span>
        <span className="shp-text">
          <span className="shp-name">Anyone</span>
          <span className="shp-sub">Everyone with the link can access</span>
        </span>
        <button
          ref={switchRef}
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Anyone with the link can access"
          className="shp-switch"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
        >
          <span className="shp-knob" />
        </button>
      </div>
      <div className="shp-link" title={link}>
        <span className="shp-link-text">{link}</span>
        <Ic i="ph:copy" size={14} />
      </div>
      <div className="shp-fold" data-open={!on}>
        <div className="shp-fold-in" ref={bodyRef} inert={on}>
          <div className="shp-invite">
            <div className="shp-label">Invite</div>
            <label className="shp-field">
              <Ic i="ph:user-plus" size={16} />
              <input type="email" placeholder="Enter email to share" aria-label="Email to share with" onClick={(e) => e.currentTarget.focus()} />
              <button type="button" className="shp-btn"><Ic i="ph:paper-plane-tilt-fill" size={12} />Invite</button>
            </label>
          </div>
        </div>
      </div>
      <span className="shp-live" role="status" aria-live="polite">{on ? "Link is public" : "Link is private"}</span>
    </div>
  );
}
