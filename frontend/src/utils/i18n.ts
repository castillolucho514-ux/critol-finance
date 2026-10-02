export type Lang = "es" | "en";

const dict = {
  es: { dashboard: "Panel", chat: "Chat IA", settings: "Ajustes", admin: "Admin", logout: "Salir", login: "Entrar", register: "Registrarse",
    email: "Correo", password: "Contraseña", name: "Nombre", send: "Enviar", watchlist: "Lista de seguimiento", add: "Agregar",
    portfolio: "Portafolio", trend: "Tendencia 30d", plan: "Plan", language: "Idioma", risk: "Perfil de riesgo", save: "Guardar",
    upgrade: "Mejorar plan", askAnything: "Pregunta sobre mercados…", disclaimer: "Informativo, no es asesoría financiera." },
  en: { dashboard: "Dashboard", chat: "AI Chat", settings: "Settings", admin: "Admin", logout: "Log out", login: "Log in", register: "Sign up",
    email: "Email", password: "Password", name: "Name", send: "Send", watchlist: "Watchlist", add: "Add",
    portfolio: "Portfolio", trend: "30d trend", plan: "Plan", language: "Language", risk: "Risk profile", save: "Save",
    upgrade: "Upgrade plan", askAnything: "Ask about markets…", disclaimer: "Informational only, not financial advice." },
};

export const t = (lang: Lang, key: keyof typeof dict.es) => dict[lang][key];
