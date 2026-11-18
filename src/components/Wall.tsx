import { useEffect, useRef, useState } from "react";
import { blocks } from "../lab";
import { runDemo } from "../lab/demo";
import Block from "./Block";

const list = Object.entries(blocks);
const tags = [...new Set(list.map(([, m]) => m.tag))].sort();

/* the wall: every component on a card. Clicking a card's empty space or its
   settings button opens the modal (the link is handled by the root route) */
export default function Wall() {
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
			<section className="hero">
				<h1>labs</h1>
				<p>
					Interactive components you can play with right here. Open one to tune
					its settings and take the code.
				</p>
			</section>

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

			<main className="wall" ref={wall}>
				{list.map(([slug, m]) => (
					<article
						key={slug}
						className="card"
						data-tag={m.tag}
						data-shortcut-scope
						hidden={!!tag && m.tag !== tag}
					>
						<a className="card-open" href={`/${slug}`} data-block={slug}>
							<span className="card-name">{m.name}</span>
						</a>
						<div className="card-block">
							<Block slug={slug} />
						</div>
						<span className="cursor" aria-hidden="true">
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M5 3.2v15.6l4.2-3.9 2.7 6.1 2.8-1.2-2.7-6H18L5 3.2Z" />
							</svg>
						</span>
						<div className="card-tools">
							{m.demo && (
								<button
									type="button"
									className="icon"
									data-play={slug}
									aria-label={`Play a demo of ${m.name}`}
								>
									<svg
										viewBox="0 0 24 24"
										className="when-idle"
										aria-hidden="true"
									>
										<path
											d="M8 5.5v13l11-6.5-11-6.5Z"
											fill="currentColor"
											stroke="none"
										/>
									</svg>
									<svg
										viewBox="0 0 24 24"
										className="when-playing"
										aria-hidden="true"
									>
										<rect
											x="7"
											y="7"
											width="10"
											height="10"
											rx="1.5"
											fill="currentColor"
											stroke="none"
										/>
									</svg>
								</button>
							)}
							{/* biome-ignore lint/a11y/useAnchorContent: labelled by aria-label; the icon is decorative */}
							<a
								className="icon"
								href={`/${slug}`}
								data-block={slug}
								aria-label={`Open ${m.name} settings`}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M4 8h9m4 0h3M4 16h3m4 0h9" />
									<circle cx="15" cy="8" r="2" />
									<circle cx="9" cy="16" r="2" />
								</svg>
							</a>
						</div>
					</article>
				))}
			</main>
		</>
	);
}
