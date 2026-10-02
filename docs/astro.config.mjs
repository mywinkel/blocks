import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://mywinkel.github.io",
  base: "/blocks",
  integrations: [
    starlight({
      title: "My Winkel Blocks",
      description: "Build and package blocks for My Winkel.",
      disable404Route: true,
      sidebar: [
        {
          label: "Start here",
          items: [
            { label: "Overview", link: "/" },
            { label: "Getting started", slug: "getting-started" },
          ],
        },
        {
          label: "Author a block",
          items: [{ autogenerate: { directory: "authoring" } }],
        },
        { label: "Backend and data", slug: "backend" },
        { label: "Validate and publish", slug: "publishing" },
      ],
    }),
  ],
});
