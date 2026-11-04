I want to create a new component. Here's what I need: $ARGUMENTS

**Determine directory** by domain:
- `components/report/` — Report display
- `components/questionnaire/` — Questionnaire flow
- `components/features/` — Feature modules
- `components/layout/` — Layout/navigation
- `components/profile-panels/` — Profile panels
- `components/ui/` — Generic base components only

**Component template:**
```tsx
'use client'  // Only if needs hooks/state/events

import { type Dictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface ComponentNameProps {
  dict: Dictionary
}

export function ComponentName({ dict }: ComponentNameProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Mobile-first responsive */}
    </div>
  )
}
```

**Mandatory checks after creation:**
1. All user-facing text uses `dict.section.key` (no hardcoded strings)
2. Mobile responsive (375px baseline)
3. Uses shadcn/ui components where possible
4. Uses Framer Motion for animations
5. TypeScript: no `any` types
6. File: kebab-case; Export: PascalCase
