import { z } from "zod";
import { twMerge } from "tailwind-merge";

export const partOverrideSchema = z
  .object({
    mode: z.enum(["merge", "replace"]).default("merge"),
    classes: z.string().max(4000),
  })
  .strict();
export const appearanceSchema = z
  .object({
    parts: z
      .record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9.-]*$/), partOverrideSchema)
      .default({}),
  })
  .strict();
export type Appearance = z.infer<typeof appearanceSchema>;
export type AppearanceInput = Appearance | readonly Appearance[];
export const appearanceLayers = (
  value?: AppearanceInput,
): readonly Appearance[] =>
  value ? (Array.isArray(value) ? value : [value as Appearance]) : [];

/** Apply each layer in order: replacement deliberately discards earlier layers. */
export function resolvePart(
  base: string,
  name: string,
  layers: readonly Appearance[],
): string {
  return layers.reduce((classes, layer) => {
    const override = layer.parts[name];
    return !override
      ? classes
      : override.mode === "replace"
        ? twMerge(override.classes)
        : twMerge(classes, override.classes);
  }, base);
}

export type SiteBlockDefaults = Record<
  string,
  {
    props?: Record<string, unknown> | undefined;
    appearance?: Appearance | undefined;
  }
>;
