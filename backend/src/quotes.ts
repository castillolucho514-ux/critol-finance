export type Quote = { symbol: string; price: number; change: number };

export const quotes: Quote[] = [
  { symbol: "AAPL", price: 189.98, change: 1.24 },
  { symbol: "MSFT", price: 420.21, change: -0.34 },
  { symbol: "TSLA", price: 177.81, change: 2.11 }
];

export function findQuote(symbol: string) {
  return quotes.find((quote) => quote.symbol === symbol.toUpperCase());
}
