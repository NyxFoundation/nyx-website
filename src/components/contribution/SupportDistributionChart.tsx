"use client";

import { scaleLinear } from "@visx/scale";
import { memo, useMemo } from "react";

interface DistributionDatum {
  label: string;
  count: number;
}

interface SupportDistributionChartProps {
  data: DistributionDatum[];
  activeIndex: number;
  peopleSuffix: string;
  hideLabels?: boolean;
}

const chartHeight = 36;
const chartWidth = 100;

function SupportDistributionChartComponent({ data, activeIndex, peopleSuffix: _peopleSuffix, hideLabels }: SupportDistributionChartProps) {
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);
  const labelAreaHeight = hideLabels ? 0 : 26;

  const step = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  const baseBarWidth = data.length > 1 ? Math.max(step * 0.45, 6) : chartWidth * 0.3;

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
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + labelAreaHeight}`} className="h-auto w-full">
        <g>
          {data.map((bucket, idx) => {
            const centerX = data.length > 1 ? idx * step : chartWidth / 2;
            const adjustedWidth = Math.max(2, Math.min(baseBarWidth, chartWidth));
            const maxX = Math.max(0, chartWidth - adjustedWidth);
            const barX = Math.min(maxX, Math.max(0, centerX - adjustedWidth / 2));
            const barHeight = chartHeight - yScale(bucket.count);
            const barY = yScale(bucket.count);
            const isActive = idx === activeIndex;

            return (
              <g key={`${bucket.label}-${idx}`}>
                <rect
                  x={barX}
                  y={barY}
                  width={adjustedWidth}
                  height={Math.max(barHeight, 4)}
                  className={isActive ? "fill-emerald-500" : "fill-emerald-200"}
                />
                {!hideLabels && (
                  <text
                    x={centerX}
                    y={chartHeight + 18}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {bucket.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export const SupportDistributionChart = memo(SupportDistributionChartComponent);
