import { z } from "zod";
const relativePath = z
  .string()
  .max(200)
  .regex(/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*$/)
  .refine((v) => !v.split("/").some((p) => p === ".." || p === "."));
const identifier = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/);
export const packageManifestSchema = z
  .object({
    format: z.literal(1),
    name: z.string().regex(/^@[a-z0-9-]+\/[a-z0-9-]+$|^[a-z0-9-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/),
    sdkVersion: z.literal("0.1"),
    blocks: z
      .array(
        z
          .object({
            id: identifier,
            label: z.string().min(1).max(100),
            description: z.string().max(1000),
            configuration: z.record(z.string(), z.unknown()),
            fields: z
              .array(
                z.object({
                  key: z.string(),
                  label: z.string(),
                  type: z.enum([
                    "text",
                    "textarea",
                    "number",
                    "checkbox",
                    "select",
                    "url",
                  ]),
                  options: z
                    .array(z.object({ value: z.string(), label: z.string() }))
                    .optional(),
                  min: z.number().optional(),
                  max: z.number().optional(),
                }),
              )
              .max(100),
            parts: z.record(z.string(), z.string().max(4000)),
            interactive: z.boolean(),
            children: z.boolean().default(false),
            viewMode: z
              .enum([
                "block",
                "checkout",
                "customer-account",
                "request-status",
                "quote-acceptance",
                "menu",
                "enquiry",
                "form",
              ])
              .default("block"),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    backendAccess: z
      .enum(["public", "authenticated", "owner"])
      .default("owner"),
    entries: z
      .object({
        server: relativePath,
        browser: relativePath.optional(),
        settings: relativePath.optional(),
      })
      .strict(),
    migrations: z
      .array(
        z
          .object({
            id: z.string().regex(/^\d{4}_[a-z0-9_]+$/),
            checksum: z.string().regex(/^[a-f0-9]{64}$/),
            sql: z.string().max(50000),
            kind: z.enum(["compatible", "maintenance"]),
          })
          .strict(),
      )
      .max(1000),
  })
  .strict();
export type PackageManifest = z.infer<typeof packageManifestSchema>;
export type PackageSql = {
  sql: (
    queries: { sql: string; values?: (string | number | null)[] }[],
  ) => Promise<
    { rows: Record<string, unknown>[]; rowsRead: number; rowsWritten: number }[]
  >;
  namespace: string;
};
export type PackageContext = {
  tenantId: string;
  packageName: string;
  database: PackageSql;
  actor?: { id?: string; role: string; tenantId: string } | null;
};
export type PackageBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  appearance?: import("./appearance").Appearance;
  children?: PackageBlock[];
};
/** Publisher entrypoints are precompiled ESM; installers never execute package
 * metadata, lifecycle hooks or compiler plugins in the privileged CMS process. */
export type PackageServer = {
  render?: (
    input: { props: Record<string, unknown>; children?: string },
    host: PackageContext,
  ) => Promise<{ html: string; head?: string }>;
  handle?: (request: Request, host: PackageContext) => Promise<Response>;
};
