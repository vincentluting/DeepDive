// UI infrastructure — Phase 0 | L2/L3 only
import * as React from 'react'

import { Card } from './card'
import { cn } from '@/lib/utils'

interface GlowCardProps extends React.ComponentProps<typeof Card> {
  glowColor?: string
  intensity?: 'subtle' | 'medium'
}

function GlowCard({
  glowColor,
  intensity = 'subtle',
  className,
  style,
  ...props
}: GlowCardProps) {
  const isSubtle = intensity === 'subtle'

  const glowStyle: React.CSSProperties = glowColor
    ? { '--glow-color': glowColor } as React.CSSProperties
    : {}

  return (
    <Card
      className={cn(
        'transition-all duration-300',
        'motion-safe:hover:border-[var(--glow-color,transparent)]',
        isSubtle
          ? 'hover:shadow-[0_0_20px_var(--glow-color,rgba(8,112,174,0.1))] hover:border-[rgba(8,112,174,0.2)] dark:hover:shadow-[0_0_20px_var(--glow-color,rgba(66,198,255,0.1))] dark:hover:border-[rgba(66,198,255,0.2)]'
          : 'hover:shadow-[0_0_30px_var(--glow-color,rgba(8,112,174,0.15))] hover:border-[rgba(8,112,174,0.3)] dark:hover:shadow-[0_0_30px_var(--glow-color,rgba(66,198,255,0.15))] dark:hover:border-[rgba(66,198,255,0.3)]',
        'motion-reduce:transition-none',
        className,
      )}
      style={{ ...glowStyle, ...style }}
      {...props}
    />
  )
}

export { GlowCard }
export type { GlowCardProps }
