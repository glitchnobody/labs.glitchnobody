/* ══ Wallet top-up ════════════════════════════════════
   A wallet balance that opens into a top-up form. Press Add Cash and the
   card grows while the button travels to the bottom; pick a saved card and
   an amount, press Add Cash again, and the card folds shut while the
   balance rolls up and coins burst out of it.

   ── ONE BUTTON, TWO PLACES ───────────────────────────
   The Add Cash button carries a shared layout id from motion. Closed, it
   sits in the header; open, the same id is rendered at the bottom of the
   form, so motion animates the button from one spot to the other while
   the card's own size animates around it.

   ── ROLLING BALANCE ──────────────────────────────────
   Each digit of the balance is a window over a strip of 0 to 9. A new
   balance moves every strip with a transform, a little later for each
   digit from the right, so the number rolls like an odometer.

   ── RESET ────────────────────────────────────────────
   On a showcase wall the balance would only ever grow, so after a few
   seconds it rolls back to where it started. */
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { LayoutGroup, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { Icon } from "@iconify/react";

const AMOUNTS = { Small: [10, 20, 50], Medium: [50, 100, 300], Large: [100, 500, 1000] };
const CARDS = ["6756", "4632", "1190"];

export type WalletTopupProps = {
  chips?: "Small" | "Medium" | "Large";
  cards?: number;
  burst?: boolean;
  reset?: number;
  balance?: number;
  currency?: string;
  onTopUp?: (v: { amount: number; card: string }) => void;
  sound?: boolean;
  volume?: number;
  onSound?: (name: string, o?: { volume?: number; pitch?: number }) => unknown;
};

function Roll({ text }: { text: string }) {
  const digits = [...text];
  return (
    <span className="wtu-roll" aria-label={text}>
      {digits.map((c, i) => {
        if (!/\d/.test(c)) return <span key={`${digits.length}-${i}`} aria-hidden>{c}</span>;
        const order = digits.slice(i + 1).filter((d) => /\d/.test(d)).length;
        return (
          <span key={`${digits.length}-${i}`} className="wtu-dig" aria-hidden>
            <span style={{ transform: `translateY(${-Number(c) * 10}%)`, transitionDelay: `${order * 40}ms` }}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function WalletTopup({
  chips = "Medium", cards = 2, burst = true, reset = 5, balance: start = 34, currency = "USD", onTopUp, sound = true, volume = 70, onSound,
}: WalletTopupProps) {
  const [open, setOpen] = useState(false);
  const [bal, setBal] = useState(start);
  const [card, setCard] = useState(0);
  const [amt, setAmt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [coins, setCoins] = useState(0);
  const [say, setSay] = useState("");
  const reduced = useReducedMotion();
  const group = useId();
  const btn = useRef<HTMLButtonElement>(null), firstCard = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const n = Math.max(1, Math.min(3, Math.round(cards)));
  const list = AMOUNTS[chips];
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 });

  useEffect(() => setBal(start), [start]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (card >= n) setCard(0); }, [n, card]);

  const snd = (name: string, o: { volume?: number; pitch?: number } = {}) => {
    if (sound && onSound) onSound(name, { ...o, volume: (o.volume ?? 1) * (volume / 100) });
  };
  const later = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)); };

  function show() {
    setOpen(true); setAmt(null); setCard(0);
    snd("expand", { volume: 0.5 });
    later(60, () => firstCard.current?.focus({ preventScroll: true }));
  }
  function close() {
    setOpen(false);
    snd("collapse", { volume: 0.5 });
    later(60, () => btn.current?.focus({ preventScroll: true }));
  }
  function add() {
    if (!open) return show();
    if (busy) return;
    if (amt === null) { setShake((s) => s + 1); snd("tick", { volume: 0.4, pitch: 0.7 }); return; }
    setBusy(true);
    later(600, () => {
      setBusy(false); setOpen(false);
      const next = bal + amt;
      later(reduced ? 0 : 280, () => {
        setBal(next);
        if (burst && !reduced) setCoins((c) => c + 1);
        snd("coins", { volume: 0.55 });
        setSay(`Added ${fmt.format(amt)}. Balance ${fmt.format(next)}`);
      });
      onTopUp?.({ amount: amt, card: CARDS[card] });
      if (reset > 0) later(reset * 1000 + 280, () => setBal(start));
    });
  }

  const radioKeys = (len: number, cur: number, set: (i: number) => void) => (e: KeyboardEvent) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const i = (cur + d + len) % len;
    set(i); snd("tick", { volume: 0.4 });
    ((e.currentTarget as HTMLElement).children[i] as HTMLElement)?.focus();
  };
  const spring = reduced ? { duration: 0.15 } : { type: "spring" as const, bounce: 0.18, duration: 0.45 };

  const addBtn = (
    <m.button
      ref={btn}
      layoutId="add"
      transition={spring}
      type="button"
      className="wtu-add"
      aria-expanded={open}
      onClick={add}
    >
      <Icon icon={busy ? "ph:circle-notch-bold" : "ph:plus-bold"} width={12} height={12} className={busy ? "wtu-spin" : undefined} />
      Add Cash
    </m.button>
  );

  return (
    <LazyMotion features={domMax} strict>
      <LayoutGroup id={group}>
        <m.div layout transition={spring} className="wtu" data-open={open} style={{ borderRadius: 10 } as CSSProperties}
          onKeyDown={(e) => { if (e.key === "Escape" && open) { e.preventDefault(); close(); } }}>
          <m.div layout="position" transition={spring} className="wtu-head">
            <span className="wtu-tile"><Icon icon="ph:wallet-fill" width={16} height={16} /></span>
            <span className="wtu-bal">
              <small>Wallet</small>
              <b><Roll text={fmt.format(bal)} /></b>
              {coins > 0 && (
                <span key={coins} className="wtu-coins" aria-hidden>
                  {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} style={{ "--a": `${-160 + i * 20}deg`, "--d": `${i * 25}ms` } as CSSProperties}><Icon icon="ph:coin-fill" width={12} height={12} /></i>
                  ))}
                </span>
              )}
            </span>
            {open ? (
              <button type="button" className="wtu-x" aria-label="Close" onClick={close}><Icon icon="ph:x-bold" width={12} height={12} /></button>
            ) : addBtn}
          </m.div>
          {open && (
            <div className="wtu-body">
              <div className="wtu-sec" style={{ "--i": 0 } as CSSProperties}>
                <div className="wtu-row"><span className="wtu-h">Payment mode</span><button type="button" className="wtu-chip"><Icon icon="ph:credit-card" width={12} height={12} />Add card</button></div>
                <div className="wtu-cards" role="radiogroup" aria-label="Payment card" onKeyDown={radioKeys(n, card, setCard)}>
                  {CARDS.slice(0, n).map((c, i) => (
                    <button key={c} ref={i === 0 ? firstCard : undefined} type="button" role="radio" aria-checked={card === i} tabIndex={card === i ? 0 : -1}
                      className="wtu-card" data-on={card === i} onClick={() => { if (card !== i) { setCard(i); snd("tick", { volume: 0.4 }); } }}>
                      <i className="wtu-radio" />
                      <Icon icon="ph:credit-card" width={14} height={14} />
                      •••• {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wtu-sec" style={{ "--i": 1 } as CSSProperties}>
                <span className="wtu-h">Cash</span>
                <div key={shake} className="wtu-amts" data-shake={shake > 0} role="radiogroup" aria-label="Amount" onKeyDown={radioKeys(3, amt === null ? -1 : list.indexOf(amt), (i) => setAmt(list[i]))}>
                  {list.map((v) => (
                    <button key={v} type="button" role="radio" aria-checked={amt === v} tabIndex={amt === v || (amt === null && v === list[0]) ? 0 : -1}
                      className="wtu-amt" data-on={amt === v} onClick={() => { if (amt !== v) { setAmt(v); snd("tick", { volume: 0.4 }); } }}>
                      {fmt.format(v).replace(".00", "")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wtu-foot" style={{ "--i": 2 } as CSSProperties}>{addBtn}</div>
            </div>
          )}
          <span className="wtu-sr" aria-live="polite">{say}</span>
        </m.div>
      </LayoutGroup>
    </LazyMotion>
  );
}
