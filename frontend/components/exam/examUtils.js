// src/components/exam/examUtils.js

export const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

export const MAX_ESCAPES = 3;
export const OPT_LABELS  = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** "mm:ss" from seconds */
export const fmt = (s) => {
  if (s == null || s < 0) return "00:00";
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
