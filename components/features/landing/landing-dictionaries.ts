import { type Locale, isValidLocale } from "@/lib/i18n/config";

import dePreview from "@/lib/i18n/dictionaries/de/preview.json";
import enPreview from "@/lib/i18n/dictionaries/en/preview.json";
import esPreview from "@/lib/i18n/dictionaries/es/preview.json";
import frPreview from "@/lib/i18n/dictionaries/fr/preview.json";
import itPreview from "@/lib/i18n/dictionaries/it/preview.json";
import jaPreview from "@/lib/i18n/dictionaries/ja/preview.json";
import koPreview from "@/lib/i18n/dictionaries/ko/preview.json";
import nlPreview from "@/lib/i18n/dictionaries/nl/preview.json";
import ptPreview from "@/lib/i18n/dictionaries/pt/preview.json";
import ruPreview from "@/lib/i18n/dictionaries/ru/preview.json";
import zhPreview from "@/lib/i18n/dictionaries/zh/preview.json";

export type PreviewDictionary = typeof enPreview;

export const PREVIEW_DICTS: Record<Locale, PreviewDictionary> = {
  en: enPreview,
  zh: zhPreview,
  nl: nlPreview,
  de: dePreview,
  fr: frPreview,
  es: esPreview,
  pt: ptPreview,
  it: itPreview,
  ru: ruPreview,
  ja: jaPreview,
  ko: koPreview,
};

export const FALLBACK_PREVIEW_DICT: PreviewDictionary = enPreview;

export function getLocaleFromParams(raw: unknown): Locale {
  return typeof raw === "string" && isValidLocale(raw) ? raw : "en";
}
