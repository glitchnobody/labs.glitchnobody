import { createFileRoute } from "@tanstack/react-router";
import table from "../../COMPONENTS.md?raw";
import Sounds, { type SoundInfo } from "../components/Sounds";
import { blocks } from "../lab";

/* every sound in the library table of COMPONENTS.md (one per file in public/sounds);
   the example is the component the table says first used it, when it still does */
const sounds: SoundInfo[] = [
	...table.matchAll(/^\| `([\w-]+)` \| ([^|]+) \|[^|]*\|[^|]*\| ([\w-]+) \|/gm),
]
	.map(([, name, what, first]) => {
		const users = Object.entries(blocks)
			.filter(([, m]) => m.sounds?.includes(name))
			.map(([slug, m]) => ({ slug, name: m.name }))
			.sort((a, b) => (a.slug === first ? -1 : b.slug === first ? 1 : 0));
		return { name, what: what.trim(), users };
	})
	.sort((a, b) => a.name.localeCompare(b.name));

export const Route = createFileRoute("/sounds")({
	head: () => ({
		meta: [
			{ title: "Sounds | glitchnobody labs" },
			{
				name: "description",
				content: "Every sound used on glitchnobody labs, to play and download.",
			},
		],
	}),
	component: () => (
		<>
			<section className="hero">
				<h1>sounds</h1>
				<p>
					Every sound the components use. Press an orb to hear it, open it to
					see it in a component and download it.
				</p>
			</section>
			<Sounds sounds={sounds} />
		</>
	),
});
