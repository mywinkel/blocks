import { getContext, setContext } from "svelte";
import {
  appearanceLayers,
  resolvePart,
  type Appearance,
  type AppearanceInput,
} from "./appearance";

const key = Symbol.for("mywinkel.block.appearance");
/** A getter preserves reactive instance edits and avoids cross-request global state. */
export function createClasses(
  getAppearance?: () => AppearanceInput | undefined,
) {
  const parent = getContext<() => readonly Appearance[]>(key);
  const layers = () => [
    ...(parent?.() ?? []),
    ...appearanceLayers(getAppearance?.()),
  ];
  setContext(key, layers);
  return (name: string, base: string) => resolvePart(base, name, layers());
}
