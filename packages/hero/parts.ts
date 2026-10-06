export const namedPartDefaults = {
  "hero.root": "grid items-center gap-8 py-10 md:py-16",
  "hero.copy": "min-w-0",
  "hero.eyebrow": "mb-5 text-xs font-semibold uppercase tracking-[0.16em]",
  "hero.heading":
    "max-w-4xl text-5xl font-medium leading-[1.02] tracking-tight text-balance md:text-7xl",
  "hero.text": "mt-6 max-w-xl text-lg leading-relaxed",
  "hero.actions": "mt-8 flex flex-wrap items-center gap-4",
  "hero.primary":
    "inline-flex min-h-11 items-center bg-primary px-5 py-3 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4",
  "hero.secondary":
    "inline-flex min-h-11 items-center py-3 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4",
  "hero.figure": "min-w-0",
  "hero.image": "aspect-[4/3] w-full object-cover",
  "hero.caption": "mt-3 text-xs leading-relaxed text-muted-foreground",
} as const;
