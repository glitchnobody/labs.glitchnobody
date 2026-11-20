import { Icon } from "@iconify/react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { blocks } from "../lab";
import { play, setMuted } from "../lab/sound";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

/* before paint, so a saved theme or mute never flashes the other state */
const INIT = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t;if(localStorage.getItem("muted"))document.documentElement.setAttribute("data-muted","")}catch(e){}`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "glitchnobody labs" },
			{
				name: "description",
				content: "Interactive UI components to play with, tune and take.",
			},
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300..600&display=swap",
			},
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "stylesheet", href: appCss },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed inline script that must run before paint */}
				<script dangerouslySetInnerHTML={{ __html: INIT }} />
				<HeadContent />
			</head>
			<body>
				<header className="top">
					<nav className="top-nav" aria-label="Pages">
						<Link className="brand" to="/" aria-label="glitchnobody labs, home">
							<img className="brand-logo" src="/favicon.svg" alt="" width={24} height={24} />
						</Link>
						<Link className="nav-link" to="/components">
							Components
						</Link>
						<Link className="nav-link" to="/sounds">
							Sounds
						</Link>
					</nav>
					<button type="button" className="pill search" data-action="menu">
						<Icon icon="ph:magnifying-glass" />
						Search <kbd>Ctrl K</kbd>
					</button>
					<div className="top-end">
						<button
							type="button"
							className="icon"
							data-action="mute"
							aria-label="Mute sounds"
							aria-pressed="false"
							title="Mute sounds (Alt M)"
						>
							<Icon icon="ph:speaker-high" className="when-sound" />
							<Icon icon="ph:speaker-slash" className="when-muted" />
						</button>
						<details className="settings">
							<summary className="icon" aria-label="Settings" title="Settings">
								<Icon icon="ph:gear" />
							</summary>
							<div className="settings-panel menu-list">
								<div className="menu-line">
									<span>Theme</span>
									<span className="theme-seg" role="group" aria-label="Theme">
										<button type="button" data-action="light" aria-label="Light" title="Light">
											<Icon icon="ph:sun" />
										</button>
										<button type="button" data-action="dark" aria-label="Dark" title="Dark">
											<Icon icon="ph:moon" />
										</button>
										<button type="button" data-action="system" aria-label="System" title="System">
											<Icon icon="ph:circle-half" />
										</button>
									</span>
								</div>
							</div>
						</details>
					</div>
				</header>

				{children}

				<Menu />
				<Scripts />
			</body>
		</html>
	);
}

/* the Ctrl/Cmd+K search, theme and mute, and the shell's own sounds. The DOM
   logic is the same as the Astro version's inline script, run once on the client */
function Menu() {
	const menuRef = useRef<HTMLDialogElement>(null);
	const router = useRouter();

	useEffect(() => {
		const root = document.documentElement;
		const menu = menuRef.current!;
		const input = menu.querySelector("input")!;
		const all = [...menu.querySelectorAll<HTMLElement>("[data-item]")];

		const filter = () => {
			const q = input.value.trim().toLowerCase();
			for (const el of all) el.hidden = !el.dataset.item!.includes(q);
		};
		const showMute = () => {
			const on = root.hasAttribute("data-muted");
			for (const b of document.querySelectorAll('.top [data-action="mute"]'))
				b.setAttribute("aria-pressed", String(on));
			for (const b of document.querySelectorAll(
				'[data-action="mute"] [data-label]',
			))
				b.textContent = on ? "Unmute sounds" : "Mute sounds";
		};
		const actions: Record<string, () => void> = {
			theme() {
				const dark = root.dataset.theme
					? root.dataset.theme === "dark"
					: matchMedia("(prefers-color-scheme: dark)").matches;
				root.dataset.theme = dark ? "light" : "dark";
				try {
					localStorage.setItem("theme", root.dataset.theme);
				} catch {}
			},
			/* the Theme switch in the Settings menu sets a side directly; "system" follows the OS */
			light() {
				root.dataset.theme = "light";
				try {
					localStorage.setItem("theme", "light");
				} catch {}
			},
			dark() {
				root.dataset.theme = "dark";
				try {
					localStorage.setItem("theme", "dark");
				} catch {}
			},
			system() {
				delete root.dataset.theme;
				try {
					localStorage.removeItem("theme");
				} catch {}
			},
			mute() {
				setMuted(!root.hasAttribute("data-muted"));
				showMute();
			},
			menu() {
				input.value = "";
				filter();
				menu.showModal();
				play("expand", { volume: 0.3 });
			},
		};

		/* clicks and knob changes on the shell tick; anything inside a block is left to the block */
		const inBlock = (el: Element) => !!el.closest(".card-block, .stage-block");
		const tick = (volume = 0.25) =>
			play("tick", { volume, pitch: 0.95 + Math.random() * 0.1 });
		const onClose = () => play("collapse", { volume: 0.25 });
		const onClick = (e: MouseEvent) => {
			const target = e.target as Element;
			for (const d of document.querySelectorAll<HTMLDetailsElement>("details.settings[open]"))
				if (!d.contains(target)) d.open = false;
			const link = target.closest<HTMLAnchorElement>("a[data-block]");
			if (link && !e.button && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
				e.preventDefault(); // new-tab clicks go through as plain links
				router.navigate({
					to: "/components/$slug",
					params: { slug: link.dataset.block! },
					resetScroll: false,
				});
			}
			const el = target.closest("button, a, summary, [data-item]");
			if (
				el &&
				!inBlock(el) &&
				!el.closest(".knob, [data-quiet]") &&
				!el.matches("summary") &&
				!el.matches("a[data-block]")
			)
				tick();
			actions[
				target.closest<HTMLElement>("[data-action]")?.dataset.action ?? ""
			]?.();
			/* a click on the backdrop lands on the dialog itself */
			if (menu.open && (target === menu || target.closest("[data-item]")))
				menu.close();
		};
		const onChange = (e: Event) => {
			const el = e.target as Element;
			if (el.closest(".panel .knob") && !inBlock(el)) tick();
		};
		let lastRange = 0;
		const onInput = (e: Event) => {
			const el = e.target as HTMLInputElement;
			if (
				el.type !== "range" ||
				!el.closest(".panel") ||
				performance.now() - lastRange < 40
			)
				return;
			lastRange = performance.now();
			tick(0.18);
		};
		const onToggle = (e: Event) => {
			const el = e.target as HTMLDetailsElement;
			if (el.matches?.("details.sec"))
				play(el.open ? "expand" : "collapse", { volume: 0.25 });
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape")
				for (const d of document.querySelectorAll<HTMLDetailsElement>("details.settings[open]")) d.open = false;
			const mod = e.metaKey || e.ctrlKey;
			if (mod && e.key.toLowerCase() === "k") {
				e.preventDefault();
				menu.open ? menu.close() : actions.menu();
			} else if (e.altKey && !mod && e.code === "KeyD") {
				e.preventDefault(); // by code: on a Mac, Option+D types ∂
				actions.theme();
			} else if (e.altKey && !mod && e.code === "KeyM") {
				e.preventDefault();
				actions.mute();
			} else if (!menu.open) {
				return;
			} else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				const stops = [input, ...all.filter((el) => !el.hidden)];
				const at = stops.indexOf(document.activeElement as HTMLElement);
				stops[
					(at + (e.key === "ArrowDown" ? 1 : -1) + stops.length) % stops.length
				].focus();
			} else if (e.key === "Enter" && document.activeElement === input) {
				all.find((el) => !el.hidden)?.click();
			} else if (
				e.key.length === 1 &&
				!mod &&
				document.activeElement !== input
			) {
				input.focus(); // typing from the list goes back to the search
			}
		};

		/* tab toggles (Block/Code, the Theme switch, the library tabs) get a pill that
		   slides to the chosen option: each toggle carries the chosen option's box as
		   --seg-x/y/w/h, and CSS draws and animates the pill from those */
		const chosen = (seg: Element) =>
			seg.classList.contains("theme-seg")
				? seg.querySelector(`[data-action="${root.dataset.theme ?? "system"}"]`)
				: seg.querySelector(':scope > [aria-pressed="true"], :scope > :has(:checked)');
		const syncSegs = () => {
			for (const seg of document.querySelectorAll<HTMLElement>(".seg, .theme-seg")) {
				const on = chosen(seg) as HTMLElement | null;
				if (!on || !on.offsetWidth) continue;
				seg.style.setProperty("--seg-x", `${on.offsetLeft}px`);
				seg.style.setProperty("--seg-y", `${on.offsetTop}px`);
				seg.style.setProperty("--seg-w", `${on.offsetWidth}px`);
				seg.style.setProperty("--seg-h", `${on.offsetHeight}px`);
				/* the first placement is instant; moves after that slide */
				if (!seg.dataset.slide) {
					seg.dataset.slide = "set";
					requestAnimationFrame(() => requestAnimationFrame(() => (seg.dataset.slide = "live")));
				}
			}
		};
		const soon = () => {
			requestAnimationFrame(syncSegs);
			setTimeout(syncSegs, 60); // after a route change has rendered
		};
		const segWatch = new MutationObserver(soon);
		segWatch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
		const modal = document.querySelector("dialog.modal");
		if (modal) segWatch.observe(modal, { childList: true });
		document.addEventListener("click", soon);
		document.addEventListener("change", soon);
		document.addEventListener("toggle", soon, true);
		window.addEventListener("resize", soon);
		soon();

		showMute();
		menu.addEventListener("close", onClose);
		input.addEventListener("input", filter);
		document.addEventListener("click", onClick);
		document.addEventListener("change", onChange);
		document.addEventListener("input", onInput);
		document.addEventListener("toggle", onToggle, true);
		document.addEventListener("keydown", onKey);
		/* show the shortcut the way this keyboard writes it */
		if (/Mac|iPhone|iPad/.test(navigator.platform)) {
			for (const k of document.querySelectorAll("kbd"))
				k.textContent = k
					.textContent!.replace("Ctrl ", "⌘")
					.replace("Alt ", "⌥");
		}
		return () => {
			menu.removeEventListener("close", onClose);
			input.removeEventListener("input", filter);
			document.removeEventListener("click", onClick);
			document.removeEventListener("change", onChange);
			document.removeEventListener("input", onInput);
			document.removeEventListener("toggle", onToggle, true);
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("click", soon);
			document.removeEventListener("change", soon);
			document.removeEventListener("toggle", soon, true);
			window.removeEventListener("resize", soon);
			segWatch.disconnect();
		};
	}, [router]);

	return (
		<dialog id="menu" ref={menuRef} aria-label="Search and commands">
			<input
				type="text"
				placeholder="Search components and commands"
				autoComplete="off"
				spellCheck={false}
			/>
			<div className="menu-list">
				{Object.entries(blocks).map(([slug, m]) => (
					<a
						key={slug}
						href={`/components/${slug}`}
						data-block={slug}
						data-item={`${m.name} ${m.tag} ${m.description}`.toLowerCase()}
					>
						{m.name} <small>{m.tag}</small>
					</a>
				))}
				<a
					href="/sounds"
					data-item="sounds sound library audio download"
					onClick={(e) => {
						e.preventDefault();
						router.navigate({ to: "/sounds" });
					}}
				>
					Sound library <small>Page</small>
				</a>
				<button
					type="button"
					data-action="theme"
					data-item="switch theme light dark mode"
				>
					Switch theme <kbd>Alt D</kbd>
				</button>
				<button
					type="button"
					data-action="mute"
					data-item="mute sounds unmute audio volume"
				>
					<span data-label>Mute sounds</span> <kbd>Alt M</kbd>
				</button>
			</div>
		</dialog>
	);
}
