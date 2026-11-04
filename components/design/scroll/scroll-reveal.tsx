"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";

/**
 * ScrollReveal — Apple-style scroll-into-view reveal (v2 Surface System).
 *
 * Wraps a block so it fades + rises as it enters the viewport. Built on
 * Framer Motion's `whileInView`. Under prefers-reduced-motion it renders the
 * plain element with no animation (fully visible), so content is never gated
 * behind motion.
 *
 * Polymorphic via `as` (keeps DOM structure intact — e.g. `as="section"`
 * renders a real `<section>` instead of an extra wrapper div).
 */
const MOTION = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
} as const;

type RevealTag = keyof typeof MOTION;

export interface ScrollRevealProps {
  children: ReactNode;
  as?: RevealTag;
  /** Delay in seconds before the element animates in. */
  delay?: number;
  /** Vertical travel distance in px (default 28). */
  y?: number;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  /** Re-trigger every time it enters the viewport (default false = once). */
  repeat?: boolean;
}

export function ScrollReveal({
  children,
  as = "div",
  delay = 0,
  y = 28,
  className,
  repeat = false,
  ...rest
}: ScrollRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Tag = as as ElementType;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  // All motion.* components share the same prop surface; cast to one concrete
  // type so the union of tags type-checks against our props.
  const MotionTag = MOTION[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1], // mirrors --ease-out-expo
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
