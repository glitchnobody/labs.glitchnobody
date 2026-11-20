import table from "../../COMPONENTS.md?raw";
import { blocks, type Meta } from "../lab";
import type { SoundInfo } from "./Sounds";

/* every sound in the library table of COMPONENTS.md, in the table's order (oldest first);
   the example is the component the table says first used it, when it still does */
const inOrder: SoundInfo[] = [
	...table.matchAll(/^\| `([\w-]+)` \| ([^|]+) \|[^|]*\|[^|]*\| ([\w-]+) \|/gm),
].map(([, name, what, first]) => {
	const users = Object.entries(blocks)
		.filter(([, m]) => m.sounds?.includes(name))
		.map(([slug, m]) => ({ slug, name: m.name }))
		.sort((a, b) => (a.slug === first ? -1 : b.slug === first ? 1 : 0));
	return { name, what: what.trim(), users };
});

export const allSounds = [...inOrder].sort((a, b) => a.name.localeCompare(b.name));

/* the newest are the last rows of the table */
export const latestSounds = (n: number) => inOrder.slice(-n).reverse();

/* components by their number in COMPONENTS.md, newest first */
export const latestComponents = (n: number): [string, Meta][] =>
	[...table.matchAll(/^\| (\d+) \| `([\w-]+)` \|/gm)]
		.map(([, num, slug]) => [Number(num), slug] as const)
		.sort((a, b) => b[0] - a[0])
		.filter(([, slug]) => slug in blocks)
		.slice(0, n)
		.map(([, slug]) => [slug, blocks[slug]]);
