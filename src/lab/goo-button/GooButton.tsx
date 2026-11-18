/* ══ Goo button ═════════════════════════════
   A call-to-action whose arrow is a drop of liquid. Hover the pill or the
   round arrow beside it and the drop melts into the button, the arrow
   turning to point up-right; press and the arrow shoots off and a fresh one
   slides in. Leave and the drop pulls away, its liquid neck stretching thin
   until it snaps.

   ── A GOO FILTER ON TWO SHAPES ───────────────
   The pill and the circle are plain SVG shapes inside one group with an SVG
   filter. The filter blurs the group, so the two soft halos add up where
   the shapes come close, then an alpha colour matrix turns that soft alpha
   back into a hard edge. Where the halos overlap enough, the edge closes
   over the gap: that is the liquid neck. The sharp shapes are drawn over
   the result, so their own edges stay crisp. The Goo setting is the blur
   radius, which decides how far apart the halos meet and how fat the neck
   is.

   ── CRISP TEXT ON TOP ────────────────────────
   Only the shapes are filtered. The label and the arrow are HTML laid over
   them, moving with the same transforms, so text never goes soft and
   browsers that filter HTML poorly are not involved.

   ── THE SLIDE ────────────────────────────────
   On hover the pill and circle move toward each other by half the distance
   each, until the circle covers 30% of the pill's end, so the joined shape
   stays centred. An overshooting curve gives the fuse a jelly bounce and the
   pull-apart a wobble. */

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";

type Sound = (name: string, o?: { volume?: number; pitch?: number }) => unknown;

export type GooButtonProps = {
  label?: string;
  /** blur radius of the goo filter, 2 to 14 */
  goo?: number;
  /** px between pill and circle at rest */
  gap?: number;
  size?: "S" | "M" | "L";
  accent?: "Ink" | "Pick";
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
  onClick?: () => void;
  /** renders a link instead of a button */
  href?: string;
};

const SIZES = { S: { h: 30, font: 12, pad: 14, icon: 14 }, M: { h: 38, font: 14, pad: 18, icon: 16 }, L: { h: 48, font: 16, pad: 18, icon: 20 } };
const PAD = 40; // room around the shapes so the blur is never clipped

export function GooButton({
  label = "Explore more",
  goo = 7,
  gap = 8,
  size = "M",
  accent = "Ink",
  sound = true,
  volume = 70,
  onSound,
  onClick,
  href,
}: GooButtonProps) {
  const S = SIZES[size] ?? SIZES.M;
  const pillRef = useRef<HTMLSpanElement>(null);
  const [pw, setPw] = useState(120);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [phase, setPhase] = useState<"rest" | "out" | "in">("rest");
  const [mounted, setMounted] = useState(false);
  const fid = "goo-f" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const lastJelly = useRef(0);
  const timers = useRef<number[]>([]);
  const on = hover || focus;

  useEffect(() => {
    setMounted(true);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  useLayoutEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPw(el.offsetWidth));
    ro.observe(el);
    setPw(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const play = (name: string, v: number, pitch = 1) => {
    if (sound && onSound) onSound(name, { volume: v * (volume / 100), pitch });
  };

  // fuse / pull apart sounds follow the state, rate-limited
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const now = performance.now();
    if (now - lastJelly.current < 200) return;
    lastJelly.current = now;
    on ? play("jelly", 0.45) : play("jelly", 0.25, 0.85);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const launch = () => {
    play("whoosh", 0.45, 1.15);
    setPhase("out");
    later(() => setPhase("in"), 220);
    later(() => setPhase("rest"), 260);
    onClick?.();
  };

  const d = S.h;
  const move = gap + d * 0.3; // total travel so the circle covers 30% of the pill's end
  const w = pw + gap + d;

  const enter = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      setHover(true);
      later(() => setHover(false), 600);
    } else setHover(true);
  };
  const leave = (e: React.PointerEvent) => { if (e.pointerType !== "touch") setHover(false); };

  const props = {
    className: "goo",
    "data-on": on,
    "data-accent": accent,
    style: { "--h": `${d}px`, "--font": `${S.font}px`, "--pad": `${S.pad}px`, "--gap": `${gap}px`, "--mv": `${move / 2}px` } as CSSProperties,
    onPointerEnter: enter,
    onPointerLeave: leave,
    onFocus: (e: React.FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(":focus-visible")) setFocus(true); },
    onBlur: () => setFocus(false),
    onClick: launch,
  };

  const inner = (
    <>
      <svg className="goo-svg" width={w + PAD * 2} height={d + PAD * 2} viewBox={`${-PAD} ${-PAD} ${w + PAD * 2} ${d + PAD * 2}`} aria-hidden="true">
        <defs>
          <filter id={fid} x={-PAD} y={-PAD} width={w + PAD * 2} height={d + PAD * 2} filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation={goo} result="b" />
            <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -12" result="g" />
            <feComposite in="SourceGraphic" in2="g" operator="over" />
          </filter>
        </defs>
        <g filter={`url(#${fid})`}>
          <rect className="goo-shape goo-shape-pill" x={0} y={0} width={pw} height={d} rx={d / 2} />
          <circle className="goo-shape goo-shape-dot" cx={pw + gap + d / 2} cy={d / 2} r={d / 2} />
        </g>
      </svg>
      <span className="goo-pill" ref={pillRef}>{label}</span>
      <span className="goo-dot" aria-hidden="true">
        <span className="goo-turn">
          <span className="goo-arr" data-phase={phase}>
            {mounted ? <Icon icon="ph:arrow-right" width={S.icon} height={S.icon} /> : <span style={{ width: S.icon, height: S.icon }} />}
          </span>
        </span>
      </span>
    </>
  );

  return href ? <a href={href} {...props}>{inner}</a> : <button type="button" {...props}>{inner}</button>;
}
