/* ══ View switcher ════════════════════════════════════
   A small art collection you can view as a list, a grid of cards or a
   stacked pack. Switch views and every print flies, resizes and re-rounds
   into its new place; hover the pack to fan it out and press it to deal the
   prints back into the grid. Arrow keys move between the view chips.

   ── SHARED LAYOUT ────────────────────────────────────
   Each print's image, title and price carry a stable layout id from motion.
   When the view changes, React renders a completely different structure,
   and motion matches old and new elements by id, measures both boxes and
   animates the difference with transforms, so a 36 px thumbnail grows into
   a card image instead of popping. The chip highlight is one shared element
   that slides between chips the same way.

   ── STAGGER AND SPRINGS ──────────────────────────────
   Every print gets its own spring with a delay of its place in reading
   order times the stagger, so the collection rearranges like a wave rather
   than all at once. Bounce and Speed set the spring's bounce and duration,
   and a switch mid-flight simply retargets from wherever things are.

   ── THE PACK ─────────────────────────────────────────
   In the pack every print sits in the same square, turned a few degrees
   like real prints dropped on a table. Hovering spreads the angles out to
   about eighteen degrees and nudges each print sideways around a pivot
   near its bottom, like a hand of cards. */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { LayoutGroup, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { Icon } from "@iconify/react";

type View = "List" | "Card" | "Pack";
const VIEWS: { v: View; label: string; icon: string }[] = [
  { v: "List", label: "List view", icon: "ph:list-bullets-bold" },
  { v: "Card", label: "Card view", icon: "ph:squares-four-bold" },
  { v: "Pack", label: "Pack view", icon: "ph:cards-bold" },
];
const PRINTS = [
  { title: "Meadow Run", usd: 320, ed: "209" },
  { title: "Fox Crossing", usd: 280, ed: "808" },
  { title: "Swan River", usd: 410, ed: "114" },
  { title: "Tall Grass", usd: 230, ed: "352" },
  { title: "Wild Gallop", usd: 360, ed: "077" },
  { title: "Night Drive", usd: 190, ed: "640" },
];
const PACK = [0, -6, 5, -3, 4, -5];

export type ViewSwitcherProps = {
  view?: View;
  count?: number;
  columns?: number;
  prices?: boolean;
  currency?: "USD" | "EUR" | "GBP" | "ETH";
  chipStyle?: "Solid" | "Outline" | "Underline";
  radius?: number;
  stagger?: number;
  bounce?: number;
  speed?: number;
  /** print images; without them each print gets a gradient */
  images?: string[];
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const gradient = (s: string) => {
  const h = hash(s);
  return `linear-gradient(160deg, hsl(${h % 360} 60% 72%), hsl(${(h >> 7) % 360} 55% 45%))`;
};
const money = (usd: number, c: string) => {
  if (c === "ETH") return `${(usd / 3000).toFixed(3)} ETH`;
  const rate = c === "EUR" ? 0.92 : c === "GBP" ? 0.79 : 1;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(usd * rate);
};

export function ViewSwitcher({
  view: view0 = "List", count = 4, columns = 4, prices = true, currency = "USD", chipStyle = "Solid", radius = 4,
  stagger = 35, bounce = 20, speed = 60, images, sound = true, volume = 70, onSound,
}: ViewSwitcherProps) {
  const [view, setView] = useState<View>(view0);
  const [fan, setFan] = useState(false);
  const reduced = useReducedMotion();
  const group = useId();
  const first = useRef(true);
  const n = Math.max(2, Math.min(6, Math.round(count)));
  const list = PRINTS.slice(0, n);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };
  function go(v: View, user = true) {
    if (v === view) return;
    setView(v);
    setFan(false);
    if (user) snd("tick", { volume: 0.5, pitch: 1.1 });
    snd("shuffle", { volume: 0.7, pitch: 0.96 + Math.random() * 0.08 });
  }
  useEffect(() => { if (first.current) { first.current = false; return; } go(view0, false); }, [view0]); // eslint-disable-line react-hooks/exhaustive-deps

  function fanTo(v: boolean) {
    if (v === fan) return;
    setFan(v);
    snd(v ? "pop" : "collapse", v ? { volume: 0.5, pitch: 1.1 } : { volume: 0.4 });
  }

  const spring = (i: number) =>
    reduced ? { duration: 0 } : { type: "spring" as const, bounce: (bounce / 100) * 0.6, duration: 0.95 - (speed / 100) * 0.6, delay: (i * stagger) / 1000 };
  const img = (i: number, extra: CSSProperties = {}, animate: Record<string, number> = { rotate: 0, x: 0, y: 0 }) => {
    const src = images?.length ? images[i % images.length] : undefined;
    return (
      <m.div
        layoutId={`img-${i}`}
        className="vsw-img"
        transition={spring(i)}
        animate={animate}
        style={{ background: src ? `center / cover no-repeat url("${src}")` : gradient(list[i].title), borderRadius: extra.borderRadius, ...extra }}
      />
    );
  };
  const meta = (i: number) => (
    <m.span layoutId={`price-${i}`} transition={spring(i)} className="vsw-price">
      {money(list[i].usd, currency)}
      <span className="vsw-ed"><i />#{list[i].ed}</span>
    </m.span>
  );
  const label = (p: (typeof PRINTS)[number]) => `${p.title}, ${money(p.usd, currency)}, edition ${p.ed}`;

  const onChipKey = (e: KeyboardEvent) => {
    const i = VIEWS.findIndex((x) => x.v === view);
    const j = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % 3 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + 2) % 3 : e.key === "Home" ? 0 : e.key === "End" ? 2 : -1;
    if (j < 0) return;
    e.preventDefault();
    go(VIEWS[j].v);
    ((e.currentTarget.parentElement?.children[j] as HTMLElement) ?? null)?.focus();
  };

  const total = list.reduce((s, p) => s + p.usd, 0);
  const mid = (n - 1) / 2;

  return (
    <LazyMotion features={domMax} strict>
      <LayoutGroup id={group}>
        <div className="vsw" data-look={chipStyle.toLowerCase()} data-view={view.toLowerCase()} style={{ "--vsw-r": `${radius}px`, "--vsw-cols": columns } as CSSProperties}>
          <span className="vsw-head">Collection</span>
          <div className="vsw-chips" role="radiogroup" aria-label="View">
            {VIEWS.map((c) => (
              <button key={c.v} type="button" role="radio" aria-checked={view === c.v} tabIndex={view === c.v ? 0 : -1} className="vsw-chip" data-on={view === c.v}
                onClick={() => go(c.v)} onKeyDown={onChipKey}>
                {view === c.v && <m.span layoutId="hl" className="vsw-hl" transition={reduced ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.4 }} />}
                <Icon icon={c.icon} width={16} height={16} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          {view === "List" && (
            <ul className="vsw-list">
              {list.map((p, i) => (
                <li key={p.title} className="vsw-row" aria-label={label(p)}>
                  {img(i, { width: 36, height: 36, borderRadius: radius / 2 })}
                  <div className="vsw-txt">
                    <m.span layoutId={`title-${i}`} transition={spring(i)} className="vsw-title">{p.title}</m.span>
                    {prices && meta(i)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {view === "Card" && (
            <ul className="vsw-grid">
              {list.map((p, i) => (
                <li key={p.title} className="vsw-card" aria-label={label(p)}>
                  {img(i, { width: "100%", aspectRatio: "1", borderRadius: radius })}
                  <m.span layoutId={`title-${i}`} transition={spring(i)} className="vsw-title">{p.title}</m.span>
                  {prices && meta(i)}
                </li>
              ))}
            </ul>
          )}
          {view === "Pack" && (
            <div className="vsw-packwrap">
              <button
                type="button"
                className="vsw-pack"
                aria-label={`Open ${n} prints`}
                onPointerEnter={(e) => { if (e.pointerType !== "touch") fanTo(true); }}
                onPointerLeave={(e) => { if (e.pointerType !== "touch") fanTo(false); }}
                onFocus={() => fanTo(true)}
                onBlur={() => fanTo(false)}
                onClick={(e) => {
                  if ((e.nativeEvent as PointerEvent).pointerType === "touch" && !fan) { fanTo(true); return; }
                  go("Card");
                }}
              >
                {[...list].map((_, k) => {
                  const i = n - 1 - k; // the first print is drawn last, on top
                  const o = mid ? (i - mid) / mid : 0;
                  const anim = fan
                    ? { rotate: reduced ? o * 10 : o * 18, x: o * (reduced ? 10 : 22), y: -Math.abs(o) * 2 }
                    : { rotate: PACK[i], x: i ? (i % 2 ? 3 : -3) : 0, y: i * -1 };
                  return <div key={i} className="vsw-slot">{img(i, { width: 96, height: 96, borderRadius: radius }, anim)}</div>;
                })}
              </button>
              <span className="vsw-sum">{n} prints{prices ? ` · ${money(total, currency)}` : ""}</span>
            </div>
          )}
        </div>
      </LayoutGroup>
    </LazyMotion>
  );
}
