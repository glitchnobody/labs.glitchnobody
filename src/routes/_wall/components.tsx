import { createFileRoute } from "@tanstack/react-router";

/* /components: every component on the wall (rendered by the layout) */
export const Route = createFileRoute("/_wall/components")({
	head: () => ({
		meta: [
			{ title: "Components | glitchnobody labs" },
			{ name: "description", content: "Every interactive component on glitchnobody labs, to play with, tune and copy." },
		],
	}),
	component: () => null,
});
