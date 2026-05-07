import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

// ── Config ────────────────────────────────────────────────────────────────────
const ALERT_COOLDOWN  = 4000;  // min ms between same-type alerts
const MISSING_GRACE   = 1200;  // ms face must be absent before alerting
const AWAY_GRACE      = 1500;  // ms looking away before alerting
const MULTIPLE_GRACE  = 800;   // ms multiple faces visible before alerting
const YAW_THRESHOLD   = 0.26;  // horizontal head turn (left/right)
const PITCH_THRESHOLD = 0.28;  // vertical head tilt (looking up)

/**
 * Estimate approximate yaw (left/right) and pitch (up/down) from MediaPipe
 * face landmarks using the nose tip relative to eye midpoint and chin/forehead.
 */
function estimateHeadPose(landmarks) {
  const noseTip  = landmarks[1];
  const leftEye  = landmarks[33];
  const rightEye = landmarks[263];
  const chin     = landmarks[152];
  const forehead = landmarks[10];
  const eyeMidX  = (leftEye.x + rightEye.x) / 2;
  const vertMid  = (chin.y + forehead.y) / 2;
  return {
    yaw:   noseTip.x - eyeMidX,   // positive = looking right
    pitch: noseTip.y - vertMid,   // negative = looking up
  };
}

/**
 * FaceTracker
 *
 * Uses MediaPipe FaceMesh to detect:
 *   • Missing face (student left frame)
 *   • Multiple faces (someone else present)
 *   • Gaze direction (looking left/right/up)
 *
 * Changes vs original:
 *   • Camera is stopped + faceMesh is closed on cleanup (original had this,
 *     kept and verified correct order: stop camera THEN close mesh)
 *   • Added null-guard on onResults so stale callbacks don't fire after unmount
 *   • onDetectRef pattern preserved (correct — avoids stale closure bug)
 *
 * Props:
 *   videoRef  — ref to the live webcam <video> element
 *   onDetect  — called with a violation message string
 */
export default function FaceTracker({ videoRef, onDetect }) {
  const onDetectRef    = useRef(onDetect);
  const mountedRef     = useRef(true);
  const missingStart   = useRef(null);
  const awayStart      = useRef(null);
  const multipleStart  = useRef(null);
  const lastAlert      = useRef({ MISSING: 0, MULTIPLE: 0, LOOKING_AWAY: 0 });

  useEffect(() => { onDetectRef.current = onDetect; }, [onDetect]);

  useEffect(() => {
    mountedRef.current = true;
    if (!videoRef.current) return;

    function fireAlert(type, message) {
      if (!mountedRef.current) return; // don't fire after unmount
      const now = Date.now();
      if (now - (lastAlert.current[type] || 0) < ALERT_COOLDOWN) return;
      lastAlert.current[type] = now;
      onDetectRef.current(message);
    }

    const faceMesh = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });

    faceMesh.setOptions({
      maxNumFaces:            2,
      refineLandmarks:        false, // faster without iris tracking
      minDetectionConfidence: 0.55,
      minTrackingConfidence:  0.55,
    });

    faceMesh.onResults(results => {
      if (!mountedRef.current) return;

      const faces = results.multiFaceLandmarks || [];
      const now   = Date.now();

      // ── No face detected ────────────────────────────────────────────────
      if (faces.length === 0) {
        if (!missingStart.current) missingStart.current = now;
        if (now - missingStart.current > MISSING_GRACE)
          fireAlert("MISSING", "❌ Face not visible — please stay in frame");
        awayStart.current     = null;
        multipleStart.current = null;
        return;
      }
      missingStart.current = null;

      // ── Multiple faces ───────────────────────────────────────────────────
      if (faces.length > 1) {
        if (!multipleStart.current) multipleStart.current = now;
        if (now - multipleStart.current > MULTIPLE_GRACE)
          fireAlert("MULTIPLE", "👥 Multiple people detected");
      } else {
        multipleStart.current = null;
      }

      // ── Gaze direction ───────────────────────────────────────────────────
      const { yaw, pitch } = estimateHeadPose(faces[0]);
      const lookingAway = Math.abs(yaw) > YAW_THRESHOLD || pitch < -PITCH_THRESHOLD;

      if (lookingAway) {
        if (!awayStart.current) awayStart.current = now;
        if (now - awayStart.current > AWAY_GRACE) {
          const dir = Math.abs(yaw) > YAW_THRESHOLD
            ? (yaw > 0 ? "right" : "left")
            : "up";
          fireAlert("LOOKING_AWAY", `👁️ Looking ${dir} — stay focused on your screen`);
        }
      } else {
        awayStart.current = null;
      }
    });

    const camera = new Camera(videoRef.current, {
      width: 640, height: 480,
      onFrame: async () => {
        if (videoRef.current && mountedRef.current)
          await faceMesh.send({ image: videoRef.current });
      },
    });

    camera.start();

    return () => {
      mountedRef.current = false;
      camera.stop();
      faceMesh.close();
    };
  }, [videoRef]);

  return null;
}