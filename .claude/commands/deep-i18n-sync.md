---
disable-model-invocation: true
---

Perform a deep internationalization audit — beyond key matching, check content quality.

## Key Completeness
1. Run `npm run lint:i18n` — report missing keys.

## Hardcoded String Scan
2. Scan all `.tsx` files in `components/` and `app/[locale]/`:
   - JSX text not wrapped in `{t(...)}` or `{dict.xxx}`
   - `placeholder` attribute text
   - `alt` attribute text
   - `aria-label` text
   - `title` attribute text
   Exclude: className, import paths, console.log, comments, purely technical strings.

## Translation Quality
3. Compare en/zh dictionary value lengths. If an English value has 50+ chars but Chinese equivalent has <10 chars (or vice versa), flag as "possibly incomplete translation".
4. Check Chinese dictionary for English remnants (entire value is English).
5. Check English dictionary for Chinese remnants.

## Output
List all issues with file locations.
For missing i18n keys, auto-generate suggested en/zh translations.
For hardcoded strings, provide the i18n key name suggestion and both translations.
