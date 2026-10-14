"use client";

import { m, useReducedMotion } from "motion/react";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function AnimatedMain({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <m.main
      animate={{ opacity: 1, y: 0 }}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: easeOut }}
    >
      {children}
    </m.main>
  );
}
