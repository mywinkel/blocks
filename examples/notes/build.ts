import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build as bundle } from "esbuild";
import { packageManifestSchema } from "@mywinkel/block-sdk/manifest";

const root = fileURLToPath(new URL(".", import.meta.url));

export async function build() {
  const packagePath = resolve(root, "package.json"),
    manifestPath = resolve(root, "block-package.json"),
    pkg = JSON.parse(await readFile(packagePath, "utf8")),
    source = JSON.parse(await readFile(manifestPath, "utf8"));
  source.version = pkg.version;
  const manifest = packageManifestSchema.parse(source);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  await mkdir(resolve(root, "dist"), { recursive: true });
  await bundle({
    entryPoints: [resolve(root, "server.ts")],
    outfile: resolve(root, "dist/server.js"),
    bundle: true,
    platform: "browser",
    target: "es2022",
    format: "esm",
    minify: true,
  });
  await writeFile(
    resolve(root, "dist/settings.js"),
    await readFile(resolve(root, "settings.js")),
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await build();
