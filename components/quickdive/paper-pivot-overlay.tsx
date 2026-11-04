"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PaperPivotOverlayProps {
  onComplete: () => void;
}

export function PaperPivotOverlay({ onComplete }: PaperPivotOverlayProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);

    const duration = prefersReduced ? 200 : 800;
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      data-testid="paper-pivot"
      aria-hidden="true"
      className="fixed inset-0 z-[70] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.18 : 0.38, ease: "easeOut" }}
      style={{ background: "var(--rev-paper)" }}
    >
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/textures/paper-noise.svg)",
            backgroundSize: "320px 320px",
            backgroundRepeat: "repeat",
            mixBlendMode: "multiply",
          }}
          initial={{ opacity: 0, clipPath: "circle(22% at 50% 50%)" }}
          animate={{ opacity: 0.42, clipPath: "circle(110% at 50% 50%)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </motion.div>
  );
}
