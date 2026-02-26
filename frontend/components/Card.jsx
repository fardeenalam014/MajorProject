export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
