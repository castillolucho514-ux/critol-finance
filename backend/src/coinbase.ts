export interface Coinbase { spotPrice(pair: string): Promise<{ pair: string; amount: string; currency: string }> }

export function createCoinbase(base = process.env.COINBASE_API_BASE ?? "https://api.coinbase.com"): Coinbase {
  return {
    async spotPrice(pair) {
      const normalized = String(pair).trim().toUpperCase();
      if (!/^[A-Z0-9]{2,10}-[A-Z]{3,5}$/.test(normalized)) throw new Error("invalid pair");
      const r = await fetch(`${base}/v2/prices/${normalized}/spot`);
      if (!r.ok) throw new Error(`coinbase error ${r.status}`);
      const { data } = (await r.json()) as { data: { amount: string; currency: string } };
      return { pair: normalized, amount: data.amount, currency: data.currency };
    },
  };
}
