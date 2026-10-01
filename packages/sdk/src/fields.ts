import { z } from "zod";
export const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
export const url = z
  .string()
  .max(2000)
  .refine(
    (value) =>
      !value ||
      /^\/(?!\/)/.test(value) ||
      /^https:\/\//.test(value) ||
      /^(?:mailto:|tel:|#)/.test(value),
    "Use a website path or HTTPS URL.",
  );
export const common = { heading: z.string().max(500).default("") };
export const cardSchema = z
  .object({
    id,
    title: z.string().max(500),
    text: z.string().max(5000).default(""),
    image: url.default(""),
    mediaId: id.optional(),
    alt: z.string().max(500).default(""),
    href: url.default(""),
  })
  .strict();
export const cardFields = {
  cards: z.array(cardSchema).max(100).default([]),
  columns: z.number().int().min(1).max(4).default(3),
  layout: z.enum(["grid", "list"]).default("grid"),
  showImages: z.boolean().default(true),
  showDescriptions: z.boolean().default(true),
};
export const sourceFields = {
  ...cardFields,
  source: z
    .enum([
      "products",
      "services",
      "menus",
      "classes",
      "rental-offer",
      "membership-offer",
    ])
    .default("products"),
  href: url.default(""),
  search: z.string().max(200).default(""),
  sort: z.enum(["name", "name-desc", "price", "price-desc"]).default("name"),
  limit: z.number().int().min(1).max(100).default(12),
  contentTypeId: z.string().max(100).default(""),
  contentId: id.optional(),
  fields: z
    .object({
      title: z.string().max(100).default("name"),
      text: z.string().max(100).default("description"),
      image: z.string().max(100).default("image"),
      href: z.string().max(100).default("url"),
    })
    .strict()
    .default({
      title: "name",
      text: "description",
      image: "image",
      href: "url",
    }),
};
