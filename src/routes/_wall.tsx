import { createFileRoute, Outlet } from "@tanstack/react-router";
import Modal from "../components/Modal";
import Wall from "../components/Wall";

/* a pathless layout: the wall stays mounted under / and /$slug, so opening and
   closing a component never re-renders the 60 cards behind the modal */
export const Route = createFileRoute("/_wall")({
	component: () => (
		<>
			<Wall />
			<Modal />
			<Outlet />
		</>
	),
});
