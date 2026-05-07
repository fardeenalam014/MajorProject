// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const themeList = [
  { key: "dark",     name: "Dark",     dot: "#6366f1" },
  { key: "light",    name: "Light",    dot: "#6366f1" },
  { key: "midnight", name: "Midnight", dot: "#a78bfa" },
  { key: "forest",   name: "Forest",   dot: "#34d399" },
  { key: "rose",     name: "Rose",     dot: "#fb7185" },
  { key: "ocean",    name: "Ocean",    dot: "#38bdf8" },
  { key: "sunset",   name: "Sunset",   dot: "#f97316" },
  { key: "aurora",   name: "Aurora",   dot: "#2dd4bf" },
];

const themes = {
  dark: {
    bg950: "#09090b", bg900: "#18181b", bg800: "#27272a",
    border800: "rgba(255,255,255,0.08)", border700: "rgba(255,255,255,0.12)",
    text100: "#f4f4f5", text200: "#e4e4e7", text300: "#d4d4d8",
    text400: "#a1a1aa", text500: "#71717a", text600: "#52525b",
    accent: "#6366f1", accentHover: "#818cf8",
    accentAlpha10: "rgba(99,102,241,0.10)", accentAlpha20: "rgba(99,102,241,0.20)",
    accentBorder30: "rgba(99,102,241,0.30)", accentText: "#818cf8",
    lpBg: "#09090b", lpSurface: "#18181b", lpCard: "#18181b",
    lpNavBg: "rgba(9,9,11,0.85)", lpBorder: "rgba(255,255,255,0.07)",
    lpBorderSoft: "rgba(255,255,255,0.05)", lpText: "#e4e4e7",
    lpTextTitle: "#f4f4f5", lpTextMuted: "#71717a", lpTextDim: "#52525b",
    lpTextFaint: "#3f3f46", lpTrack: "#27272a", lpNoise: "0.028",
    indigo: "#6366f1", indigoDim: "rgba(99,102,241,0.12)",
  },
  light: {
    bg950: "#f8fafc", bg900: "#ffffff", bg800: "#e2e8f0",
    border800: "rgba(0,0,0,0.1)", border700: "rgba(0,0,0,0.15)",
    text100: "#0f172a", text200: "#1e293b", text300: "#334155",
    text400: "#475569", text500: "#64748b", text600: "#94a3b8",
    accent: "#6366f1", accentHover: "#4f46e5",
    accentAlpha10: "rgba(99,102,241,0.10)", accentAlpha20: "rgba(99,102,241,0.15)",
    accentBorder30: "rgba(99,102,241,0.30)", accentText: "#4f46e5",
    lpBg: "#f8fafc", lpSurface: "#ffffff", lpCard: "#f1f5f9",
    lpNavBg: "rgba(248,250,252,0.88)", lpBorder: "rgba(0,0,0,0.08)",
    lpBorderSoft: "rgba(0,0,0,0.06)", lpText: "#334155",
    lpTextTitle: "#0f172a", lpTextMuted: "#64748b", lpTextDim: "#94a3b8",
    lpTextFaint: "#cbd5e1", lpTrack: "#e2e8f0", lpNoise: "0",
    indigo: "#6366f1", indigoDim: "rgba(99,102,241,0.10)",
  },
  midnight: {
    bg950: "#0d0a1e", bg900: "#13103a", bg800: "#1e1b4b",
    border800: "rgba(139,92,246,0.15)", border700: "rgba(139,92,246,0.25)",
    text100: "#ede9fe", text200: "#ddd6fe", text300: "#c4b5fd",
    text400: "#a78bfa", text500: "#7c3aed", text600: "#5b21b6",
    accent: "#7c3aed", accentHover: "#6d28d9",
    accentAlpha10: "rgba(124,58,237,0.10)", accentAlpha20: "rgba(124,58,237,0.20)",
    accentBorder30: "rgba(124,58,237,0.30)", accentText: "#a78bfa",
    lpBg: "#0d0a1e", lpSurface: "#13103a", lpCard: "#1a1650",
    lpNavBg: "rgba(13,10,30,0.9)", lpBorder: "rgba(139,92,246,0.15)",
    lpBorderSoft: "rgba(139,92,246,0.1)", lpText: "#c4b5fd",
    lpTextTitle: "#ede9fe", lpTextMuted: "#7c3aed", lpTextDim: "#5b21b6",
    lpTextFaint: "#4c1d95", lpTrack: "#2e1065", lpNoise: "0.02",
    indigo: "#8b5cf6", indigoDim: "rgba(139,92,246,0.15)",
  },
  forest: {
    bg950: "#061a0e", bg900: "#0a2415", bg800: "#14532d",
    border800: "rgba(16,185,129,0.15)", border700: "rgba(16,185,129,0.25)",
    text100: "#ecfdf5", text200: "#d1fae5", text300: "#a7f3d0",
    text400: "#6ee7b7", text500: "#10b981", text600: "#065f46",
    accent: "#059669", accentHover: "#047857",
    accentAlpha10: "rgba(5,150,105,0.10)", accentAlpha20: "rgba(5,150,105,0.20)",
    accentBorder30: "rgba(5,150,105,0.30)", accentText: "#34d399",
    lpBg: "#061a0e", lpSurface: "#0a2415", lpCard: "#0d2e1b",
    lpNavBg: "rgba(6,26,14,0.9)", lpBorder: "rgba(16,185,129,0.15)",
    lpBorderSoft: "rgba(16,185,129,0.08)", lpText: "#a7f3d0",
    lpTextTitle: "#ecfdf5", lpTextMuted: "#059669", lpTextDim: "#065f46",
    lpTextFaint: "#064e3b", lpTrack: "#064e3b", lpNoise: "0.02",
    indigo: "#10b981", indigoDim: "rgba(16,185,129,0.15)",
  },
  rose: {
    bg950: "#1a030a", bg900: "#270511", bg800: "#4c0519",
    border800: "rgba(244,63,94,0.15)", border700: "rgba(244,63,94,0.25)",
    text100: "#fff1f2", text200: "#ffe4e6", text300: "#fecdd3",
    text400: "#fda4af", text500: "#f43f5e", text600: "#9f1239",
    accent: "#e11d48", accentHover: "#be123c",
    accentAlpha10: "rgba(225,29,72,0.10)", accentAlpha20: "rgba(225,29,72,0.20)",
    accentBorder30: "rgba(225,29,72,0.30)", accentText: "#fb7185",
    lpBg: "#1a030a", lpSurface: "#270511", lpCard: "#320618",
    lpNavBg: "rgba(26,3,10,0.9)", lpBorder: "rgba(244,63,94,0.15)",
    lpBorderSoft: "rgba(244,63,94,0.08)", lpText: "#fda4af",
    lpTextTitle: "#fff1f2", lpTextMuted: "#e11d48", lpTextDim: "#9f1239",
    lpTextFaint: "#881337", lpTrack: "#881337", lpNoise: "0.02",
    indigo: "#f43f5e", indigoDim: "rgba(244,63,94,0.15)",
  },
  ocean: {
    bg950: "#020c1b", bg900: "#051629", bg800: "#0c2340",
    border800: "rgba(56,189,248,0.15)", border700: "rgba(56,189,248,0.25)",
    text100: "#e0f2fe", text200: "#bae6fd", text300: "#7dd3fc",
    text400: "#38bdf8", text500: "#0284c7", text600: "#075985",
    accent: "#0284c7", accentHover: "#0369a1",
    accentAlpha10: "rgba(2,132,199,0.10)", accentAlpha20: "rgba(2,132,199,0.20)",
    accentBorder30: "rgba(2,132,199,0.30)", accentText: "#38bdf8",
    lpBg: "#020c1b", lpSurface: "#051629", lpCard: "#071e36",
    lpNavBg: "rgba(2,12,27,0.9)", lpBorder: "rgba(56,189,248,0.15)",
    lpBorderSoft: "rgba(56,189,248,0.08)", lpText: "#7dd3fc",
    lpTextTitle: "#e0f2fe", lpTextMuted: "#0284c7", lpTextDim: "#075985",
    lpTextFaint: "#0c4a6e", lpTrack: "#0c4a6e", lpNoise: "0.02",
    indigo: "#38bdf8", indigoDim: "rgba(56,189,248,0.15)",
  },
  sunset: {
    bg950: "#1a0a00", bg900: "#271200", bg800: "#431407",
    border800: "rgba(249,115,22,0.15)", border700: "rgba(249,115,22,0.25)",
    text100: "#fff7ed", text200: "#ffedd5", text300: "#fed7aa",
    text400: "#fdba74", text500: "#ea580c", text600: "#9a3412",
    accent: "#ea580c", accentHover: "#c2410c",
    accentAlpha10: "rgba(234,88,12,0.10)", accentAlpha20: "rgba(234,88,12,0.20)",
    accentBorder30: "rgba(234,88,12,0.30)", accentText: "#fb923c",
    lpBg: "#1a0a00", lpSurface: "#271200", lpCard: "#321800",
    lpNavBg: "rgba(26,10,0,0.9)", lpBorder: "rgba(249,115,22,0.15)",
    lpBorderSoft: "rgba(249,115,22,0.08)", lpText: "#fed7aa",
    lpTextTitle: "#fff7ed", lpTextMuted: "#ea580c", lpTextDim: "#9a3412",
    lpTextFaint: "#7c2d12", lpTrack: "#7c2d12", lpNoise: "0.02",
    indigo: "#f97316", indigoDim: "rgba(249,115,22,0.15)",
  },
  aurora: {
    bg950: "#010f12", bg900: "#04191e", bg800: "#083344",
    border800: "rgba(45,212,191,0.15)", border700: "rgba(45,212,191,0.25)",
    text100: "#f0fdfa", text200: "#ccfbf1", text300: "#99f6e4",
    text400: "#5eead4", text500: "#0d9488", text600: "#115e59",
    accent: "#0d9488", accentHover: "#0f766e",
    accentAlpha10: "rgba(13,148,136,0.10)", accentAlpha20: "rgba(13,148,136,0.20)",
    accentBorder30: "rgba(13,148,136,0.30)", accentText: "#2dd4bf",
    lpBg: "#010f12", lpSurface: "#04191e", lpCard: "#062028",
    lpNavBg: "rgba(1,15,18,0.9)", lpBorder: "rgba(45,212,191,0.15)",
    lpBorderSoft: "rgba(45,212,191,0.08)", lpText: "#99f6e4",
    lpTextTitle: "#f0fdfa", lpTextMuted: "#0d9488", lpTextDim: "#115e59",
    lpTextFaint: "#134e4a", lpTrack: "#134e4a", lpNoise: "0.02",
    indigo: "#2dd4bf", indigoDim: "rgba(45,212,191,0.15)",
  },
};

