import { createFileRoute } from "@tanstack/react-router";

/* /sounds: the whole sound library (rendered by the layout) */
export const Route = createFileRoute("/_wall/sounds")({
	head: () => ({
		meta: [
			{ title: "Sounds | glitchnobody labs" },
			{ name: "description", content: "Every sound used on glitchnobody labs, to play and download." },
		],
	}),
	component: () => null,
});
