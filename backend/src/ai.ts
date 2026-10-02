export interface AI { reply(history: { role: string; content: string }[], context: string): Promise<string> }

const SYSTEM = "You are CristoFinance, a bilingual (ES/EN) financial assistant. Provide educational market analysis; never guarantee returns; remind users this is not financial advice.";

export function createAI(): AI {
  return {
    async reply(history, context) {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return "AI is not configured (set OPENAI_API_KEY). / La IA no está configurada.";
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: [{ role: "system", content: SYSTEM + (context ? `\nContext: ${context}` : "") }, ...history],
        }),
      });
      if (!r.ok) throw new Error(`ai error ${r.status}`);
      const j = (await r.json()) as { choices: { message: { content: string } }[] };
      return j.choices[0].message.content;
    },
  };
}
