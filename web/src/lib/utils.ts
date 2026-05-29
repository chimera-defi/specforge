import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export utilities from subdirectories
export * from "./utils/debounce";
export * from "./utils/toast";
export * from "./utils/validation";
