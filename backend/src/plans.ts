export type Plan = "FREE" | "PRO" | "PREMIUM";
export const PLANS: Record<Plan, { priceUsd: number; dailyMessages: number; coinbase: boolean }> = {
  FREE: { priceUsd: 0, dailyMessages: 10, coinbase: false },
  PRO: { priceUsd: 9.99, dailyMessages: 200, coinbase: true },
  PREMIUM: { priceUsd: 24.99, dailyMessages: 2000, coinbase: true },
};
