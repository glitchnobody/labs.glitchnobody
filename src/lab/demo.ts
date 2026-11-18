import type { Step } from ".";

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Plays a demo as a pretend cursor over `area`. The pointer events it sends are
   the ones a hand would, so the block behaves as it does for a person.
   Returns a stop function; `done` runs when the demo ends or is stopped. */
export function runDemo(area: HTMLElement, host: HTMLElement, steps: Step[], done: () => void) {
  const cursor = host.querySelector<HTMLElement>(".cursor")!;
  let stopped = false;
  let at = { x: 0, y: 0 };
  let pressed: Element | null = null;
  let over: Element | null = null;

  const send = (target: Element, type: string, extra: PointerEventInit = {}) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        clientX: at.x,
        clientY: at.y,
        button: 0,
        buttons: pressed ? 1 : 0,
        ...extra,
      }),
    );

  /* what is under the cursor; while pressed it stays on what was pressed, as with pointer capture */
  const place = (x: number, y: number) => {
    at = { x, y };
    const hostBox = host.getBoundingClientRect();
    cursor.style.transform = `translate(${x - hostBox.left}px, ${y - hostBox.top}px)`;
    const target = pressed ?? document.elementFromPoint(x, y);
    if (!target) return;
    if (!pressed && target !== over) {
      if (over) send(over, "pointerout", { relatedTarget: target });
      send(target, "pointerover", { relatedTarget: over });
      over = target;
    }
    send(target, "pointermove");
  };

  const point = (f: [number, number]) => {
    const box = area.getBoundingClientRect();
    return { x: box.left + box.width * f[0], y: box.top + box.height * f[1] };
  };

  /* types into the focused field the way a keyboard would: keydown, the value
     set through the native setter (so React sees it), input, keyup */
  const type = async (text: string, ms: number) => {
    for (const ch of text) {
      if (stopped) return;
      const field = document.activeElement;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) || !(area.contains(field) || host.contains(field))) return;
      const key = { key: ch, bubbles: true, cancelable: true, composed: true };
      const full = field.maxLength >= 0 && field.value.length >= field.maxLength;
      if (field.dispatchEvent(new KeyboardEvent("keydown", key)) && !full) {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")!.set!;
        const at = field.selectionStart ?? field.value.length;
        setter.call(field, field.value.slice(0, at) + ch + field.value.slice(field.selectionEnd ?? at));
        if (field.selectionStart !== null) field.setSelectionRange(at + 1, at + 1); // null on fields without a caret (email, number)
        field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: ch }));
      }
      field.dispatchEvent(new KeyboardEvent("keyup", key));
      await wait(ms / text.length);
    }
  };

  const play = async () => {
    cursor.dataset.on = "";
    for (const step of steps) {
      if (stopped) break;
      if ("wait" in step) await wait(step.wait);
      else if ("down" in step) {
        pressed = document.elementFromPoint(at.x, at.y);
        cursor.dataset.down = "";
        if (pressed) send(pressed, "pointerdown");
        await wait(60);
      } else if ("up" in step) {
        const target = pressed;
        pressed = null;
        delete cursor.dataset.down;
        if (target) {
          send(target, "pointerup");
          /* a click on the card's own link would open the modal, so only blocks get one */
          if (!target.closest("a")) target.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: at.x, clientY: at.y }));
        }
        await wait(60);
      } else if ("type" in step) {
        await type(step.type, step.ms ?? step.type.length * 80);
      } else {
        const to = point(step.move);
        const from = at.x || at.y ? at : to;
        const ms = step.ms ?? 400;
        const start = performance.now();
        for (let t = 0; !stopped && t < 1; ) {
          t = ms ? Math.min(1, (performance.now() - start) / ms) : 1;
          const k = ease(t);
          place(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k);
          if (t < 1) await new Promise(requestAnimationFrame);
        }
      }
    }
    /* let go of anything still held, and leave */
    if (pressed) send(pressed, "pointerup");
    if (over) send(over, "pointerout", { relatedTarget: null });
    pressed = null;
    delete cursor.dataset.on;
    delete cursor.dataset.down;
    done();
  };

  play();
  return () => {
    stopped = true;
  };
}
