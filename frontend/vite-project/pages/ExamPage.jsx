import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import FaceTracker from "../components/FaceTracker";
import ObjectDetector from "../components/ObjectDetector";

export default function ExamPage() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  /* ================= STATES ================= */
  const [started, setStarted] = useState(false);
  const [warning, setWarning] = useState("");
  const [warningCount, setWarningCount] = useState(0);
  const [escapeCount, setEscapeCount] = useState(0);
  const [blocked, setBlocked] = useState(false); // fullscreen exit overlay
  const [cameraBlocked, setCameraBlocked] = useState(false); // camera permission overlay

  const MAX_ESCAPES = 3;

  /* ================= ALERT HANDLER ================= */
  const handleDetect = useCallback((msg) => {
    setWarning(msg);
    setWarningCount((c) => c + 1);
    setTimeout(() => setWarning(""), 3000);
  }, []);

  /* ================= START EXAM ================= */
 const startExam = async () => {
  try {
    // 1️⃣ Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

    // 2️⃣ Assign to video element
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // 3️⃣ Go fullscreen
    await document.documentElement.requestFullscreen();

    setStarted(true);

  } catch (err) {
    console.error("Camera access failed:", err);
    alert("Camera permission required to start the exam.");
  }
};


  /* ================= FINISH EXAM ================= */
  const finishExam = async () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    if (document.fullscreenElement) await document.exitFullscreen();
    navigate("/");
  };

  /* ================= FULLSCREEN EXIT DETECTION ================= */
  useEffect(() => {
    const handleFullscreenChange = async () => {
      if (!started) return;
      if (!document.fullscreenElement) {
        setBlocked(true); // overlay blocks exam

        setEscapeCount((prev) => {
          const next = prev + 1;
          if (next >= MAX_ESCAPES) {
            handleDetect("⚠️ Multiple fullscreen exits detected!");
          } else {
            handleDetect("⚠️ Do not exit fullscreen during exam!");
          }
          return next;
        });

        try {
          await document.documentElement.requestFullscreen();
        } catch {}
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
  }, [started, handleDetect]);

  /* ================= TAB SWITCH DETECTION ================= */
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && started) handleDetect("⚠️ Tab switched!");
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [started, handleDetect]);

  /* ================= DISABLE RIGHT CLICK ================= */
  useEffect(() => {
    const block = (e) => e.preventDefault();
    window.addEventListener("contextmenu", block);
    return () => window.removeEventListener("contextmenu", block);
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex flex-col">

      {/* ================= HEADER ================= */}
      <header className="flex justify-between items-center p-4 bg-slate-900 shadow-lg">
        <h1 className="text-lg font-semibold tracking-wide">AI Proctored Exam</h1>
        <div className="flex items-center gap-3">
          <span className="bg-red-600 px-4 py-1 rounded-lg text-sm">Warnings: {warningCount}</span>
          <span className="bg-yellow-600 px-4 py-1 rounded-lg text-sm">ESC: {escapeCount}</span>
          <button
            onClick={finishExam}
            className="bg-gray-700 hover:bg-gray-800 px-4 py-1 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">

        {/* CAMERA PANEL */}
        <div className="lg:col-span-2 bg-black rounded-xl relative overflow-hidden shadow-lg">
          {!started ? (
            <button
              onClick={startExam}
              className="absolute inset-0 m-auto h-14 w-64 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-semibold"
            >
              Start Exam
            </button>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Floating warnings */}
              {warning && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-red-500 px-5 py-2 rounded-xl font-semibold shadow-xl">
                  {warning}
                </div>
              )}

              {/* Proctoring detectors */}
              <FaceTracker videoRef={videoRef} onDetect={handleDetect} />
              <ObjectDetector videoRef={videoRef} onDetect={handleDetect} />
            </>
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="bg-slate-900 rounded-xl p-6 space-y-4 shadow-lg">
          <h2 className="text-lg font-semibold">Instructions</h2>
          <ul className="space-y-2 text-slate-300 text-sm list-disc pl-4">
            <li>Stay in fullscreen</li>
            <li>Only one person allowed</li>
            <li>No mobile phones</li>
            <li>Do not switch tabs</li>
            <li>3 ESC presses → warning</li>
          </ul>
          <button
            onClick={finishExam}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold mt-4"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-slate-500 text-xs py-2">
        AI Powered Proctoring System • Final Year Major Project
      </footer>

      {/* ================= FULLSCREEN EXIT OVERLAY ================= */}
      {blocked && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center text-white">
          <h2 className="text-2xl mb-4 font-bold">⚠ Fullscreen Required</h2>
          <p className="text-center mb-6">You exited fullscreen. Please return to continue the exam.</p>
          <button
            onClick={() => {
              document.documentElement.requestFullscreen().catch(() => {});
              setBlocked(false);
            }}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
          >
            Return to Exam
          </button>
        </div>
      )}

      {/* ================= CAMERA BLOCK OVERLAY ================= */}
      {cameraBlocked && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center text-white">
          <h2 className="text-2xl mb-4 font-bold">⚠ Camera Permission Required</h2>
          <p className="text-center mb-6">
            Your camera is not accessible. Please allow camera access to start the exam.
          </p>
          <button
            onClick={startExam}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
          >
            Retry Camera Access
          </button>
        </div>
      )}

    </div>
  );
}
