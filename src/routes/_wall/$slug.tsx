import { createFileRoute, notFound } from "@tanstack/react-router";
import { blocks } from "../../lab";

/* /<slug> is the wall with that component open in the modal (rendered by the layout) */
export const Route = createFileRoute("/_wall/$slug")({
	beforeLoad: ({ params }) => {
		if (!(params.slug in blocks)) throw notFound();
	},
	head: ({ params }) => {
		const m = blocks[params.slug];
		return m
			? {
					meta: [
						{ title: `${m.name} | glitchnobody labs` },
						{ name: "description", content: m.description },
					],
				}
			: {};
	},
	component: () => null,
});
