/* ══ QR share ═════════════════════════════════
   A share button that blooms into a scannable QR code. Press the pill to
   reveal the code rippling in dot by dot, copy the link, or close it back
   into a pill.

   ── ONE MORPHING BOX ─────────────────────────
   The root is the only box. Its width, height and radius are CSS transitions
   between the pill's size (measured from its label) and the card's size, so
   closing in the middle of opening simply reverses from wherever it is. The
   pill and the card sit on top of each other inside it; the one that is not
   showing blurs and fades out while the other blurs in.

   ── A REAL QR CODE ───────────────────────────
   qrcode-generator computes the matrix. The drawing is our own SVG: data
   modules are dots, squares or diamonds at 78% of a module, and each of the
   three finder patterns is a single path (ring plus eye). Dark mode simply
   swaps the colours, giving an inverted code that current phone cameras read.

   ── THE RIPPLE ───────────────────────────────
   Every module has a delay proportional to its distance from the centre, so
   the whole ripple takes the chosen time. Finders scale in last with a small
   overshoot.

   ── COPYING ──────────────────────────────────
   The label keeps its shared letters and blurs the new ones in. If the
   clipboard is refused, the link goes into a hidden selected input and the
   label asks for Ctrl+C. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";
import qrcode from "qrcode-generator";

type Sound = (name: string, o?: { volume?: number; pitch?: number; loop?: boolean }) => unknown;

export type QrShareProps = {
  dots?: "Round" | "Square" | "Diamond";
  finders?: "Rounded" | "Square" | "Circle";
  ripple?: boolean;
  /** ms the ripple takes */
  rippleSpeed?: number;
  /** blur in px during the morph */
  blur?: number;
  /** code size in px */
  size?: number;
  /** quiet zone in modules */
  quiet?: number;
  accent?: "Ink" | "Pick";
  url?: string;
  label?: string;
  sound?: boolean;
  /** 0 to 100 */
  volume?: number;
  onSound?: Sound;
};

const PILL_H = 40;
const PAD = 10;
const BTN_H = 36;
const COPY = "Copy link";
const COPIED = "Copied link";

