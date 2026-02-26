import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function FaceTracker({ videoRef, onDetect }) {
  const lastState = useRef("OK");
  const lastAlertTime = useRef(0);

  const COOLDOWN = 3000; // 3 seconds

  useEffect(() => {
    if (!videoRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // 🔥 detection logic
    faceMesh.onResults(results => {
      const faces = results.multiFaceLandmarks || [];
      const now = Date.now();

      let state = "OK";

      if (faces.length === 0) state = "MISSING";
      else if (faces.length > 1) state = "MULTIPLE";

      // only alert if state changed + cooldown passed
      if (
        state !== "OK" &&
        state !== lastState.current &&
        now - lastAlertTime.current > COOLDOWN
      ) {
        if (state === "MISSING") onDetect("❌ Face Missing");
        if (state === "MULTIPLE") onDetect("❌ Multiple Faces");

        lastAlertTime.current = now;
      }

      lastState.current = state;
    });

    const camera = new Camera(videoRef.current, {
      width: 640,
      height: 480,
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      }
    });

    camera.start();

    // ✅ cleanup (VERY IMPORTANT)
    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, [videoRef, onDetect]);

  return null;
}
