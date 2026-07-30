import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function isValidEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

export function groupConsecutiveBy(items, keyFn) {
  const groups = []

  for (const item of items) {
    const key = keyFn(item)
    const last = groups[groups.length - 1]

    if (last && last.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, items: [item] })
    }
  }

  return groups
}

export const HOME_INPUT_CLASSNAME =
  "border-home-border bg-home-card text-home-ink placeholder:text-home-muted-3 focus-visible:border-home-ink focus-visible:ring-home-border"

export const HOME_DIALOG_CLASSNAME =
  "rounded-2xl border-none bg-home-bg text-home-ink ring-home-border"

export function chipClassName(active) {
  return cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-home-ink bg-home-ink text-home-bg"
      : "border-home-border bg-home-card text-home-ink hover:bg-home-border"
  )
}
