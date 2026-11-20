import { Icon } from "@iconify/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { blocks, type Meta } from "../lab";
import { runDemo } from "../lab/demo";
import Block from "./Block";

const list = Object.entries(blocks);
const tags = [...new Set(list.map(([, m]) => m.tag))].sort();

/* the wall: every component on a card. Clicking a card's empty space or its
   settings button opens the modal (the link is handled by the root route) */
export default function Wall({
	items = list,
	title = "components",
	intro = "Interactive components you can play with right here. Open one to tune its settings and take the code.",
	bare = false,
}: {
	items?: [string, Meta][];
	title?: string;
	intro?: ReactNode;
	/* just the cards: no title and no filter chips (the home page's section) */
	bare?: boolean;
} = {}) {
	const [tag, setTag] = useState("");
	const wall = useRef<HTMLElement>(null);

	/* the play buttons: one demo at a time, a second press stops it */
	useEffect(() => {
		const running = new Map<HTMLElement, () => void>();
		const onClick = (e: MouseEvent) => {
			const button = (e.target as Element).closest<HTMLElement>("[data-play]");
			if (!button) return;
			const card = button.closest<HTMLElement>(".card")!;
			if (running.has(card)) return running.get(card)!();
			for (const stop of running.values()) stop();
			const end = () => {
				running.delete(card);
				delete card.dataset.playing;
			};
			card.dataset.playing = "";
			running.set(
				card,
				runDemo(
					card.querySelector<HTMLElement>(".card-block")!,
					card,
					blocks[button.dataset.play!].demo!,
					end,
				),
			);
		};
		const el = wall.current!;
		el.addEventListener("click", onClick);
		return () => {
			el.removeEventListener("click", onClick);
			for (const stop of running.values()) stop();
		};
	}, []);

	return (
		<>
			{!bare && (
				<section className="hero">
					<h1>{title}</h1>
					<p>{intro}</p>
				</section>
			)}

			{!bare && (
				<>
			{/* biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own border and legend styling */}
			<div
				className="chips"
				role="group"
				aria-label="Show components by interaction"
			>
				{["", ...tags].map((t) => (
					<button
						key={t || "all"}
						type="button"
						className="chip"
						aria-pressed={tag === t}
						onClick={() => setTag(t)}
					>
						{t || "All"}
					</button>
				))}
			</div>

				</>
			)}

			<main className="wall" ref={wall}>
				{items.map(([slug, m]) => (
					<article
						key={slug}
						className="card"
						data-tag={m.tag}
						data-shortcut-scope
						hidden={!!tag && m.tag !== tag}
					>
						<a className="card-open" href={`/components/${slug}`} data-block={slug}>
							<span className="card-name">{m.name}</span>
						</a>
						<div className="card-block">
							<Block slug={slug} />
						</div>
						<span className="cursor" aria-hidden="true">
							<Icon icon="ph:cursor-fill" />
						</span>
						<div className="card-tools">
							{m.demo && (
								<button
									type="button"
									className="icon"
									data-play={slug}
									aria-label={`Play a demo of ${m.name}`}
								>
									<Icon icon="ph:play-fill" className="when-idle" />
									<Icon icon="ph:stop-fill" className="when-playing" />
								</button>
							)}
							{/* biome-ignore lint/a11y/useAnchorContent: labelled by aria-label; the icon is decorative */}
							<a
								className="icon"
								href={`/components/${slug}`}
								data-block={slug}
								aria-label={`Open ${m.name} settings`}
							>
								<Icon icon="ph:sliders-horizontal" />
							</a>
						</div>
					</article>
				))}
			</main>
		</>
	);
}
