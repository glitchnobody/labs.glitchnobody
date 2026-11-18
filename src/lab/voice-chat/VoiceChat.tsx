/* ══ Voice chat ═══════════════════════════════════════
   A voice room that lives in a small pill of avatars. Press the pill and it
   opens into a card showing everyone, with live speaking indicators; join
   to add yourself, unmute your mic, leave again, and close the card to fold
   it back into the pill. Escape closes it from the keyboard.

   ── ONE SHAPE, TWO SIZES ─────────────────────────────
   The pill and the card are the same element with a motion layout
   animation, so opening grows it from the pill's size and corners to the
   card's. Each avatar has its own layout id and flies from its spot in the
   row to its spot in the grid, a little after the one before it. People
   who did not fit in the pill grow out of the "+N" count.

   ── SPEAKING ─────────────────────────────────────────
   Every few seconds, give or take a third, one or two people start talking
   for one to three seconds. A talker gets three bouncing bars and a soft
   green pulse around their avatar; you can only be picked while your mic
   is on.

   ── YOU ──────────────────────────────────────────────
   Joining pops your avatar into the last grid spot with a muted mic badge
   and swaps the button for a mic toggle and Leave. Folded up, the pill
   keeps a green ring on its badge so you can see you are still in. */
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, LayoutGroup, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { Icon } from "@iconify/react";

const NAMES = ["Oğuz", "Ashish", "Mariana", "Mika", "Ana", "Nathan", "Afshin", "June", "Theo", "Sana", "Leo", "Ines"];

