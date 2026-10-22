"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { store } from "../lib/store";

type Locale = "es" | "en";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: React.Dispatch<React.SetStateAction<Locale>>;
} | null>(null);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within Providers");
  }
  return context;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocale] = useState<Locale>("es");
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const localeContext = useMemo(() => ({ locale, setLocale }), [locale]);

  return <Provider store={store}><LocaleContext.Provider value={localeContext}>{children}</LocaleContext.Provider></Provider>;
}
