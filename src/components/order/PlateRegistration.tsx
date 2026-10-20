"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type PlateRegistrationProps = {
  lineOne: string;
  lineTwo: string;
  borderCount?: number;
  hasFlag?: boolean;
  hasLogo?: boolean;
  hasSlogan?: boolean;
  horizontalScale?: number;
  maxFontSizeCqw?: number;
  singleLine?: boolean;
};

export function PlateRegistration({ borderCount = 0, lineOne, lineTwo, hasFlag = false, hasLogo = false, hasSlogan = false, horizontalScale = 1, maxFontSizeCqw = 27.58, singleLine = false }: PlateRegistrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [fontSizeCqw, setFontSizeCqw] = useState(maxFontSizeCqw);
  const stateClasses = [
    hasFlag ? "plate-registration-has-flag" : "",
    hasLogo ? "plate-registration-has-logo" : "",
    hasSlogan ? "plate-registration-has-slogan" : "",
    singleLine ? "plate-registration-single" : "",
    borderCount > 0 ? `plate-registration-border-${Math.min(borderCount, 2)}` : "",
  ].filter(Boolean).join(" ");

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let frame = 0;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let nextSize = maxFontSizeCqw;

        lineRefs.current.forEach((line, index) => {
          const measuredText = measureRefs.current[index];
          if (!line || !measuredText || !measuredText.textContent) return;
          const measuredTextWidth = measuredText.getBoundingClientRect().width * horizontalScale;
          const availableWidth = Math.max(0, line.clientWidth - Math.max(4, line.clientWidth * 0.04));
          if (!measuredTextWidth || !availableWidth) return;
          nextSize = Math.min(nextSize, maxFontSizeCqw * (availableWidth / measuredTextWidth));
        });

        const fittedSize = Number(Math.min(maxFontSizeCqw, nextSize).toFixed(2));
        setFontSizeCqw((currentSize) => Math.abs(currentSize - fittedSize) > 0.05 ? fittedSize : currentSize);
      });
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    document.fonts?.load("400 100px UKNumberPlate", `${lineOne} ${lineTwo}`).then(() => { if (active) measure(); }).catch(() => undefined);
    document.fonts?.ready.then(() => { if (active) measure(); }).catch(() => undefined);
    measure();

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [borderCount, hasFlag, hasLogo, hasSlogan, horizontalScale, lineOne, lineTwo, maxFontSizeCqw, singleLine]);

  return (
    <div aria-hidden="true" className={`plate-registration ${stateClasses}`} ref={containerRef} style={{ "--plate-registration-scale": horizontalScale, "--plate-registration-size": `${fontSizeCqw}cqw` } as CSSProperties}>
      <span className="plate-registration-line plate-registration-line-first" ref={(element) => { lineRefs.current[0] = element; }}><span className="plate-registration-text">{lineOne}</span></span>
      {singleLine ? null : <span className="plate-registration-line plate-registration-line-second" ref={(element) => { lineRefs.current[1] = element; }}><span className="plate-registration-text">{lineTwo}</span></span>}
      <span className="plate-registration-measure" style={{ "--plate-registration-measure-size": `${maxFontSizeCqw}cqw` } as CSSProperties}>
        <span ref={(element) => { measureRefs.current[0] = element; }}>{lineOne}</span>
        {singleLine ? null : <span ref={(element) => { measureRefs.current[1] = element; }}>{lineTwo}</span>}
      </span>
    </div>
  );
}
