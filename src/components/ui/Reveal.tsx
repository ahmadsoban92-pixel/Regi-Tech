"use client";

import { m, useReducedMotion } from "motion/react";

const easeOut = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      transition={{ delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.48, ease: easeOut }}
      viewport={{ amount: 0.12, margin: "0px 0px -8% 0px", once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </m.div>
  );
}
