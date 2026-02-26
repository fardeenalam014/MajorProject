import { useEffect, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default function ObjectDetector({ videoRef, onDetect }) {
  const running = useRef(false);
  const lastAlert = useRef(0);

  const COOLDOWN = 5000;

  useEffect(() => {
    let model;
    let stopped = false;

    const detectLoop = async () => {
      if (stopped) return;

      if (!videoRef.current || running.current) {
        requestAnimationFrame(detectLoop);
        return;
      }

      running.current = true;

      // 🔥 resize for speed
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);

      const predictions = await model.detect(canvas);

      const persons = predictions.filter(
        p => p.class === "person" && p.score > 0.8
      );

      const phones = predictions.filter(
        p => p.class === "cell phone" && p.score > 0.6
      );

      const now = Date.now();

      if (persons.length > 1 && now - lastAlert.current > COOLDOWN) {
        onDetect("👤 Extra person detected");
        lastAlert.current = now;
      }

      if (phones.length > 0 && now - lastAlert.current > COOLDOWN) {
        onDetect("📱 Mobile detected");
        lastAlert.current = now;
      }

      running.current = false;

      // 🔥 slower frequency (important)
      setTimeout(detectLoop, 500); // every 2.5s
    };

    const load = async () => {
      model = await cocoSsd.load({ base: "lite_mobilenet_v2" }); // lighter model
      detectLoop();
    };

    load();

    return () => {
      stopped = true;
    };
  }, [videoRef, onDetect]);

  return null;
}
