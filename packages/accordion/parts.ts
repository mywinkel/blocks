export const namedPartDefaults = {
  "accordion.root": "min-w-0",
  "accordion.heading": "mb-6 text-3xl font-medium text-balance",
  "accordion.list": "divide-y divide-border border-y border-border",
  "accordion.item": "group min-w-0",
  "accordion.trigger":
    "flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden",
  "accordion.indicator":
    "shrink-0 text-xl group-open:rotate-45 motion-reduce:transform-none",
  "accordion.body":
    "max-w-prose pb-6 leading-relaxed whitespace-pre-line text-muted-foreground",
  "accordion.image": "mb-4 h-auto max-w-full",
  "accordion.link": "mt-4 inline-block underline underline-offset-4",
  "accordion.empty": "text-sm text-muted-foreground",
} as const;
