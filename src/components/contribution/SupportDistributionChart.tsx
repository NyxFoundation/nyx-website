"use client";

import { scaleBand, scaleLinear } from "@visx/scale";
import { memo, useMemo } from "react";

interface DistributionDatum {
  label: string;
  count: number;
}

interface SupportDistributionChartProps {
  data: DistributionDatum[];
  activeIndex: number;
  peopleSuffix: string;
}

const chartHeight = 140;
const labelAreaHeight = 26;

function SupportDistributionChartComponent({ data, activeIndex, peopleSuffix }: SupportDistributionChartProps) {
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);
  const width = Math.max(data.length * 56, 320);

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        domain: data.map((_, idx) => idx),
        range: [0, width],
        padding: 0.3,
      }),
    [data, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxCount],
        range: [chartHeight, 0],
        nice: true,
      }),
    [maxCount]
  );

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${chartHeight + labelAreaHeight}`} className="h-auto w-full">
        <g>
          {data.map((bucket, idx) => {
            const bandX = xScale(idx) ?? 0;
            const barWidth = xScale.bandwidth();
            const barHeight = chartHeight - yScale(bucket.count);
            const barY = yScale(bucket.count);
            const isActive = idx === activeIndex;

            return (
              <g key={`${bucket.label}-${idx}`}>
                <rect
                  x={bandX}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 4)}
                  rx={4}
                  className={isActive ? "fill-emerald-500" : "fill-emerald-200"}
                />
                <text
                  x={bandX + barWidth / 2}
                  y={barY - 6}
                  textAnchor="middle"
                  className={isActive ? "fill-foreground text-[10px]" : "fill-foreground/80 text-[10px]"}
                >
                  {`${bucket.count}${peopleSuffix}`}
                </text>
                <text
                  x={bandX + barWidth / 2}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {bucket.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export const SupportDistributionChart = memo(SupportDistributionChartComponent);
