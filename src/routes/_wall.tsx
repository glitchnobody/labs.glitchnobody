import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useRef } from "react";
import Home from "../components/Home";
import { allSounds } from "../components/library";
import Modal from "../components/Modal";
import Sounds from "../components/Sounds";
import Wall from "../components/Wall";

type Page = "/" | "/components" | "/sounds";
const pageOf = (path: string): Page => (path === "/" ? "/" : path.startsWith("/sounds") ? "/sounds" : "/components");

/* a pathless layout for every page. The page behind a window stays mounted while a
   component (/components/<slug>) or a sound (/sounds/<name>) is open: home, the wall or
   the sound library, whichever you came from, so opening and closing never re-renders the
   cards behind it, and closing returns to that page */
export const Route = createFileRoute("/_wall")({
	component: Layout,
});

function Layout() {
	const path = useLocation({ select: (l) => l.pathname });
	const behind = useRef<Page>(pageOf(path));
	if (path === "/" || path === "/components" || path === "/sounds") behind.current = path;
	const page = behind.current;
	return (
		<>
			{page === "/" ? <Home /> : page === "/sounds" ? <SoundsPage /> : <Wall />}
			<Modal back={page === "/sounds" ? "/components" : page} />
			<Outlet />
		</>
	);
}

function SoundsPage() {
	return (
		<>
			<section className="hero">
				<h1>sounds</h1>
				<p>Every sound the components use. Press an orb to hear it, open it to see it in a component and download it.</p>
			</section>
			<Sounds sounds={allSounds} back="/sounds" />
		</>
	);
}
