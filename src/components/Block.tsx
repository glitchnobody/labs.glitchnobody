import { lazy, Suspense, type ComponentType } from "react";
import { blocks } from "../lab";
import { play } from "../lab/sound";

const loaded: Record<string, ComponentType<any>> = {};

/* one live component from the lab, by slug. On the site it also gets the
   sound player and its siteProps (photos), which never reach the copied code */
export default function Block({ slug, props }: { slug: string; props?: Record<string, unknown> }) {
  /* cached in the browser so a re-render never remounts the block; never on the
     server, where a cached lazy() would keep rendering a component's first version */
  const make = () => lazy(() => blocks[slug].load().then((c) => ({ default: c })));
  const Component = typeof window === "undefined" ? make() : (loaded[slug] ??= make());
  return (
    <Suspense fallback={null}>
      <Component onSound={play} {...blocks[slug].siteProps} {...props} />
    </Suspense>
  );
}
