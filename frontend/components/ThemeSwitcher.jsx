// src/components/ThemeSwitcher.jsx
import { useState, useRef, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeSwitcher() {
  const { themeKey, setThemeKey, themeList } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch theme"
        className=" text-zinc-500
          hover:border-zinc-600 hover:text-zinc-300 transition-all"
      >
        <Palette size={25} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-[9999]"
          style={{ minWidth: 160, top: "100%" }}
        >
          <p className="mono text-[9px] text-zinc-600 uppercase tracking-widest px-2 py-1.5">
            Theme
          </p>
          {themeList.map(({ key, name, dot }) => (
            <button
              key={key}
              onClick={() => { setThemeKey(key); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                text-sm transition-all border border-transparent
                ${themeKey === key
                  ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
            >
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: dot, flexShrink: 0,
                boxShadow: `0 0 6px ${dot}`,
              }} />
              <span style={{ flex: 1, textAlign: "left", fontSize: 13 }}>{name}</span>
              {themeKey === key && <Check size={11} style={{ color: dot }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}