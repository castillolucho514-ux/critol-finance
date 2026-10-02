import type { Candle } from "../services/coinbase.js";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

export function analyzeTrend(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  if (closes.length < 5) return { trend: "unknown" as const, momentumPct: 0, sma7: 0, sma30: 0 };
  const sma7 = mean(closes.slice(-7));
  const sma30 = mean(closes.slice(-30));
  const momentumPct = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
  const trend = sma7 > sma30 * 1.01 ? ("up" as const) : sma7 < sma30 * 0.99 ? ("down" as const) : ("sideways" as const);
  return { trend, momentumPct, sma7, sma30 };
}

export function assessRisk(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const m = mean(returns);
  const volatilityPct = Math.sqrt(mean(returns.map((r) => (r - m) ** 2))) * 100;
  const level = volatilityPct > 5 ? ("high" as const) : volatilityPct > 2 ? ("medium" as const) : ("low" as const);
  return { volatilityPct, level };
}

export function suggestAction(
  trend: ReturnType<typeof analyzeTrend>["trend"],
  risk: ReturnType<typeof assessRisk>["level"],
  profile: "conservative" | "moderate" | "aggressive",
) {
  if (trend === "up" && (risk !== "high" || profile === "aggressive")) return "BUY" as const;
  if (trend === "down" && profile !== "aggressive") return "SELL" as const;
  return "HOLD" as const;
}
