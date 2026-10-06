import { z } from "zod";
import { defineBlock } from "@mywinkel/block-sdk/contract";
import { common, url, id } from "@mywinkel/block-sdk/fields";
import { namedPartDefaults } from "./parts";
export const definition = defineBlock({
  id: "hero",
  label: "Hero",
  description:
    "An editorial opening with optional photography and two actions.",
  schema: z
    .object({
      ...common,
      eyebrow: z.string().max(200).default(""),
      text: z.string().max(5000).default(""),
      src: url.default(""),
      mediaId: id.optional(),
      alt: z.string().max(500).default(""),
      caption: z.string().max(500).default(""),
      primaryLabel: z.string().max(100).default(""),
      primaryHref: url.default(""),
      secondaryLabel: z.string().max(100).default(""),
      secondaryHref: url.default(""),
      layout: z.enum(["split", "wide", "stack"]).default("split"),
      mediaSide: z.enum(["left", "right"]).default("right"),
    })
    .strict(),
  fields: [
    ...[
      "heading",
      "eyebrow",
      "text",
      "alt",
      "caption",
      "primaryLabel",
      "secondaryLabel",
    ].map((key) => ({
      key,
      label:
        (
          {
            primaryLabel: "Primary action",
            secondaryLabel: "Secondary action",
          } as Record<string, string>
        )[key] ?? key,
      type: key === "text" ? ("textarea" as const) : ("text" as const),
    })),
    ...["src", "primaryHref", "secondaryHref"].map((key) => ({
      key,
      label: key,
      type: "url" as const,
    })),
    {
      key: "layout",
      label: "Layout",
      type: "select",
      options: ["split", "wide", "stack"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "mediaSide",
      label: "Photograph side",
      type: "select",
      options: ["left", "right"].map((value) => ({ value, label: value })),
    },
  ],
  parts: namedPartDefaults,
  interactive: false,
  children: false,
});
