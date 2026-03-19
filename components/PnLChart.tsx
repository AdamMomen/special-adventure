"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { EmptyState } from "@/components/EmptyState";

type TimeInterval = "1D" | "7D" | "30D" | "All";

interface PnLChartProps {
  data: { timestamp: number; cumulativePnl: number }[];
  isLoading: boolean;
  error?: Error | null;
}

const INTERVALS: { label: TimeInterval; seconds: number }[] = [
  { label: "1D", seconds: 24 * 60 * 60 },
  { label: "7D", seconds: 7 * 24 * 60 * 60 },
  { label: "30D", seconds: 30 * 24 * 60 * 60 },
  { label: "All", seconds: Infinity },
];

function downsampleByDay(
  points: { timestamp: number; cumulativePnl: number }[]
): { timestamp: number; cumulativePnl: number }[] {
  if (points.length <= 50) return points;
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const byDay = new Map<number, number>();
  for (const p of sorted) {
    const dayStart = Math.floor(p.timestamp / 86400) * 86400;
    byDay.set(dayStart, p.cumulativePnl);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, pnl]) => ({ timestamp: ts, cumulativePnl: pnl }));
}

function formatXLabel(
  ts: number,
  xFormat: "time" | "short" | "date"
): string {
  const date = new Date(ts * 1000);
  if (xFormat === "time") return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (xFormat === "short") return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

interface ChartInnerProps {
  chartData: { timestamp: number; pnl: number; label: string }[];
  yDomain: [number, number];
  xFormat: "time" | "short" | "date";
  interval: TimeInterval;
}

function ChartInner({ chartData, yDomain, xFormat, interval }: ChartInnerProps) {
  const gradientId = `pnlGradient-${interval}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tickFormatter={(v) => `$${v >= 0 ? "" : "-"}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-input)",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Cumulative P&L"]}
          labelFormatter={(label) => label}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartEmptyState({ interval, hasAnyData }: { interval: TimeInterval; hasAnyData: boolean }) {
  if (hasAnyData) {
    return (
      <div className="h-64">
        <EmptyState
          title={`No swaps in the last ${interval === "1D" ? "24 hours" : interval === "7D" ? "7 days" : interval === "30D" ? "30 days" : "period"}.`}
          description='Try "All" to see full history.'
        />
      </div>
    );
  }
  return (
    <div className="h-64">
      <EmptyState
        title="No swap history for this wallet."
        description="P&L chart will appear once swaps are detected."
      />
    </div>
  );
}

export function PnLChart({ data, isLoading, error }: PnLChartProps) {
  const [interval, setInterval] = useState<TimeInterval>("All");

  const { chartData, yDomain, xFormat, isEmpty, hasAnyData } = useMemo(() => {
    const hasAnyData = !!(data && data.length > 0);
    if (!data || data.length === 0) {
      return {
        chartData: [],
        yDomain: [0, 100] as [number, number],
        xFormat: "short" as const,
        isEmpty: true,
        hasAnyData: false,
      };
    }

    const sortedSource = [...data].sort((a, b) => a.timestamp - b.timestamp);

    const now = Math.floor(Date.now() / 1000);
    const intervalConfig = INTERVALS.find((i) => i.label === interval)!;
    const cutoff = intervalConfig.seconds === Infinity ? 0 : now - intervalConfig.seconds;

    let filtered = sortedSource.filter((d) => d.timestamp >= cutoff);

    const lastBeforeCutoff = sortedSource.filter((d) => d.timestamp < cutoff).pop();
    if (lastBeforeCutoff && cutoff > 0 && filtered.length > 0) {
      filtered = [{ ...lastBeforeCutoff, timestamp: cutoff }, ...filtered];
    }

    const points = filtered.length > 80 ? downsampleByDay(filtered) : filtered;
    const sortedPoints = [...points].sort((a, b) => a.timestamp - b.timestamp);

    const xFormat: "time" | "short" | "date" = interval === "1D" ? "time" : interval === "7D" ? "short" : "date";

    const chartData = sortedPoints.map((d) => ({
      timestamp: d.timestamp,
      pnl: d.cumulativePnl,
      label: formatXLabel(d.timestamp, xFormat),
    }));

    const pnlValues = chartData.map((d) => d.pnl);
    const minPnl = Math.min(...pnlValues, 0);
    const maxPnl = Math.max(...pnlValues, 0);
    const range = maxPnl - minPnl || 1;
    const padding = Math.max(range * 0.1, 10);
    const yDomain: [number, number] = [minPnl - padding, maxPnl + padding];

    return {
      chartData,
      yDomain,
      xFormat: xFormat as "time" | "short" | "date",
      isEmpty: chartData.length === 0,
      hasAnyData,
    };
  }, [data, interval]);

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 shadow-sm">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4 animate-pulse" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">P&L Over Time</h2>
        <div className="h-64 flex flex-col items-center justify-center">
          <EmptyState
            title="Failed to load P&L data."
            description={error.message}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-zinc-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            P&L Over Time
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            {chartData.length > 0 ? `${interval} · ${chartData.length} points` : interval}
          </p>
        </div>
        <div className="flex gap-1">
          {INTERVALS.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setInterval(label)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                interval === label
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-[var(--color-muted)] hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {isEmpty ? (
        <ChartEmptyState interval={interval} hasAnyData={hasAnyData} />
      ) : (
        <div className="h-64">
          <ChartInner
            key={`${interval}-${chartData.length}-${chartData[0]?.timestamp ?? 0}`}
            chartData={chartData}
            yDomain={yDomain}
            xFormat={xFormat}
            interval={interval}
          />
        </div>
      )}
    </div>
  );
}
