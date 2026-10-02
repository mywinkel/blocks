import { z } from "zod";
import { defineBlock } from "@mywinkel/block-sdk/contract";
import { namedPartDefaults } from "./parts";

export const definition = defineBlock({
  id: "example/starter-card",
  label: "Starter card",
  description: "A small editable card for learning the block package format.",
  schema: z
    .object({
      heading: z.string().max(100).default("Hello from a block"),
      body: z
        .string()
        .max(500)
        .default("Change these values in the block settings."),
    })
    .strict(),
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Body", type: "textarea" },
  ],
  parts: { ...namedPartDefaults },
  interactive: false,
});
