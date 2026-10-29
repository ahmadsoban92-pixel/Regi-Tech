"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { fitRegistrationLayout, type InkMetrics, type LogoBounds } from "@/lib/registrationLayout";
import type { PlateGeometry } from "@/lib/plateGeometry";

type PlateRegistrationProps = {
  lineOne: string;
  lineTwo: string;
  geometry: PlateGeometry;
  frameInset: number;
  hasFlag: boolean;
  roadLegal: boolean;
  logoBounds?: LogoBounds;
  sloganRef: RefObject<HTMLDivElement | null>;
  sloganText: string;
  horizontalScale: number;
  maxFontSizeCqw: number;
  fallbackFontSizeCqw: number;
};

function getInkMetrics(context: CanvasRenderingContext2D, value: string): InkMetrics {
  const metrics = context.measureText(value || " ");
  return { width: metrics.width, ascent: metrics.actualBoundingBoxAscent || 70, descent: metrics.actualBoundingBoxDescent || 0 };
}

export function PlateRegistration({ lineOne, lineTwo, geometry, frameInset, hasFlag, roadLegal, logoBounds, sloganRef, sloganText, horizontalScale, maxFontSizeCqw, fallbackFontSizeCqw }: PlateRegistrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const singleLine = geometry.registration.singleLine;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = container.getBoundingClientRect();
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!bounds.width || !bounds.height || !canvas || !context || !active) return;
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.round(bounds.width * pixelRatio);
        canvas.height = Math.round(bounds.height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.font = "100px UKNumberPlate";
        const sloganBounds = sloganRef.current?.getBoundingClientRect();
        const layout = fitRegistrationLayout({
          geometry,
          first: getInkMetrics(context, lineOne),
          second: getInkMetrics(context, singleLine ? "" : lineTwo),
          maxFontSize: maxFontSizeCqw,
          horizontalScale,
          frameInset,
          hasFlag,
          roadLegal,
          logoBounds,
          sloganTop: sloganBounds ? (sloganBounds.top - bounds.top) / bounds.width * 100 : undefined,
        });
        const unit = bounds.width / 100;
        context.clearRect(0, 0, bounds.width, bounds.height);
        context.fillStyle = getComputedStyle(container).color;
        context.font = `${layout.fontSize * unit}px UKNumberPlate`;
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        const drawLine = (value: string, x: number, baseline: number) => {
          context.save();
          context.translate(x * unit, 0);
          context.scale(layout.horizontalScale, 1);
          context.fillText(value, 0, baseline * unit);
          context.restore();
        };
        drawLine(lineOne, layout.firstX, layout.firstBaseline);
        if (!singleLine) drawLine(lineTwo, layout.secondX, layout.secondBaseline);
        setReady(true);
      });
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    if (sloganRef.current) resizeObserver.observe(sloganRef.current);
    document.fonts?.load("100px UKNumberPlate", `${lineOne} ${lineTwo}`).then(() => { if (active) measure(); }).catch(() => undefined);
    document.fonts?.ready.then(() => { if (active) measure(); }).catch(() => undefined);
    measure();
    return () => { active = false; cancelAnimationFrame(frame); resizeObserver.disconnect(); };
  }, [geometry, frameInset, hasFlag, roadLegal, logoBounds?.left, logoBounds?.right, logoBounds?.top, logoBounds?.bottom, sloganRef, sloganText, lineOne, lineTwo, singleLine, horizontalScale, maxFontSizeCqw]);

  const fallbackStyle = {
    "--plate-registration-size": `${fallbackFontSizeCqw}cqw`,
    "--plate-registration-scale": horizontalScale,
    "--plate-registration-first-top": `${geometry.registration.firstRowTopPercent}%`,
    "--plate-registration-second-top": `${geometry.registration.secondRowTopPercent}%`,
    "--plate-registration-single-top": `${geometry.registration.singleRowTopPercent}%`,
    "--plate-registration-inset": `${geometry.registration.horizontalInsetPercent}%`,
  } as CSSProperties;
  return (
    <div aria-hidden="true" className="plate-registration" ref={containerRef} style={fallbackStyle}>
      <canvas className={`absolute inset-0 size-full ${ready ? "" : "invisible"}`} ref={canvasRef} />
      {ready ? null : <div className={`plate-registration-fallback ${singleLine ? "plate-registration-single" : ""} ${hasFlag ? "plate-registration-has-flag" : ""}`}>
        <span className="plate-registration-line plate-registration-line-first"><span className="plate-registration-text">{lineOne}</span></span>
        {singleLine ? null : <span className="plate-registration-line plate-registration-line-second"><span className="plate-registration-text">{lineTwo}</span></span>}
      </div>}
    </div>
  );
}
