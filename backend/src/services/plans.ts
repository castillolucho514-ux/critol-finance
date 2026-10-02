export type Plan = "FREE" | "PRO" | "PREMIUM";

export interface PlanLimits {
  dailyChats: number;
  coinbase: boolean;
  alerts: boolean;
  trading: boolean;
  priceUsd: number;
}

export const PLANS: Record<Plan, PlanLimits> = {
  FREE: { dailyChats: 10, coinbase: false, alerts: false, trading: false, priceUsd: 0 },
  PRO: { dailyChats: Infinity, coinbase: true, alerts: true, trading: false, priceUsd: 19 },
  PREMIUM: { dailyChats: Infinity, coinbase: true, alerts: true, trading: true, priceUsd: 49 },
};
