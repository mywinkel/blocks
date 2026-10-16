export const namedPartDefaults = {
  "accordion.root": "min-w-0",
  "accordion.heading": "mb-6 text-3xl font-medium text-balance",
  "accordion.list": "divide-y divide-border border-y border-border",
  "accordion.item": "group min-w-0",
  "accordion.trigger":
    "flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden",
  // Keep the rotating glyph inside a stationary box at the edge of a page.
  "accordion.indicator":
    "inline-flex size-8 shrink-0 items-center justify-center overflow-clip text-xl",
  "accordion.body":
    "max-w-prose pb-6 leading-relaxed whitespace-pre-line text-muted-foreground",
  "accordion.image": "mb-4 h-auto max-w-full",
  "accordion.link": "mt-4 inline-block underline underline-offset-4",
  "accordion.empty": "text-sm text-muted-foreground",
} as const;
