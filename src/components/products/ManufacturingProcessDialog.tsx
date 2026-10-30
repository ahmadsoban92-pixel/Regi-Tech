"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import processData from "@/content/manufacturing-process.json";
import type { ManufacturingProcessStory, Product } from "@/types/content";

const story = processData as ManufacturingProcessStory;
const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
const transitionEase = [0.22, 1, 0.36, 1] as const;

type ManufacturingProcessDialogProps = {
  product: Product | null;
  onClose: () => void;
};

export function ManufacturingProcessDialog({ product, onClose }: ManufacturingProcessDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wheelLockedRef = useRef(false);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  const step = story.steps[currentStep];
  const lastStep = story.steps.length - 1;

  const goToStep = useCallback((nextStep: number) => {
    const clampedStep = Math.max(0, Math.min(lastStep, nextStep));
    if (clampedStep === currentStep) return;
    setDirection(clampedStep > currentStep ? 1 : -1);
    setCurrentStep(clampedStep);
  }, [currentStep, lastStep]);

  useEffect(() => {
    if (!product) return;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCurrentStep(0);
    setDirection(1);

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goToStep(currentStep - 1);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goToStep(currentStep + 1);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, goToStep, onClose, product]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (window.matchMedia("(max-width: 767px)").matches || Math.abs(event.deltaY) < 24) return;
    event.preventDefault();
    if (wheelLockedRef.current) return;
    wheelLockedRef.current = true;
    goToStep(currentStep + (event.deltaY > 0 ? 1 : -1));
    wheelTimerRef.current = setTimeout(() => {
      wheelLockedRef.current = false;
    }, reduceMotion ? 150 : 650);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 52) return;
    const forwards = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX < 0 : deltaY < 0;
    goToStep(currentStep + (forwards ? 1 : -1));
  };

  const imageVariants = {
    enter: (travelDirection: number) => reduceMotion ? { opacity: 0 } : { opacity: 0.8, y: travelDirection > 0 ? "100%" : "-100%" },
    center: { opacity: 1, y: "0%" },
    exit: (travelDirection: number) => reduceMotion ? { opacity: 0 } : { opacity: 0.8, y: travelDirection > 0 ? "-100%" : "100%" },
  };
  const contentVariants = {
    enter: (travelDirection: number) => reduceMotion ? { opacity: 0 } : { opacity: 0.8, y: travelDirection > 0 ? "-100%" : "100%" },
    center: { opacity: 1, y: "0%" },
    exit: (travelDirection: number) => reduceMotion ? { opacity: 0 } : { opacity: 0.8, y: travelDirection > 0 ? "100%" : "-100%" },
  };
  const slideTransition = { duration: reduceMotion ? 0.12 : 0.58, ease: transitionEase };
  const imageOnRight = currentStep % 2 === 1;

  return (
    <AnimatePresence initial={false}>
      {product ? (
        <m.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-[var(--overlay)] p-3 sm:p-5"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
        >
          <m.section
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative grid h-[min(90vh,760px)] w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--background-deep)] shadow-2xl"
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
            onMouseDown={(event) => event.stopPropagation()}
            ref={dialogRef}
            role="dialog"
            transition={{ duration: reduceMotion ? 0.01 : 0.24, ease: transitionEase }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3 sm:px-6 sm:py-4">
              <div>
                <p className="eyebrow">{story.eyebrow}</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--foreground)] sm:text-xl" id={titleId}>{story.title}</h2>
                <p className="sr-only" id={descriptionId}>{story.description}</p>
              </div>
              <button aria-label={story.closeLabel} className="grid size-10 shrink-0 place-items-center rounded-md border border-[var(--line)] text-[var(--label)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]" onClick={onClose} ref={closeButtonRef} type="button">
                <X aria-hidden size={20} />
              </button>
            </header>

            <div aria-hidden className="pointer-events-none absolute size-px overflow-hidden opacity-0">
              {story.steps.map((preloadStep) => (
                <Image alt="" fill key={preloadStep.image} loading="eager" sizes="(max-width: 767px) 100vw, 50vw" src={preloadStep.image} />
              ))}
            </div>

            <div className="relative min-h-0 overflow-hidden" onTouchEnd={handleTouchEnd} onTouchStart={handleTouchStart} onWheel={handleWheel}>
              <AnimatePresence custom={direction} initial={false} mode="popLayout">
                <m.div className="absolute inset-0 grid min-h-0 grid-rows-[42%_58%] md:grid-cols-2 md:grid-rows-1" custom={direction} initial="enter" animate="center" exit="exit" key={currentStep}>
                  <m.div className={`relative min-h-0 overflow-hidden ${imageOnRight ? "order-1 md:order-2" : "order-1 md:order-1"}`} custom={direction} transition={slideTransition} variants={imageVariants}>
                    <Image alt={step.alt} className="object-cover" fill priority sizes="(max-width: 767px) 100vw, 50vw" src={step.image} />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  </m.div>
                  <m.div className={`flex min-h-0 items-center overflow-y-auto bg-[var(--surface)] p-6 sm:p-8 md:p-10 lg:p-12 ${imageOnRight ? "order-2 md:order-1" : "order-2 md:order-2"}`} custom={direction} transition={slideTransition} variants={contentVariants}>
                    <div className="mx-auto max-w-md">
                      <span className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Step {currentStep + 1} of {story.steps.length}</span>
                      <h3 className="mt-4 text-2xl font-bold leading-tight text-[var(--foreground)] sm:text-3xl">{step.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-[var(--label)] sm:text-base">{step.description}</p>
                      {currentStep === lastStep ? (
                        <Link className="primary-button mt-6 w-full sm:w-auto" href={`/design?product=${product.id}&new=1`} onClick={onClose}>{story.customiseLabel}</Link>
                      ) : null}
                    </div>
                  </m.div>
                </m.div>
              </AnimatePresence>
            </div>

            <footer className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-[var(--line)] px-4 py-3 sm:px-6 sm:py-4">
              <button aria-label={story.previousLabel} className="secondary-button size-11 !p-0 disabled:cursor-not-allowed disabled:opacity-35" disabled={currentStep === 0} onClick={() => goToStep(currentStep - 1)} type="button">
                <ChevronLeft aria-hidden size={20} />
              </button>
              <div aria-label={`Step ${currentStep + 1} of ${story.steps.length}`} className="flex items-center justify-center gap-2" role="group">
                {story.steps.map((item, index) => (
                  <button aria-label={`Go to step ${index + 1}: ${item.title}`} aria-pressed={index === currentStep} className={`h-2.5 rounded-full transition-all ${index === currentStep ? "w-8 bg-[var(--accent)]" : "w-2.5 bg-[var(--line-strong)] hover:bg-[var(--label)]"}`} key={item.title} onClick={() => goToStep(index)} type="button" />
                ))}
              </div>
              <button aria-label={story.nextLabel} className="primary-button size-11 !p-0 disabled:cursor-not-allowed disabled:opacity-35" disabled={currentStep === lastStep} onClick={() => goToStep(currentStep + 1)} type="button">
                <ChevronRight aria-hidden size={20} />
              </button>
            </footer>
          </m.section>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