function applyTheme(key) {
  const t = themes[key] || themes.dark;
  const root = document.documentElement;
  const body = document.body;

  // 1. data-theme attribute (for any remaining CSS selectors)
  root.setAttribute("data-theme", key);

  // 2. Inject ALL CSS variables directly — cannot be overridden by stylesheets
  const vars = {
    "--lp-bg": t.lpBg, "--lp-surface": t.lpSurface, "--lp-card": t.lpCard,
    "--lp-nav-bg": t.lpNavBg, "--lp-border": t.lpBorder,
    "--lp-border-soft": t.lpBorderSoft, "--lp-border-card": t.lpBorder,
    "--lp-border-img": t.lpBorder, "--lp-text": t.lpText,
    "--lp-text-title": t.lpTextTitle, "--lp-text-muted": t.lpTextMuted,
    "--lp-text-dim": t.lpTextDim, "--lp-text-faint": t.lpTextFaint,
    "--lp-track": t.lpTrack, "--lp-noise-opacity": t.lpNoise,
    "--lp-strip-bg": t.lpBorder, "--lp-feat-bg": t.lpBorder,
    "--lp-overlay": t.lpNavBg,
    "--indigo": t.indigo, "--indigo-dim": t.indigoDim, "--emerald": t.accentText,
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // 3. Force html + body backgrounds directly (beats every CSS rule)
  root.style.setProperty("background-color", t.bg950, "important");
  body.style.setProperty("background-color", t.bg950, "important");
  body.style.setProperty("color", t.text100, "important");

  // 4. Inject a dynamic <style> tag that overrides Tailwind classes
  //    with !important, scoped to data-theme — this beats Tailwind v4 JIT
  let styleEl = document.getElementById("aeg-theme-overrides");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "aeg-theme-overrides";
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    html, body { background-color: ${t.bg950} !important; }

    .bg-zinc-950  { background-color: ${t.bg950} !important; }
    .bg-zinc-950\\/90 { background-color: ${t.bg950}e6 !important; }
    .bg-zinc-950\\/95 { background-color: ${t.bg950}f2 !important; }
    .bg-zinc-900  { background-color: ${t.bg900} !important; }
    .bg-zinc-800  { background-color: ${t.bg800} !important; }
    .bg-zinc-800\\/40 { background-color: ${t.bg800}66 !important; }
    .bg-zinc-800\\/50 { background-color: ${t.bg800}80 !important; }
    .bg-zinc-700  { background-color: ${t.bg800} !important; }

    .border-zinc-800      { border-color: ${t.border800} !important; }
    .border-zinc-800\\/50 { border-color: ${t.border800} !important; }
    .border-zinc-800\\/60 { border-color: ${t.border800} !important; }
    .border-zinc-700      { border-color: ${t.border700} !important; }
    .border-zinc-700\\/40 { border-color: ${t.border700} !important; }
    .border-zinc-700\\/50 { border-color: ${t.border700} !important; }
    .border-zinc-600      { border-color: ${t.border700} !important; }

    .text-zinc-100 { color: ${t.text100} !important; }
    .text-zinc-200 { color: ${t.text200} !important; }
    .text-zinc-300 { color: ${t.text300} !important; }
    .text-zinc-400 { color: ${t.text400} !important; }
    .text-zinc-500 { color: ${t.text500} !important; }
    .text-zinc-600 { color: ${t.text600} !important; }
    .text-zinc-700 { color: ${t.text600} !important; }
    .text-zinc-950 { color: ${t.text100} !important; }

    .placeholder\\:text-zinc-600::placeholder { color: ${t.text600} !important; }
    .placeholder\\:text-zinc-700::placeholder { color: ${t.text600} !important; }

    .bg-indigo-500       { background-color: ${t.accent} !important; }
    .bg-indigo-400       { background-color: ${t.accentHover} !important; }
    .bg-indigo-400\\/70  { background-color: ${t.accent}b3 !important; }
    .bg-indigo-500\\/5   { background-color: ${t.accentAlpha10} !important; }
    .bg-indigo-500\\/8   { background-color: ${t.accentAlpha10} !important; }
    .bg-indigo-500\\/10  { background-color: ${t.accentAlpha10} !important; }
    .bg-indigo-500\\/20  { background-color: ${t.accentAlpha20} !important; }
    .bg-indigo-500\\/20  { background-color: ${t.accentAlpha20} !important; }

    .border-indigo-500\\/15 { border-color: ${t.accentBorder30} !important; }
    .border-indigo-500\\/25 { border-color: ${t.accentBorder30} !important; }
    .border-indigo-500\\/30 { border-color: ${t.accentBorder30} !important; }
    .border-indigo-500\\/40 { border-color: ${t.accentBorder30} !important; }
    .border-indigo-500\\/50 { border-color: ${t.accentBorder30} !important; }
    .border-indigo-500\\/60 { border-color: ${t.accentBorder30} !important; }

    .text-indigo-300 { color: ${t.accentText} !important; }
    .text-indigo-400 { color: ${t.accentText} !important; }

    .hover\\:bg-indigo-400:hover        { background-color: ${t.accentHover} !important; }
    .hover\\:bg-indigo-500\\/5:hover    { background-color: ${t.accentAlpha10} !important; }
    .hover\\:bg-indigo-500\\/20:hover   { background-color: ${t.accentAlpha20} !important; }
    .hover\\:border-indigo-500\\/30:hover { border-color: ${t.accentBorder30} !important; }
    .hover\\:border-indigo-500\\/40:hover { border-color: ${t.accentBorder30} !important; }
    .hover\\:text-indigo-300:hover      { color: ${t.accentText} !important; }
    .hover\\:text-indigo-400:hover      { color: ${t.accentText} !important; }

    .hover\\:bg-zinc-800:hover     { background-color: ${t.bg800} !important; }
    .hover\\:bg-zinc-900:hover     { background-color: ${t.bg900} !important; }
    .hover\\:border-zinc-700:hover { border-color: ${t.border700} !important; }
    .hover\\:border-zinc-600:hover { border-color: ${t.border700} !important; }
    .hover\\:border-zinc-400:hover { border-color: ${t.border700} !important; }
    .hover\\:text-zinc-200:hover   { color: ${t.text200} !important; }
    .hover\\:text-zinc-300:hover   { color: ${t.text300} !important; }
    .hover\\:text-zinc-400:hover   { color: ${t.text400} !important; }

    .ring-indigo-500\\/15 { --tw-ring-color: ${t.accentAlpha10} !important; }
    .ring-indigo-500\\/20 { --tw-ring-color: ${t.accentAlpha20} !important; }
    .focus\\:ring-2.focus\\:ring-indigo-500\\/15:focus { --tw-ring-color: ${t.accentAlpha10} !important; }
    .focus\\:border-indigo-500\\/60:focus { border-color: ${t.accentBorder30} !important; }
  `;
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem("aeg-theme") || "dark"
  );

  useEffect(() => {
    localStorage.setItem("aeg-theme", themeKey);
    applyTheme(themeKey);
  }, [themeKey]);

  // Apply on first paint too
  useEffect(() => { applyTheme(themeKey); }, []);

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, themeList }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);