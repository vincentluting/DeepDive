---
title: Product Principles
category: product
sources: []
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Product Principles

## Core Philosophy

Deep Dive is an AI career exploration platform, not a career recommendation engine. The distinction is fundamental:

- **Career directions** = "most worth exploring" directions, NOT "best fit careers"
- **Reports** illuminate possibilities, not prescribe outcomes
- **Coaching** guides self-discovery, not dispensing advice

## Personalized Analysis, Not Personalized Filtering

This is the fundamental distinction between Deep Dive and every other career tool:

- **Personalized filtering** (what others do): Match your profile → sort careers by score → hide low-scoring ones. Subtractive. Creates information silos. The user sees fewer options and never knows what was hidden.
- **Personalized analysis** (what we do): Take every career direction → analyze it through the user's unique psychological lens → generate insight that didn't exist in either the career data or the assessment alone. Generative. Expands possibilities.

We never hide career directions from users. All directions remain visible — only the analysis perspective changes based on who you are. A direction that "doesn't match" might be the most illuminating one to explore.

This principle applies across the product:

| Layer              | Filtering approach (we reject)      | Analysis approach (we do)                                                         |
| ------------------ | ----------------------------------- | --------------------------------------------------------------------------------- |
| **Report**         | "Here are your top 5 careers"       | "Here's how your pattern illuminates every direction — and why some surprise you" |
| **Coaching**       | Steer toward matching directions    | Help users understand why any direction interests or drains them                  |
| **Profile**        | Show strengths, hide contradictions | Present the full portrait, including tensions that drive growth                   |
| **Career Library** | Sort by match %, truncate list      | Show all directions, personalize the analysis angle per user                      |

> **Academic framing** (for thesis): Filtering is subtractive curation — it narrows a possibility space. Analysis is generative synthesis — it creates new understanding from the intersection of user data and career data. Most career tools optimize for match precision. Deep Dive optimizes for self-understanding breadth.

## Content Principles

### No Theory Framework Names in User-Facing Content

Reports NEVER expose raw framework names to users:

- No "RIASEC", "Big Five", "Schwartz" labels
- Use branded concepts and natural language instead
- Example: "Your exploration style" instead of "Your RIASEC profile"

### Cross-Cultural Confidence Cap

Hard ceiling of **55%** on any cross-cultural confidence score. Cultural context is too complex for higher claims.

### Original Content Priority

Original creative copy is preferred over LLM-generated content for archetype descriptions, career narratives, and shadow content. LLM generates personalized narratives; static content is human-authored.

### Resume Conflicts = Tension Insights

When a resume contradicts assessment results, frame it as productive tension, not an error. Never override assessment scores with resume data.

## Typography

- **Headings**: Fraunces (CSS variable `--font-display`)
- **Body**: DM Sans (CSS variable `--font-body`)

## Design Fixed Rule

When a design-spec HTML file is referenced, copy ALL CSS exactly as-is. Never simplify or substitute visual effects with Tailwind utilities.

## Language Rules

- **English site**: Zero Chinese characters in UI
- **Chinese site**: Zero English in UI (except proper nouns)
- All user-visible text goes through i18n dictionary, never hardcoded
- LLM output language = site locale. Every prompt must include explicit language instruction (e.g., `"Respond entirely in English"`)