export function QrShare({
  dots = "Round",
  finders = "Rounded",
  ripple = true,
  rippleSpeed = 500,
  blur = 10,
  size = 170,
  quiet = 2,
  accent = "Ink",
  url = "https://labs.glitchnobody.com",
  label = "Show QR code",
  sound = true,
  volume = 70,
  onSound,
}: QrShareProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [copied, setCopied] = useState<"no" | "yes" | "manual">("no");
  const [pillW, setPillW] = useState(150);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    if (measureRef.current) setPillW(Math.ceil(measureRef.current.offsetWidth) + 32);
  }, [label, mounted]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const play = useCallback(
    (name: string, v: number) => {
      if (sound) onSound?.(name, { volume: (v * volume) / 100 });
    },
    [sound, volume, onSound],
  );

  const matrix = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(url);
    q.make();
    const n = q.getModuleCount();
    const rows: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      rows.push([]);
      for (let c = 0; c < n; c++) rows[r].push(q.isDark(r, c));
    }
    return rows;
  }, [url]);

  const n = matrix.length;
  const total = n + quiet * 2;
  const cardW = size + PAD * 2;
  const cardH = PAD * 2 + size + 8 + BTN_H;

  const toggle = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    if (next) {
      setOpenCount((c) => c + 1);
      play("expand", 0.5);
      setTimeout(() => copyRef.current?.focus({ preventScroll: true }), 30);
    } else {
      play("collapse", 0.5);
      setTimeout(() => pillRef.current?.focus({ preventScroll: true }), 30);
    }
  };

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(url);
      setCopied("yes");
    } catch {
      hidden.current?.select();
      setCopied("manual");
    }
    timer.current = setTimeout(() => setCopied("no"), 2000);
  };

  // Escape, scoped to the pointer or focus being inside this block
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (!root) return;
    const scope = root.closest("[data-shortcut-scope]") ?? root;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (scope.matches(":hover") || root.contains(document.activeElement))) toggle(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // finders as one path each: ring (evenodd) + eye
  const finderPath = (x: number, y: number) => {
    const rect = (px: number, py: number, s: number, r: number) =>
      `M${px + r} ${py}h${s - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${s - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(s - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(s - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
    const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
    if (finders === "Circle") return circ(x + 3.5, y + 3.5, 3.5) + circ(x + 3.5, y + 3.5, 2.5) + circ(x + 3.5, y + 3.5, 1.5);
    const k = finders === "Rounded" ? 1 : 0;
    return rect(x, y, 7, k * 2.2) + rect(x + 1, y + 1, 5, k * 1.4) + rect(x + 2, y + 2, 3, k * 0.9);
  };

  const inFinder = (r: number, c: number) => (r < 7 && (c < 7 || c >= n - 7)) || (r >= n - 7 && c < 7);
  const mid = n / 2;
  const maxD = Math.hypot(mid, mid);

  const modules: React.ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c] || inFinder(r, c)) continue;
      const cx = c + 0.5,
        cy = r + 0.5;
      const delay = ripple ? (Math.hypot(cx - mid, cy - mid) / maxD) * rippleSpeed * 0.75 : 0;
      const st = { "--qrs-d": `${delay}ms` } as CSSProperties;
      const d = 0.39;
      modules.push(
        dots === "Round" ? (
          <circle key={r * n + c} className="qrs-m" style={st} cx={cx} cy={cy} r={d} />
        ) : dots === "Square" ? (
          <rect key={r * n + c} className="qrs-m" style={st} x={cx - d} y={cy - d} width={d * 2} height={d * 2} />
        ) : (
          <rect key={r * n + c} className="qrs-m" style={st} x={cx - d} y={cy - d} width={d * 2} height={d * 2} transform={`rotate(45 ${cx} ${cy})`} />
        ),
      );
    }

  const common = copied === "yes" ? COPIED.length - COPY.length : 0;
  // shortcut: label morph keeps shared prefix/suffix letters only; new letters blur in, removed ones just vanish
  const text = copied === "yes" ? COPIED : copied === "manual" ? "Press Ctrl+C" : COPY;
  const letters = [...text].map((ch, i) => {
    const isNew = copied === "yes" && i >= 3 && i < 3 + common + 1;
    return (
      <span key={`${copied}${i}`} className={isNew ? "qrs-new" : undefined} aria-hidden="true">
        {ch === " " ? " " : ch}
      </span>
    );
  });

  const style = {
    "--qrs-blur": `${blur}px`,
    "--qrs-ripple": `${rippleSpeed}ms`,
    "--qrs-size": `${size}px`,
    "--qrs-pill-w": `${pillW}px`,
    "--qrs-card-w": `${cardW}px`,
    "--qrs-card-h": `${cardH}px`,
    "--qrs-dot": accent === "Pick" ? "var(--pick)" : "var(--fill-on)",
    width: open ? cardW : pillW,
    height: open ? cardH : PILL_H,
    borderRadius: open ? "var(--r-panel)" : "var(--r-pill)",
  } as CSSProperties;

  return (
    <div ref={rootRef} className="qrs" data-open={open ? "true" : "false"} style={style}>
      <span ref={measureRef} className="qrs-measure" aria-hidden="true">{label}<i /></span>
      <button ref={pillRef} type="button" className="qrs-pill" aria-expanded={open} tabIndex={open ? -1 : 0} onClick={() => toggle(true)}>
        {mounted ? <Icon icon="ph:qr-code-bold" width={16} height={16} /> : <span className="qrs-ph" />}
        <span>{label}</span>
      </button>
      <div className="qrs-card" aria-hidden={!open} inert={!open}>
        <div className="qrs-plate" style={{ width: size, height: size }}>
          <svg
            key={openCount}
            viewBox={`${-quiet} ${-quiet} ${total} ${total}`}
            width={size}
            height={size}
            role="img"
            aria-label={`QR code for ${url.replace(/^https?:\/\//, "")}`}
          >
            <g className="qrs-dots">{modules}</g>
            <path className="qrs-finders" fillRule="evenodd" d={finderPath(0, 0)} />
            <path className="qrs-finders" fillRule="evenodd" d={finderPath(n - 7, 0)} />
            <path className="qrs-finders" fillRule="evenodd" d={finderPath(0, n - 7)} />
          </svg>
        </div>
        <div className="qrs-row">
          <button ref={copyRef} type="button" className="qrs-copy" onClick={copy} aria-label={copied === "yes" ? COPIED : COPY}>
            {mounted && <Icon icon="ph:link-bold" width={16} height={16} />}
            <span className="qrs-label">{letters}</span>
          </button>
          <button type="button" className="qrs-x" aria-label="Close" onClick={() => toggle(false)}>
            {mounted ? <Icon icon="ph:x-bold" width={16} height={16} /> : null}
          </button>
        </div>
        <input ref={hidden} className="qrs-hidden" readOnly value={url} tabIndex={-1} aria-hidden="true" />
      </div>
      <span className="qrs-live" role="status" aria-live="polite">{copied === "yes" ? "Link copied" : ""}</span>
    </div>
  );
}
