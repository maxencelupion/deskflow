import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function isValidEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }
