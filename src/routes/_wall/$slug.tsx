import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { blocks } from "../../lab";

/* old links: /<slug> now lives at /components/<slug> */
export const Route = createFileRoute("/_wall/$slug")({
	beforeLoad: ({ params }) => {
		if (!(params.slug in blocks)) throw notFound();
		throw redirect({ to: "/components/$slug", params: { slug: params.slug }, statusCode: 301 });
	},
});
