import { createFileRoute } from "@tanstack/react-router";
import { codeToHtml } from "shiki";
import { blocks } from "../../../lab";

/* what the code view of one component needs: its files highlighted, and the
   "how it works" notes from the header comment */
const sources = import.meta.glob<string>("../../../lab/*/*.{tsx,css}", {
	query: "?raw",
	import: "default",
	eager: true,
});
const cache = new Map<string, unknown>();

/* "/* ══ Name ═══ … ── A HEADING ─── … *\/" becomes [{ title, text }] */
function notes(source: string) {
	const comment = source.match(/\/\* ══[^\n]*\n([\s\S]*?)\*\//)?.[1] ?? "";
	return comment
		.split(/\n\s*\n/)
		.map((part) => {
			const lines = part
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean);
			const heading = lines[0]?.match(/^── (.+?) ─+$/)?.[1];
			if (heading) lines.shift();
			return {
				title: heading ? heading[0] + heading.slice(1).toLowerCase() : "",
				text: lines.join(" "),
			};
		})
		.filter((note) => note.text);
}

async function build(slug: string) {
	const mine = Object.entries(sources)
		/* .site.css holds wall-only hit-area rules, not part of the component */
		.filter(
			([path]) =>
				path.startsWith(`../../../lab/${slug}/`) && !path.endsWith(".site.css"),
		)
		.map(([path, code]) => ({ name: path.split("/").pop()!, code }))
		.sort(
			(a, b) =>
				Number(a.name.endsWith(".css")) - Number(b.name.endsWith(".css")),
		);
	const files = await Promise.all(
		mine.map(async ({ name, code }) => ({
			name,
			html: await codeToHtml(code, {
				lang: name.endsWith(".css") ? "css" : "tsx",
				themes: { light: "github-light", dark: "github-dark" },
			}),
		})),
	);
	return {
		files,
		how: notes(mine.find((f) => f.name.endsWith(".tsx"))?.code ?? ""),
	};
}

export const Route = createFileRoute("/api/code/$slug")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				if (!(params.slug in blocks))
					return new Response("Not found", { status: 404 });
				if (!cache.has(params.slug))
					cache.set(params.slug, await build(params.slug));
				return Response.json(cache.get(params.slug), {
					headers: { "Cache-Control": "public, max-age=3600" },
				});
			},
		},
	},
});
