import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Default public URL when NEXT_PUBLIC_APP_URL env var is not set.
 * Single source of truth — used in sitemap, robots, OG tags, share cards.
 */
export const DEFAULT_APP_URL = 'https://deepdive.app';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
