import { createFileRoute, notFound } from "@tanstack/react-router";
import { allSounds } from "../../components/library";

/* /sounds/<name> is one sound open in its window, over the page you came from */
export const Route = createFileRoute("/_wall/sounds/$name")({
	beforeLoad: ({ params }) => {
		if (!allSounds.some((s) => s.name === params.name)) throw notFound();
	},
	head: ({ params }) => {
		const s = allSounds.find((x) => x.name === params.name);
		return s ? { meta: [{ title: `${s.name} sound | glitchnobody labs` }, { name: "description", content: s.what }] } : {};
	},
	component: () => null,
});
