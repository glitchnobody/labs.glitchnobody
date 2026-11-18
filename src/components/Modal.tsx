import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { blocks } from "../lab";
import Detail from "./Detail";
import { play } from "../lab/sound";

const slugOf = (path: string) => {
  const slug = path.replace(/^\/|\/$/g, "");
  return slug in blocks ? slug : null;
};

/* the component modal over the wall. The URL is the state: opening a card
   pushes /slug, closing pushes /, and Back / Forward walk between them */
export default function Modal() {
  const [slug, setSlug] = useState(() => slugOf(location.pathname));
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState(slug); // what the dialog shows; outlives slug while it shrinks away

  useEffect(() => {
    const click = (e: MouseEvent) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>("a[data-block]");
      if (!link || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return; // let new-tab clicks through
      e.preventDefault();
      history.pushState(null, "", link.href);
      setSlug(link.dataset.block!);
    };
    const pop = () => setSlug(slugOf(location.pathname));
    document.addEventListener("click", click);
    addEventListener("popstate", pop);
    return () => {
      document.removeEventListener("click", click);
      removeEventListener("popstate", pop);
    };
  }, []);

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
  const ease = "cubic-bezier(.4, 0, .1, 1)"; // eases in and out, so the trip reads as one smooth move
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parts = (el: HTMLElement) => ({ st: el.querySelector<HTMLElement>(".stage"), pn: el.querySelector<HTMLElement>(".panel") });
  const slideFrom = (st: HTMLElement, pn: HTMLElement) => `translateX(${st.getBoundingClientRect().right - pn.getBoundingClientRect().right}px)`;

  useEffect(() => {
    const el = dialog.current!;
    if (slug) setView(slug);
    if (slug && !el.open) {
      const card = reduced() ? null : cardOf(slug);
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
      const { st, pn } = parts(el);
      const card = reduced() ? null : lifted.current;
      const c = onScreen(card);
      const bg = getComputedStyle(el).backgroundColor;
      el.animate([{ backgroundColor: bg }, { backgroundColor: "transparent" }], { duration: 460, delay: 80, easing: "ease-in-out", fill: "forwards" });
      let a: Animation;
      if (st && pn && c) {
        pn.animate([{ transform: "none", opacity: 1 }, { transform: slideFrom(st, pn), opacity: 0 }], { duration: 300, easing: ease, fill: "forwards" });
        a = st.animate([rest, pose(st, c)], { duration: 480, delay: 160, easing: ease, fill: "forwards" });
      } else a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
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
    const el = dialog.current!, { st, pn } = parts(el);
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
      lifted.current = card;
      card.setAttribute("data-lifted", "");
      st.style.zIndex = "1";
      st.animate([{ ...pose(st, c), boxShadow: "0 0 0 transparent" }, { boxShadow: "0 30px 80px rgb(0 0 0 / 25%)", offset: 0.5 }, { ...rest, boxShadow: "0 0 0 transparent" }], { duration: 560, easing: ease });
      pn.animate([{ transform: slideFrom(st, pn), opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 440, delay: 300, easing: ease, fill: "backwards" });
      fadeIn(120, 520);
    } else {
      el.querySelector<HTMLElement>(".detail")?.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: reduced() ? 150 : 260, easing: ease });
      fadeIn(0, 200);
    }
  }, [view, opens]);

  const close = () => {
    history.pushState(null, "", "/");
    setSlug(null);
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
      {view && <Detail key={view} slug={view} onClose={close} />}
    </dialog>
  );
}
