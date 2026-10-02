import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Config } from "../config.js";
import type { Message, User } from "../database/store.js";
import type { CoinbaseService } from "../services/coinbase.js";
import { analyzeTrend, assessRisk, suggestAction } from "./analysis.js";

const KNOWN = ["BTC", "ETH", "SOL", "ADA", "XRP", "DOGE", "LTC", "AVAX", "DOT", "LINK"];

export function detectSymbols(text: string): string[] {
  const upper = text.toUpperCase();
  const names: Record<string, string> = { BITCOIN: "BTC", ETHEREUM: "ETH", SOLANA: "SOL" };
  const found = new Set(KNOWN.filter((s) => new RegExp(`\\b${s}\\b`).test(upper)));
  for (const [n, s] of Object.entries(names)) if (upper.includes(n)) found.add(s);
  return [...found].slice(0, 3);
}

export function systemPrompt(user: Pick<User, "language" | "riskProfile" | "name">, context: string) {
  const lang = user.language === "es" ? "Spanish" : "English";
  return [
    `You are CristoFinance, a financial assistant. Always answer in ${lang}.`,
    `User: ${user.name}. Risk profile: ${user.riskProfile}.`,
    "Give clear, data-grounded analysis. Trading suggestions are informational, not financial advice; say so briefly.",
    context ? `Live market data:\n${context}` : "",
  ].filter(Boolean).join("\n");
}

export class ChatEngine {
  constructor(private cfg: Config, private coinbase: CoinbaseService) {}

  async buildContext(text: string, user: User): Promise<{ context: string; suggestions: { symbol: string; action: string }[] }> {
    const lines: string[] = [];
    const suggestions: { symbol: string; action: string }[] = [];
    for (const symbol of detectSymbols(text)) {
      try {
        const [price, candles] = await Promise.all([this.coinbase.getSpotPrice(symbol), this.coinbase.getHistory(symbol, 30)]);
        const t = analyzeTrend(candles);
        const r = assessRisk(candles);
        const action = suggestAction(t.trend, r.level, user.riskProfile);
        suggestions.push({ symbol, action });
        lines.push(`${symbol}: $${price} | trend ${t.trend} (${t.momentumPct.toFixed(1)}% 30d) | volatility ${r.volatilityPct.toFixed(1)}% (${r.level}) | rule-based signal ${action}`);
      } catch {
        lines.push(`${symbol}: data unavailable`);
      }
    }
    return { context: lines.join("\n"), suggestions };
  }

  private model() {
    if (this.cfg.openaiApiKey) return new ChatOpenAI({ apiKey: this.cfg.openaiApiKey, model: this.cfg.openaiModel, temperature: 0.3 });
    if (this.cfg.geminiApiKey) return new ChatGoogleGenerativeAI({ apiKey: this.cfg.geminiApiKey, model: "gemini-1.5-flash", temperature: 0.3 });
    return null;
  }

  async reply(user: User, text: string, history: Message[]) {
    const { context, suggestions } = await this.buildContext(text, user);
    const model = this.model();
    if (!model) {
      const note = user.language === "es"
        ? "Modo sin IA (configura OPENAI_API_KEY o GEMINI_API_KEY)."
        : "AI-less mode (set OPENAI_API_KEY or GEMINI_API_KEY).";
      return { reply: [note, context].filter(Boolean).join("\n"), suggestions };
    }
    const messages = [
      new SystemMessage(systemPrompt(user, context)),
      ...history.map((m) => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content))),
      new HumanMessage(text),
    ];
    const res = await model.invoke(messages);
    return { reply: typeof res.content === "string" ? res.content : JSON.stringify(res.content), suggestions };
  }
}
