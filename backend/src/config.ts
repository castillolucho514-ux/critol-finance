export function getConfig(env: NodeJS.ProcessEnv = process.env) {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET is required");
  return {
    port: Number(env.PORT ?? 4000),
    jwtSecret,
    databaseUrl: env.DATABASE_URL,
    corsOrigin: env.CORS_ORIGIN ?? "http://localhost:3000",
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL ?? "gpt-4o-mini",
    geminiApiKey: env.GEMINI_API_KEY,
    coinbaseApiKeyName: env.COINBASE_API_KEY_NAME,
    coinbaseApiPrivateKey: env.COINBASE_API_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    stripePriceIds: { PRO: env.STRIPE_PRICE_PRO, PREMIUM: env.STRIPE_PRICE_PREMIUM },
    appUrl: env.APP_URL ?? "http://localhost:3000",
  };
}
export type Config = ReturnType<typeof getConfig>;
