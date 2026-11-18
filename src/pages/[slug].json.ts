import type { APIRoute } from 'astro';
import { codeToHtml } from 'shiki';
import { blocks } from '../lab';

/* what the code view of one component needs, built once: its files
   highlighted, and the "how it works" notes from the header comment */
const sources = import.meta.glob<string>('../lab/*/*.{tsx,css}', { query: '?raw', import: 'default', eager: true });

export const getStaticPaths = () => Object.keys(blocks).map((slug) => ({ params: { slug } }));

/* "/* ══ Name ═══ … ── A HEADING ─── … *\/" becomes [{ title, text }] */
function notes(source: string) {
	const comment = source.match(/\/\* ══[^\n]*\n([\s\S]*?)\*\//)?.[1] ?? '';
	return comment
		.split(/\n\s*\n/)
		.map((part) => {
			const lines = part.split('\n').map((line) => line.trim()).filter(Boolean);
			const heading = lines[0]?.match(/^── (.+?) ─+$/)?.[1];
			if (heading) lines.shift();
			return {
				title: heading ? heading[0] + heading.slice(1).toLowerCase() : '',
				text: lines.join(' '),
			};
		})
		.filter((note) => note.text);
}

export const GET: APIRoute = async ({ params }) => {
	const mine = Object.entries(sources)
		/* .site.css holds wall-only hit-area rules, not part of the component */
		.filter(([path]) => path.startsWith(`../lab/${params.slug}/`) && !path.endsWith('.site.css'))
		.map(([path, code]) => ({ name: path.split('/').pop()!, code }))
		.sort((a, b) => Number(a.name.endsWith('.css')) - Number(b.name.endsWith('.css')));

	const files = await Promise.all(
		mine.map(async ({ name, code }) => ({
			name,
			html: await codeToHtml(code, {
				lang: name.endsWith('.css') ? 'css' : 'tsx',
				themes: { light: 'github-light', dark: 'github-dark' },
			}),
		})),
	);

	return new Response(JSON.stringify({ files, how: notes(mine.find((f) => f.name.endsWith('.tsx'))?.code ?? '') }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
