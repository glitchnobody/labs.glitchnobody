import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { blocks } from "../lab";
import Detail from "./Detail";
import { play } from "../lab/sound";

/* the component modal over the wall. The URL is the state: /<slug> opens it, /
   closes it, and Back / Forward walk between them (TanStack Router owns history;
   a[data-block] links are turned into router navigations by the root route) */
export default function Modal({ back = "/components" }: { back?: "/" | "/components" }) {
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = params.slug && params.slug in blocks ? params.slug : null;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dialog = useRef<HTMLDialogElement>(null);
  /* what the dialog shows; set on the client only (Detail reads the document),
     and it outlives slug while the card shrinks back */
  const [view, setView] = useState<string | null>(null);

  /* opening: the card itself lifts off the wall and travels to the middle,
     growing into the stage (moved with a transform and uncropped with a clip-path,
     so the component inside is never stretched); its spot on the wall is left as a
     dashed skeleton; the settings panel slides out from behind the stage while the
     backdrop fades in. Closing plays it backwards and the card drops back in. */
  const cardOf = (s: string) => document.querySelector<HTMLElement>(`a.card-open[data-block="${s}"]`)?.closest<HTMLElement>(".card") ?? null;
  const onScreen = (c: HTMLElement | null) => { const r = c?.getBoundingClientRect(); return r && r.bottom > 0 && r.top < innerHeight ? r : null; };
  /* the stage's start pose: centred on the card and cropped to the card's size */
  const pose = (st: HTMLElement, c: DOMRect) => {
    const r = st.getBoundingClientRect();
    const dx = c.left + c.width / 2 - (r.left + r.width / 2), dy = c.top + c.height / 2 - (r.top + r.height / 2);
    const ix = Math.max(0, (r.width - c.width) / 2), iy = Math.max(0, (r.height - c.height) / 2);
    return { transform: `translate(${dx}px, ${dy}px)`, clipPath: `inset(${iy}px ${ix}px round 10px)` };
  };
  const rest = { transform: "none", clipPath: "inset(0px 0px round 10px)" };
  const opening = useRef<HTMLElement | null | undefined>(undefined);
  const bgRef = useRef("");
  const [opens, setOpens] = useState(0); // bumps on every open so the entrance runs even when view did not change
  const lifted = useRef<HTMLElement | null>(null);
  const last = useRef<string | null>(null);
  const POP = "cubic-bezier(.16, 1, .3, 1)"; // Cosmos popover curve: quick start, soft settle, no overshoot
  const ease = "cubic-bezier(.4, 0, .1, 1)"; // eases in and out, so the trip reads as one smooth move
  const mobile = () => matchMedia("(max-width: 820px)").matches; // a bottom drawer instead of the card lift
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parts = (el: HTMLElement) => ({ st: el.querySelector<HTMLElement>(".stage"), pn: el.querySelector<HTMLElement>(".panel"), sh: el.querySelector<HTMLElement>(".sheet") });

  /* warm a component up while the pointer is over its card, so opening it never waits on the module or the code view */
  useEffect(() => {
    const warm = (e: PointerEvent) => {
      const slug = (e.target as Element).closest?.(".card")?.querySelector<HTMLElement>("a.card-open")?.dataset.block;
      if (!slug || !blocks[slug]) return;
      blocks[slug].load();
      qc.prefetchQuery({ queryKey: ["code", slug], queryFn: () => fetch(`/api/code/${slug}`).then((r) => r.json()), staleTime: Infinity });
    };
    document.addEventListener("pointerover", warm);
    return () => document.removeEventListener("pointerover", warm);
  }, [qc]);
  const slideFrom = (st: HTMLElement, pn: HTMLElement) => `translateX(${st.getBoundingClientRect().right - pn.getBoundingClientRect().right}px)`;

  useEffect(() => {
    const el = dialog.current!;
    if (slug) setView(slug);
    if (slug && !el.open) {
      const card = reduced() || mobile() ? null : cardOf(slug);
      opening.current = onScreen(card) ? card : null;
      /* open see-through: the backdrop only arrives with the animation, never as a first-frame flash */
      el.style.background = "";
      bgRef.current = getComputedStyle(el).backgroundColor;
      el.style.background = "transparent";
      el.showModal();
      setOpens((n) => n + 1);
      play("expand", { volume: 0.35 });
    }
    if (!slug && el.open) {
      const { st, pn, sh } = parts(el);
      const card = reduced() || mobile() ? null : lifted.current;
      const c = onScreen(card);
      const bg = getComputedStyle(el).backgroundColor;
      el.animate([{ backgroundColor: bg }, { backgroundColor: "transparent" }], { duration: 360, delay: 60, easing: "ease-in-out", fill: "forwards" });
      let a: Animation;
      if (st && pn && c) {
        pn.animate([{ transform: "none", opacity: 1 }, { transform: slideFrom(st, pn), opacity: 0 }], { duration: 240, easing: ease, fill: "forwards" });
        a = st.animate([rest, pose(st, c)], { duration: 380, delay: 120, easing: ease, fill: "forwards" });
      } else if (sh && mobile() && !reduced()) a = sh.animate([{ transform: sh.style.transform || "none" }, { transform: "translateY(100%)" }], { duration: 300, easing: "cubic-bezier(.5, 0, .75, 0)", fill: "forwards" });
      else a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
      a.onfinish = () => {
        el.close();
        el.querySelectorAll("*").forEach((x) => x.getAnimations().forEach((y) => y.cancel()));
        el.getAnimations().forEach((x) => x.cancel());
        lifted.current?.removeAttribute("data-lifted");
        lifted.current = null;
        setView(null);
      };
      play("collapse", { volume: 0.3 });
    }
    last.current = slug;
    document.title = slug ? `${blocks[slug].name} | glitchnobody labs` : "glitchnobody labs";
  }, [slug]);

  /* runs once the panels exist, before paint, so they never flash in place */
  useLayoutEffect(() => {
    const el = dialog.current!, { st, pn, sh } = parts(el);
    if (!view || !st || !pn || opening.current === undefined) return;
    const card = opening.current;
    opening.current = undefined;
    const bg = bgRef.current;
    const c = card?.getBoundingClientRect();
    const fadeIn = (delay: number, duration: number) => {
      const a = el.animate([{ backgroundColor: "transparent" }, { backgroundColor: bg }], { duration, delay, easing: "ease-out", fill: "forwards" });
      a.onfinish = () => { el.style.background = ""; a.cancel(); };
    };
    if (card && c) {
      const from = slideFrom(st, pn); // measured at rest: the stage's animation below moves its box
      lifted.current = card;
      card.setAttribute("data-lifted", "");
      st.style.zIndex = "1";
      /* the stage travels on a soft spring (a touch of overshoot), the shadow rises and falls on its own curve */
      st.style.willChange = "transform, clip-path"; // its own layer for the trip, so nothing repaints per frame
      const trip = st.animate([pose(st, c), rest], { duration: 420, easing: POP });
      trip.onfinish = () => { st.style.willChange = ""; };
      st.animate([{ boxShadow: "0 0 0 transparent" }, { boxShadow: "0 30px 80px rgb(0 0 0 / 25%)", offset: 0.4 }, { boxShadow: "0 0 0 transparent" }], { duration: 420, easing: "ease-in-out" });
      /* the panel pushes out from under the stage on a bouncier spring and stretches as it lands */
      pn.animate([{ transform: `translateX(${from})` }, { transform: "none" }], { duration: 300, delay: 100, easing: POP, fill: "backwards" });
      pn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 100, easing: "ease-out", fill: "backwards" });
      fadeIn(60, 380);
    } else if (sh && mobile()) {
      /* the drawer rises from the bottom edge with a little spring */
      sh.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 360, easing: POP });
      fadeIn(0, 280);
    } else {
      el.querySelector<HTMLElement>(".detail")?.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: reduced() ? 150 : 260, easing: ease });
      fadeIn(0, 200);
    }
  }, [view, opens]);

  const close = () => navigate({ to: back, resetScroll: false });

  /* drag the grip down to dismiss the drawer; a short drag springs back */
  const drag = (e: React.PointerEvent<HTMLElement>) => {
    const sh = e.currentTarget.closest<HTMLElement>(".sheet")!;
    const y0 = e.clientY, t0 = performance.now();
    let dy = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => { dy = Math.max(0, m.clientY - y0); sh.style.transform = `translateY(${dy}px)`; };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (dy > 120 || dy / (performance.now() - t0) > 0.6) return close();
      sh.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 300, easing: POP });
      sh.style.transform = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-label={slug ? blocks[slug].name : undefined}
      onCancel={(e) => {
        e.preventDefault(); // Escape goes through close(), so the URL follows
        close();
      }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {view && (
        <div className="sheet">
          <span className="sheet-grip" onPointerDown={drag} />
          <Detail key={view} slug={view} onClose={close} />
        </div>
      )}
    </dialog>
  );
}
