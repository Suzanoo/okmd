// lib/theme/chartTheme.ts
export type ChartTheme = {
  isDark: boolean;

  gridStroke: string;
  axisTick: string;
  axisLine: string;

  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipMuted: string;

  // Pie
  sliceStroke: string;
  sliceStrokeWidth: number;

  // UI helpers (disabled box, tips, etc.)
  hintText: string;
  hintBorder: string;
  hintBg: string;
};

export function getChartTheme(isDark: boolean): ChartTheme {
  return {
    isDark,

    gridStroke: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)",
    axisTick: isDark ? "rgba(229,231,235,0.75)" : "rgba(15,23,42,0.65)",
    axisLine: isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.12)",

    tooltipBg: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.98)",
    tooltipBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)",
    tooltipText: isDark ? "rgba(229,231,235,0.95)" : "rgba(15,23,42,0.90)",
    tooltipMuted: isDark ? "rgba(229,231,235,0.80)" : "rgba(15,23,42,0.70)",

    sliceStroke: isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.85)",
    sliceStrokeWidth: 1,

    hintText: isDark ? "rgba(229,231,235,0.70)" : "rgba(15,23,42,0.60)",
    hintBorder: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)",
    hintBg: isDark ? "rgba(2,6,23,0.18)" : "rgba(2,6,23,0.03)",
  };
}
