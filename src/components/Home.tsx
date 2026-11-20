import { Link } from "@tanstack/react-router";
import { latestComponents, latestSounds } from "./library";
import Sounds from "./Sounds";
import Wall from "./Wall";

const components = latestComponents(6);
const sounds = latestSounds(6);

/* the home page: the six newest components and the six newest sounds, each with a way to all of them */
export default function Home() {
	return (
		<>
			<section className="hero">
				<h1>labs</h1>
				<p>Interactive components you can play with right here. Open one to tune its settings and take the code.</p>
			</section>

			<section className="home-sec" aria-labelledby="home-components">
				<header className="home-head">
					<h2 id="home-components">Components</h2>
					<Link className="pill" to="/components">
						View all
					</Link>
				</header>
				<Wall items={components} bare />
			</section>

			<section className="home-sec" aria-labelledby="home-sounds">
				<header className="home-head">
					<h2 id="home-sounds">Sounds</h2>
					<Link className="pill" to="/sounds">
						View all
					</Link>
				</header>
				<Sounds sounds={sounds} back="/" />
			</section>
		</>
	);
}
