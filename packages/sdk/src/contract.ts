import type { z } from "zod";
import type { Component, Snippet } from "svelte";
import type { AppearanceInput } from "./appearance";
import type {
  WebsiteRenderData,
  Block,
  SiteEntry,
  RegisteredBlock,
} from "@mywinkel/block-sdk/public/website/contracts";

export type EditorField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select" | "url";
  options?: readonly { value: string; label: string }[];
  min?: number;
  max?: number;
};
export type BlockDefinition<S extends z.ZodObject = z.ZodObject> = {
  id: string;
  label: string;
  description: string;
  schema: S;
  fields: readonly EditorField[];
  parts: Record<string, string>;
  interactive: boolean;
  children?: boolean;
};
export function defineBlock<
  const Id extends string,
  const S extends z.ZodObject,
>(definition: BlockDefinition<S> & { id: Id }) {
  return {
    ...definition,
    parts: {
      "block.root":
        "min-w-0 wrap-anywhere data-[cms-block]:relative data-[cms-block]:outline-offset-8 data-[cms-block]:hover:outline data-[cms-block]:hover:outline-dashed data-[cms-block]:hover:outline-ring data-[cms-selected]:outline-2 data-[cms-selected]:outline-ring",
      "block.heading": "mb-6 text-3xl font-medium",
      ...definition.parts,
    },
  };
}
export type BlockViewProps = {
  block: Block;
  data: WebsiteRenderData;
  editable?: boolean;
  appearance?: AppearanceInput;
  children?: Snippet;
};
export type SelectedMedia = { id: string; url: string; alt: string };
export type MediaPickerProps = {
  url?: string;
  onselect: (media: SelectedMedia) => void;
};
export type BlockEditorHost = {
  entries: SiteEntry[];
  components?: RegisteredBlock[];
  MediaPicker: Component<MediaPickerProps>;
};
export type BlockEditorProps = {
  block: Block;
  host: BlockEditorHost;
  onchange: () => void;
};
