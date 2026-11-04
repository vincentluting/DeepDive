// UI infrastructure — Phase 0 | L3/L4 only
import * as React from 'react'

import { cn } from '@/lib/utils'

interface AnimatedGradientTextProps {
  as?: React.ElementType
  shimmer?: boolean
  className?: string
  children?: React.ReactNode
}

function AnimatedGradientText({
  as: Comp = 'span',
  shimmer = false,
  className,
  children,
}: AnimatedGradientTextProps) {
  return (
    <Comp
      className={cn(
        'bg-clip-text [-webkit-text-fill-color:transparent] text-transparent',
        'bg-[linear-gradient(90deg,var(--grad-from),var(--grad-via),var(--grad-to))]',
        shimmer && [
          'bg-[length:200%_100%]',
          'motion-safe:animate-[gradientSweep_6s_ease-in-out_infinite]',
        ],
        className,
      )}
    >
      {children}
    </Comp>
  )
}

export { AnimatedGradientText }
export type { AnimatedGradientTextProps }
