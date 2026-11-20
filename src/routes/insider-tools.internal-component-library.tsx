import { Icon } from "@iconify/react";
import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import siteCss from "../site.css?raw";
import "../library.css";

/* ── tokens: the shell's own light and dark palette (--s-*), read from site.css ── */
type Tokens = Record<string, string>;
const parse = (re: RegExp): Tokens =>
	Object.fromEntries(
		[...(siteCss.match(re)?.[1] ?? "").matchAll(/(--s-[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
	);
const DEFAULTS: Record<Mode, Tokens> = {
	light: parse(/\[data-theme="light"\]\s*\{([^}]*)\}/),
	dark: parse(/^\[data-theme="dark"\]\s*\{([^}]*)\}/m),
};
type Mode = "light" | "dark";

const GROUPS: [string, (k: string) => boolean][] = [
	["Canvas and surfaces", (k) => /^--s-(bg|card|surface|surface-hover|outline-hover|elevated)$/.test(k)],
	["Ink", (k) => /^--s-ink(-[23])?$/.test(k)],
	["Borders", (k) => /^--s-border(-strong)?$/.test(k)],
	["Solid button", (k) => /^--s-cta(-hover|-ink)?$/.test(k)],
	["Shadows", (k) => /^--s-shadow-/.test(k)],
];
const groupOf = (k: string) => GROUPS.find(([, f]) => f(k))?.[0] ?? "Other";

/* ── components ── */
type P = Record<string, string | number | boolean>;
type Field = {
	key: string;
	label: string;
	type: "text" | "toggle" | "select" | "range";
	options?: string[];
	min?: number;
	max?: number;
};
type Def = {
	id: string;
	name: string;
	note: string;
	fields: Field[];
	defaults: P;
	render: (p: P, s: CSSProperties) => ReactNode;
};

const ICONS: Record<string, ReactNode> = {
	play: <Icon icon="ph:play-fill" />,
	settings: <Icon icon="ph:gear" />,
	theme: <Icon icon="ph:circle-half" />,
};
const noop = () => {};
const t = (key: string, label: string): Field => ({ key, label, type: "text" });
const COMMON: Field[] = [
	{
		key: "radius",
		label: "Corner override (px)",
		type: "range",
		min: 0,
		max: 40,
	},
	{
		key: "size",
		label: "Font size override (px)",
		type: "range",
		min: 0,
		max: 32,
	},
];
const common: P = { radius: 0, size: 0 };
const sx = (p: P, s: CSSProperties): CSSProperties => ({
	...s,
	...(p.radius ? { borderRadius: +p.radius } : {}),
	...(p.size ? { fontSize: +p.size } : {}),
});

const DEFS: Def[] = [
	{
		id: "brand",
		name: "Brand",
		note: "header, links home",
		fields: [t("name", "Name"), t("sub", "Suffix"), ...COMMON],
		defaults: { name: "glitchnobody", sub: "labs", ...common },
		render: (p, s) => (
			<span className="brand" style={sx(p, { ...s, margin: 0 })}>
				{p.name} <span>{p.sub}</span>
			</span>
		),
	},
	{
		id: "pill",
		name: "Pill",
		note: ".pill, .solid, .outline",
		fields: [
			t("label", "Label"),
			t("kbd", "Key hint"),
			{
				key: "variant",
				label: "Variant",
				type: "select",
				options: ["default", "solid", "outline"],
			},
			...COMMON,
		],
		defaults: { label: "Search", kbd: "Ctrl K", variant: "default", ...common },
		render: (p, s) => (
			<button
				type="button"
				className={`pill ${p.variant === "default" ? "" : p.variant}`}
				style={sx(p, s)}
			>
				{p.label} {p.kbd ? <kbd suppressHydrationWarning>{p.kbd}</kbd> : null}
			</button>
		),
	},
	{
		id: "icon",
		name: "Icon button",
		note: ".icon",
		fields: [
			{
				key: "icon",
				label: "Icon",
				type: "select",
				options: Object.keys(ICONS),
			},
			...COMMON,
		],
		defaults: { icon: "play", ...common },
		render: (p, s) => (
			<span className="icon" style={sx(p, s)}>
				{ICONS[p.icon as string]}
			</span>
		),
	},
	{
		id: "chip",
		name: "Chip",
		note: ".chip, aria-pressed",
		fields: [
			t("label", "Label"),
			{ key: "pressed", label: "Pressed", type: "toggle" },
			...COMMON,
		],
		defaults: { label: "Hover", pressed: true, ...common },
		render: (p, s) => (
			<button type="button" className="chip" aria-pressed={!!p.pressed} style={sx(p, s)}>{p.label}</button>
		),
	},
	{
		id: "card",
		name: "Wall card",
		note: ".card, name pill and tools",
		fields: [
			t("name", "Name"),
			{ key: "tools", label: "Show tools", type: "toggle" },
			...COMMON,
		],
		defaults: { name: "Component name", tools: true, ...common },
		render: (p, s) => (
			<article className="card" style={sx(p, s)}>
				<span className="card-open">
					<span className="card-name">{p.name}</span>
				</span>
				{p.tools && (
					<div className="card-tools">
						<button type="button" className="icon">{ICONS.play}</button>
						<button type="button" className="icon">{ICONS.settings}</button>
					</div>
				)}
			</article>
		),
	},
	{
		id: "seg",
		name: "Segmented control",
		note: ".seg",
		fields: [
			t("options", "Options (comma separated)"),
			{
				key: "active",
				label: "Active (1 = first)",
				type: "range",
				min: 1,
				max: 6,
			},
			...COMMON,
		],
		defaults: { options: "Off, On", active: 1, ...common },
		render: (p, s) => (
			<div className="seg" style={sx(p, s)}>
				{String(p.options)
					.split(",")
					.map((o, i) => (
						<label key={`${o}${i}`}>
							<input
								type="radio"
								readOnly
								checked={i + 1 === p.active}
								onChange={noop}
							/>
							{o.trim()}
						</label>
					))}
			</div>
		),
	},
	{
		id: "range",
		name: "Range knob",
		note: ".knob.range",
		fields: [
			t("label", "Label"),
			{ key: "value", label: "Value", type: "range", min: 0, max: 100 },
			...COMMON,
		],
		defaults: { label: "Size (px)", value: 40, ...common },
		render: (p, s) => (
			<div
				className="knob range"
				style={sx(p, { ...s, width: 280, ["--p" as string]: `${p.value}%` })}
			>
				<span>{p.label}</span>
				<output>{p.value}</output>
				<input type="range" value={+p.value} readOnly onChange={noop} />
			</div>
		),
	},
	{
		id: "text",
		name: "Text knob",
		note: ".knob.text",
		fields: [t("label", "Label"), t("value", "Value"), ...COMMON],
		defaults: { label: "Label", value: "Hello", ...common },
		render: (p, s) => (
			<div className="knob text" style={sx(p, { ...s, width: 280 })}>
				<span>{p.label}</span>
				<input type="text" value={String(p.value)} readOnly onChange={noop} />
			</div>
		),
	},
	{
		id: "switch",
		name: "Switch",
		note: ".pill.toggle + .switch",
		fields: [
			t("label", "Label"),
			{ key: "on", label: "On", type: "toggle" },
			...COMMON,
		],
		defaults: { label: "Sound", on: true, ...common },
		render: (p, s) => (
			<span className="pill toggle" style={sx(p, s)}>
				<input
					type="checkbox"
					className="switch"
					checked={!!p.on}
					readOnly
					onChange={noop}
				/>
				{p.label}
			</span>
		),
	},
	{
		id: "menu",
		name: "Menu row",
		note: ".menu-list [data-item]",
		fields: [t("label", "Label"), t("hint", "Hint"), ...COMMON],
		defaults: { label: "Magnetic button", hint: "Hover", ...common },
		render: (p, s) => (
			<div
				className="menu-list"
				style={{
					width: 300,
					background: "var(--raised)",
					borderRadius: "var(--r-control)",
				}}
			>
				<span data-item="x" style={sx(p, s)}>
					{p.label} <small>{p.hint}</small>
				</span>
			</div>
		),
	},
];

const diff = <T extends Record<string, unknown>>(cur: T, def: T) =>
	Object.fromEntries(Object.entries(cur).filter(([k, v]) => v !== def[k]));

function FieldRow({
	f,
	v,
	set,
}: {
	f: Field;
	v: string | number | boolean;
	set: (v: string | number | boolean) => void;
}) {
	return (
		<label className="lib-field">
			<span>{f.label}</span>
			{f.type === "text" && (
				<input
					type="text"
					value={String(v)}
					onChange={(e) => set(e.target.value)}
				/>
			)}
			{f.type === "toggle" && (
				<input
					type="checkbox"
					className="switch"
					checked={!!v}
					onChange={(e) => set(e.target.checked)}
				/>
			)}
			{f.type === "select" && (
				<select value={String(v)} onChange={(e) => set(e.target.value)}>
					{f.options?.map((o) => (
						<option key={o}>{o}</option>
					))}
				</select>
			)}
			{f.type === "range" && (
				<input
					type="range"
					min={f.min}
					max={f.max}
					value={+v}
					onChange={(e) => set(+e.target.value)}
				/>
			)}
		</label>
	);
}

function Library() {
	const [tab, setTab] = useState<"component" | "colors">("component");
	const [mode, setMode] = useState<Mode>("dark");
	const [sel, setSel] = useState(DEFS[1].id);
	const [props, setProps] = useState<Record<string, P>>(() =>
		Object.fromEntries(DEFS.map((d) => [d.id, d.defaults])),
	);
	const [colors, setColors] = useState<Record<Mode, Tokens>>(DEFAULTS);
	const [json, setJson] = useState(false);
	const [copied, setCopied] = useState(false);

	const def = DEFS.find((d) => d.id === sel)!;
	const out = useMemo(
		() =>
			JSON.stringify(
				{
					colors: {
						light: diff(colors.light, DEFAULTS.light),
						dark: diff(colors.dark, DEFAULTS.dark),
					},
					components: Object.fromEntries(
						DEFS.map((d) => [d.id, diff(props[d.id], d.defaults)]).filter(
							([, v]) => Object.keys(v as object).length,
						),
					),
				},
				null,
				2,
			),
		[colors, props],
	);
	const setProp = (k: string, v: string | number | boolean) =>
		setProps((s) => ({ ...s, [sel]: { ...s[sel], [k]: v } }));
	const setColor = (k: string, v: string) =>
		setColors((s) => ({ ...s, [mode]: { ...s[mode], [k]: v } }));
	const reset = () => {
		if (tab === "colors") setColors((s) => ({ ...s, [mode]: DEFAULTS[mode] }));
		else setProps((s) => ({ ...s, [sel]: def.defaults }));
	};
	const names = [...new Set(Object.keys(DEFAULTS[mode]).map(groupOf))].sort(
		(a, b) =>
			[...GROUPS.map((g) => g[0]), "Other"].indexOf(a) -
			[...GROUPS.map((g) => g[0]), "Other"].indexOf(b),
	);

	return (
		<div className="lib">
			<aside className="lib-panel">
				<div className="lib-head">
					<div className="seg" role="radiogroup" aria-label="Panel">
						<label>
							<input
								type="radio"
								name="tab"
								checked={tab === "component"}
								onChange={() => setTab("component")}
							/>
							Component
						</label>
						<label>
							<input
								type="radio"
								name="tab"
								checked={tab === "colors"}
								onChange={() => setTab("colors")}
							/>
							Colors
						</label>
					</div>
					<div className="seg" role="radiogroup" aria-label="Mode">
						<label>
							<input
								type="radio"
								name="mode"
								checked={mode === "light"}
								onChange={() => setMode("light")}
							/>
							Light
						</label>
						<label>
							<input
								type="radio"
								name="mode"
								checked={mode === "dark"}
								onChange={() => setMode("dark")}
							/>
							Dark
						</label>
					</div>
				</div>
				<div className="lib-body">
					{tab === "component" ? (
						<>
							<h3>{def.name}</h3>
							<p className="lib-hint">
								{def.note}. Pick another component on the canvas.
							</p>
							{def.fields.map((f) => (
								<FieldRow
									key={f.key}
									f={f}
									v={props[sel][f.key]}
									set={(v) => setProp(f.key, v)}
								/>
							))}
						</>
					) : (
						<>
							<p className="lib-hint">
								Editing the {mode} palette. Any CSS colour works. A dot marks a
								changed value.
							</p>
							{names.map((g) => (
								<div key={g} style={{ display: "contents" }}>
									<h3>{g}</h3>
									{Object.keys(DEFAULTS[mode])
										.filter((k) => groupOf(k) === g)
										.map((k) => {
											const v = colors[mode][k];
											const hex = /^#[0-9a-f]{6}$/i.test(v);
											const isColor = /^(#|rgb)/.test(v);
											return (
												<label
													key={k}
													className="lib-field lib-color-row"
													data-changed={
														v !== DEFAULTS[mode][k] ? "" : undefined
													}
												>
													<span title={k}>{k.slice(2)}</span>
													<div
														className="lib-color"
														style={
															isColor
																? undefined
																: { gridTemplateColumns: "1fr" }
														}
													>
														{hex ? (
															<input
																type="color"
																value={v}
																onChange={(e) => setColor(k, e.target.value)}
															/>
														) : isColor ? (
															<i style={{ background: v }} />
														) : null}
														<input
															type="text"
															value={v}
															onChange={(e) => setColor(k, e.target.value)}
															spellCheck={false}
														/>
													</div>
												</label>
											);
										})}
								</div>
							))}
						</>
					)}
				</div>
				<div className="lib-foot">
					<button type="button" className="pill outline" onClick={reset}>
						Reset
					</button>
					<button
						type="button"
						className="pill solid"
						onClick={() => setJson(true)}
					>
						Export JSON
					</button>
				</div>
			</aside>

			<main
				className="lib-canvas"
				data-theme={mode}
				style={colors[mode] as CSSProperties}
			>
				<div className="lib-grid">
					{DEFS.map((d) => (
						<div key={d.id} role="button" tabIndex={0} className="lib-tile"
							aria-pressed={sel === d.id}
							onClick={() => {
								setSel(d.id);
								setTab("component");
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setSel(d.id);
									setTab("component");
								}
							}}
						>
							<div className="lib-tile-body">{d.render(props[d.id], {})}</div>
							<small>{d.name}</small>
						</div>
					))}
				</div>
				{json && (
					<div className="lib-json" role="dialog" aria-label="Exported JSON">
						<pre>{out}</pre>
						<div>
							<button
								type="button"
								className="pill outline"
								onClick={() => setJson(false)}
							>
								Close
							</button>
							<button
								type="button"
								className="pill solid"
								onClick={() => {
									navigator.clipboard?.writeText(out);
									setCopied(true);
									setTimeout(() => setCopied(false), 1200);
								}}
							>
								{copied ? "Copied" : "Copy JSON"}
							</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export const Route = createFileRoute(
	"/insider-tools/internal-component-library",
)({
	head: () => ({
		meta: [
			{ title: "Internal component library | glitchnobody labs" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: Library,
});
