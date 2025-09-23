"use client";

import * as Slider from "@radix-ui/react-slider";
import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SliderMark = {
  value: number;
  label: string;
  isActive?: boolean;
  onSelect?: () => void;
};

interface SliderWithMarksProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  marks?: SliderMark[];
  ariaLabel: string;
  ariaValueText?: string;
  className?: string;
}

export function SliderWithMarks({
  min,
  max,
  value,
  onChange,
  marks = [],
  ariaLabel,
  ariaValueText,
  className,
}: SliderWithMarksProps) {
  const handleValueChange = (vals: number[]) => {
    if (!vals || vals.length === 0) return;
    onChange(vals[0]);
  };

  const getAlignStyles = (markValue: number): CSSProperties => {
    const percent = (markValue - min) / (max - min || 1);
    if (percent <= 0) return { left: "0%", transform: "translateX(0%)" };
    if (percent >= 1) return { left: "100%", transform: "translateX(-100%)" };
    return { left: `${percent * 100}%`, transform: "translateX(-50%)" };
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Slider.Root
        min={min}
        max={max}
        value={[value]}
        onValueChange={handleValueChange}
        aria-label={ariaLabel}
        aria-valuetext={ariaValueText}
        className="relative flex h-8 w-full select-none items-center"
      >
        <Slider.Track className="relative h-1.5 w-full rounded-full bg-gray-200">
          <Slider.Range className="absolute h-full rounded-full bg-emerald-500" />
        </Slider.Track>
        <Slider.Thumb className="relative block h-4 w-4 rounded-full border border-white bg-emerald-500 shadow ring-offset-background transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" />
      </Slider.Root>

      {marks.length > 0 && (
        <div className="relative mt-3 h-7 text-[11px] leading-tight text-muted-foreground">
          {marks.map((mark, idx) => (
            <button
              key={`${mark.label}-${idx}`}
              type="button"
              onClick={() => {
                onChange(mark.value);
                mark.onSelect?.();
              }}
              className={cn(
                "absolute top-0 px-1.5 py-0.5 text-center transition-colors whitespace-nowrap",
                mark.isActive ? "text-foreground font-semibold" : "hover:text-foreground"
              )}
              style={getAlignStyles(mark.value)}
            >
              {mark.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
