import {
  mkdtemp,
  cp,
  readFile,
  writeFile,
  mkdir,
  rm,
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { buildPackages, buildExample } from "./build";
import { packageManifestSchema } from "../packages/sdk/src/manifest";
const root = resolve(import.meta.dirname, ".."),
  version = JSON.parse(
    await readFile(resolve(root, "packages/sdk/package.json"), "utf8"),
  ).version,
  tag = "v" + version,
  base = "https://github.com/mywinkel/blocks/releases/download/" + tag;
await buildPackages();
await buildExample();
await mkdir(resolve(root, "release"), { recursive: true });
const packages = [];
for (const directory of [
  ...(await readdir(resolve(root, "packages"))).sort(),
  "example-notes",
]) {
  const source =
      directory === "example-notes"
        ? resolve(root, "examples/notes")
        : resolve(root, "packages", directory),
    temporary = await mkdtemp(join(tmpdir(), "mywinkel-block-")),
    stage = join(temporary, "package");
  try {
    await cp(source, stage, {
      recursive: true,
      filter: (path) =>
        !path
          .split("/")
          .some((part) => part === "node_modules" || part === ".git") &&
        !/\.(?:test|spec)\.ts$/.test(path),
    });
    await cp(resolve(root, "LICENSE"), join(stage, "LICENSE"));
    const pkg = JSON.parse(await readFile(join(stage, "package.json"), "utf8"));
    const metadata =
      directory === "sdk"
        ? undefined
        : packageManifestSchema.parse(
            JSON.parse(
              await readFile(join(stage, "block-package.json"), "utf8"),
            ),
          );
    if (
      pkg.version !== version ||
      (metadata &&
        (metadata.name !== pkg.name || metadata.version !== pkg.version))
    )
      throw Error("release_package_identity_mismatch");
    for (const entry of Object.values(metadata?.entries ?? {}))
      await readFile(join(stage, entry));
    delete pkg.peerDependenciesMeta;
    for (const name of Object.keys(pkg.peerDependencies ?? {}))
      if (name.startsWith("@mywinkel/")) {
        pkg.dependencies ??= {};
        pkg.dependencies[name] =
          base +
          "/" +
          (name === "@mywinkel/block-sdk" ? "block-sdk" : name.split("/")[1]) +
          "-" +
          version +
          ".tgz";
        delete pkg.peerDependencies[name];
      }
    await writeFile(
      join(stage, "package.json"),
      JSON.stringify(pkg, null, 2) + "\n",
    );
    const asset =
        (directory === "sdk"
          ? "block-sdk"
          : directory === "example-notes"
            ? "example-notes"
            : "block-" + directory) +
        "-" +
        version +
        ".tgz",
      output = resolve(root, "release", asset);
    const child = Bun.spawn(
      [
        "tar",
        "--format=ustar",
        "--no-xattrs",
        "-czf",
        output,
        "-C",
        temporary,
        "package",
      ],
      {
        stdout: "ignore",
        stderr: "inherit",
        env: { PATH: process.env.PATH, COPYFILE_DISABLE: "1" },
      },
    );
    if (await child.exited) throw Error("package_archive_failed");
    const bytes = await readFile(output);
    packages.push({
      name: pkg.name,
      version,
      url: base + "/" + asset,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length,
      blocks:
        directory === "sdk"
          ? []
          : JSON.parse(
              await readFile(join(stage, "block-package.json"), "utf8"),
            ).blocks.map((b: { id: string }) => b.id),
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
await writeFile(
  resolve(root, "release/block-catalogue.json"),
  JSON.stringify({ format: 1, version, packages }, null, 2) + "\n",
);
console.log(`Packed ${packages.length} independent packages for ${tag}`);
