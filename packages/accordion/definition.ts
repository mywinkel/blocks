import { z } from "zod";
import { defineBlock } from "@mywinkel/block-sdk/contract";
import { common, cardFields } from "@mywinkel/block-sdk/fields";
import { namedPartDefaults } from "./parts";

export const definition = defineBlock({
  id: "accordion",
  label: "Accordion",
  description: "Expandable answers and practical information.",
  schema: z
    .object({
      ...common,
      cards: cardFields.cards,
      allowMultiple: z.boolean().default(true),
      openFirst: z.boolean().default(false),
    })
    .strict(),
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    {
      key: "allowMultiple",
      label: "Allow several answers open",
      type: "checkbox",
    },
    { key: "openFirst", label: "Open the first answer", type: "checkbox" },
  ],
  parts: { ...namedPartDefaults },
  interactive: true,
  children: false,
});
