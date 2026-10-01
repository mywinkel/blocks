import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { packageManifestSchema } from "../packages/sdk/src/manifest";
describe("independent system package contracts", () => {
  it("preserves every block identity, configuration default and appearance part", async () => {
    const folders = (await readdir("packages")).filter(
      (name) => name !== "sdk",
    );
    expect(folders).toHaveLength(23);
    for (const name of folders) {
      const { definition } = await import(
        resolve("packages", name, "definition.ts")
      );
      const manifest = packageManifestSchema.parse(
        JSON.parse(
          await readFile(
            resolve("packages", name, "block-package.json"),
            "utf8",
          ),
        ),
      );
      expect(manifest.name).toBe("@mywinkel/block-" + name);
      expect(manifest.blocks[0].id).toBe(name);
      expect(definition.schema.safeParse({}).success).toBe(true);
      expect(manifest.blocks[0].parts).toEqual(definition.parts);
      for (const file of ["View.svelte", "Settings.svelte", "Render.astro"])
        expect(
          await readFile(resolve("packages", name, file), "utf8"),
        ).not.toContain("src/lib/");
    }
  });
});

it("validates the standalone SDK example before releasing its catalogue entry", async () => {
  const manifest = JSON.parse(
    await readFile(resolve("examples/notes/block-package.json"), "utf8"),
  );
  expect(packageManifestSchema.parse(manifest).name).toBe("@example/notes");
});