export type VoiceChatProps = {
  people?: number;
  visible?: number;
  columns?: number;
  overlap?: number;
  size?: number;
  names?: boolean;
  title?: string;
  button?: string;
  note?: string;
  speaking?: boolean;
  turn?: number;
  bounce?: number;
  speed?: number;
  stagger?: number;
  hoverOpen?: boolean;
  /** one photo per person, in NAMES order; without them people get gradient avatars */
  avatars?: string[];
  /** your own avatar */
  me?: string;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const gradient = (s: string) => { const h = hash(s); return `linear-gradient(135deg, hsl(${h % 360} 70% 62%), hsl(${(h >> 8) % 360} 70% 46%))`; };

export function VoiceChat({
  people = 7, visible = 4, columns = 4, overlap = 10, size = 40, names = true, title = "Voice Chat", button = "Join Now",
  note = "Mic will be muted initially.", speaking = true, turn = 2.5, bounce = 25, speed = 60, stagger = 25, hoverOpen = false,
  avatars, me, sound = true, volume = 70, onSound,
}: VoiceChatProps) {
  const n = Math.max(3, Math.min(12, Math.round(people)));
  const vis = Math.max(2, Math.min(6, Math.round(visible), n));
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [mic, setMic] = useState(false);
  const [talk, setTalk] = useState<number[]>([]);
  const reduced = !!useReducedMotion();
  const group = useId();
  const root = useRef<HTMLDivElement>(null), pill = useRef<HTMLButtonElement>(null), closeBtn = useRef<HTMLButtonElement>(null);
  const leaveT = useRef(0);
  const live = useRef({ joined, mic, n });
  live.current = { joined, mic, n };

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };

  /* random speakers; -1 is you */
  useEffect(() => {
    if (!speaking) { setTalk([]); return; }
    let t = 0;
    const next = () => {
      const l = live.current, pool = Array.from({ length: l.n }, (_, i) => i);
      if (l.joined && l.mic) pool.push(-1);
      const pick = [pool[Math.floor(Math.random() * pool.length)]];
      if (Math.random() < 0.4) pick.push(pool[Math.floor(Math.random() * pool.length)]);
      setTalk([...new Set(pick)]);
      t = window.setTimeout(() => { setTalk([]); t = window.setTimeout(next, turn * 1000 * (0.7 + Math.random() * 0.6)); }, 1000 + Math.random() * 2000);
    };
    t = window.setTimeout(next, 600);
    return () => clearTimeout(t);
  }, [speaking, turn]);

  function setOpenTo(v: boolean) {
    if (v === open) return;
    setOpen(v);
    snd(v ? "expand" : "collapse", { volume: v ? 0.7 : 0.6 });
    setTimeout(() => (v ? closeBtn.current : pill.current)?.focus({ preventScroll: true }), 60);
  }
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      const el = root.current;
      if (e.key !== "Escape" || !el) return;
      const scope = el.closest("[data-shortcut-scope]") ?? el;
      if (scope.matches(":hover") || scope.contains(document.activeElement)) setOpenTo(false);
    };
    const down = (e: PointerEvent) => {
      const stage = root.current?.closest(".stage-block");
      if (stage && stage.contains(e.target as Node) && !root.current!.contains(e.target as Node)) setOpenTo(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", down); };
  });

  const spring = (i = 0) => reduced ? { duration: 0.15 } : { type: "spring" as const, bounce: (bounce / 100) * 0.6, duration: 0.7 - (speed / 100) * 0.45, delay: open ? (i * stagger) / 1000 : 0 };
  const face = (i: number) => {
    if (i === -1) return me ? `center / cover url("${me}")` : gradient("You");
    const img = avatars?.[i];
    return img ? `center / cover url("${img}")` : gradient(NAMES[i]);
  };
  const initial = (i: number) => (i === -1 ? (me ? "" : "Y") : avatars?.[i] ? "" : NAMES[i][0]);
  const av = (i: number, s: number) => (
    <m.span layoutId={`av-${i}`} transition={spring(Math.max(0, i))} className="vch-av" data-talk={talk.includes(i)}
      style={{ width: s, height: s, background: face(i), borderRadius: s } as CSSProperties}>
      {initial(i) && <span className="vch-init">{initial(i)}</span>}
    </m.span>
  );
  const hidden = n - vis + (joined ? 1 : 0);
  const speakingCount = talk.length;

  return (
    <LazyMotion features={domMax} strict>
      <LayoutGroup id={group}>
        <m.div
          ref={root}
          layout
          transition={spring()}
          className="vch"
          data-open={open}
          style={{ borderRadius: open ? 10 : 999, "--vch-s": `${size}px` } as CSSProperties}
          onPointerEnter={(e) => { if (hoverOpen && e.pointerType === "mouse") { clearTimeout(leaveT.current); setOpenTo(true); } }}
          onPointerLeave={(e) => { if (hoverOpen && e.pointerType === "mouse") leaveT.current = window.setTimeout(() => setOpenTo(false), 300); }}
        >
          <m.span layoutId="badge" transition={spring()} className="vch-badge" data-live={speakingCount > 0} data-in={joined}>
            <Icon icon="ph:waveform-bold" width={12} height={12} />
          </m.span>
          {!open ? (
            <button ref={pill} type="button" className="vch-pill" aria-expanded={false}
              aria-label={`Voice chat, ${n + (joined ? 1 : 0)} people, ${speakingCount} speaking`} onClick={() => setOpenTo(true)}>
              <span className="vch-row">
                {Array.from({ length: vis }, (_, i) => (
                  <span key={i} className="vch-slot" style={{ marginLeft: i ? -(size * overlap) / 100 : 0, zIndex: vis - i }}>{av(i, size)}</span>
                ))}
              </span>
              {hidden > 0 && <m.span layout="position" className="vch-more">+{hidden}<Icon icon="ph:caret-down-bold" width={12} height={12} /></m.span>}
            </button>
          ) : (
            <div className="vch-card" role="dialog" aria-label={title}>
              <div className="vch-head">
                <span className="vch-title">{title}</span>
                <button ref={closeBtn} type="button" className="vch-x" aria-label="Close" onClick={() => setOpenTo(false)}><Icon icon="ph:x-bold" width={14} height={14} /></button>
              </div>
              <div className="vch-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                <AnimatePresence initial={false}>
                  {[...Array.from({ length: n }, (_, i) => i), ...(joined ? [-1] : [])].map((i) => (
                    <m.div key={i} className="vch-cell" title={names ? undefined : i === -1 ? "You" : NAMES[i]}
                      initial={i === -1 ? { scale: 0 } : i >= vis ? { opacity: 0, scale: 0.6 } : false}
                      animate={{ opacity: 1, scale: 1 }} exit={{ scale: 0, opacity: 0 }} transition={spring(Math.max(0, i))}>
                      <span className="vch-wrap">
                        {av(i, size * 1.2)}
                        {talk.includes(i) && <span className="vch-bars"><i /><i /><i /></span>}
                        {i === -1 && <span className="vch-mic"><Icon icon={mic ? "ph:microphone-fill" : "ph:microphone-slash-fill"} width={10} height={10} /></span>}
                      </span>
                      {names && <span className="vch-name">{i === -1 ? "You" : NAMES[i]}</span>}
                    </m.div>
                  ))}
                </AnimatePresence>
              </div>
              {joined ? (
                <div className="vch-acts">
                  <button type="button" className="vch-btn vch-icon" aria-label={mic ? "Mute mic" : "Unmute mic"} aria-pressed={mic}
                    onClick={() => { setMic(!mic); snd("tick", { pitch: mic ? 0.9 : 1.15 }); }}>
                    <Icon icon={mic ? "ph:microphone-fill" : "ph:microphone-slash-fill"} width={16} height={16} />
                  </button>
                  <button type="button" className="vch-btn vch-leave" onClick={() => { setJoined(false); setMic(false); snd("leave", { volume: 0.7 }); }}>Leave</button>
                </div>
              ) : (
                <button type="button" className="vch-btn vch-join" onClick={() => { setJoined(true); setMic(false); snd("join", { volume: 0.8 }); }}>{button}</button>
              )}
              {note && <span className="vch-note">{note}</span>}
            </div>
          )}
        </m.div>
      </LayoutGroup>
    </LazyMotion>
  );
}
