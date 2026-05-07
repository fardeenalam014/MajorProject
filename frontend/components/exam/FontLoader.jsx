// src/components/exam/FontLoader.jsx

export default function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
      * { font-family: 'DM Sans', sans-serif; }
      .mono { font-family: 'DM Mono', monospace; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      input[type=number] { -moz-appearance: textfield; }
    `}</style>
  );
}
