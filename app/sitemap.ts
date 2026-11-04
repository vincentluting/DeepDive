import type { MetadataRoute } from "next"
import { DEFAULT_APP_URL } from '@/lib/utils'

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
  const lastModified = new Date()

  const locales = ["en", "zh"]

  const publicPages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/quickdive", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/register", priority: 0.6, changeFrequency: "monthly" as const },
  ]

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of publicPages) {
      entries.push({
        url: `${appUrl}/${locale}${page.path}`,
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  return entries
}
