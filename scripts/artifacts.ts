import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

/** Independent checkouts keep a local fallback; sibling workspaces share one purgeable root. */
export function artifactRootFor(root: string, override?: string): string {
  const parent = resolve(root, "..");
  const siblings = [
    "AGENTS.md",
    "cms/package.json",
    "devdocs/package.json",
  ].every((file) => existsSync(resolve(parent, file)));
  return override
    ? resolve(root, override)
    : resolve(siblings ? parent : root, ".tmp");
}

export const artifactsRoot = artifactRootFor(
  repositoryRoot,
  process.env.MYWINKEL_TMP_ROOT,
);

/** Reports, scratch files and rebuildable caches only; persistent state stays with its owner. */
export function artifactPath(...parts: string[]): string {
  const base = resolve(artifactsRoot, basename(repositoryRoot));
  const path = resolve(base, ...parts);
  const offset = relative(base, path);
  if (isAbsolute(offset) || offset.split(sep).includes(".."))
    throw new Error(
      "Artifact paths must stay inside this repository's temporary directory.",
    );
  return path;
}

export function temporaryDirectory(prefix: string): string {
  if (!prefix || /[/\\]/.test(prefix))
    throw new Error("Use a plain temporary directory prefix.");
  const directory = artifactPath("scratch");
  mkdirSync(directory, { recursive: true });
  return mkdtempSync(resolve(directory, prefix));
}
