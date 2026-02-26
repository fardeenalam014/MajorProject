import { useEffect, useState } from "react";

export default function Timer({ minutes = 30 }) {
  const [time, setTime] = useState(minutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const m = Math.floor(time / 60);
  const s = time % 60;

  return (
    <div className="bg-slate-800 px-4 py-2 rounded-xl font-bold">
      ⏱ {m}:{s.toString().padStart(2, "0")}
    </div>
  );
}
