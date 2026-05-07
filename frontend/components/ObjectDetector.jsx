import { useEffect, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
// NOTE: Do NOT import "@tensorflow/tfjs-backend-webgl" separately.
// @tensorflow/tfjs already bundles and registers all backends (WebGL, WASM, CPU).
// Importing the backend package separately causes a "backend already registered" error.

const SCAN_INTERVAL = 400; // ms — scan every 400ms (was 800ms, 2× faster)
const INF_W = 256;         // inference canvas width  (was 320, ~40% fewer pixels)
const INF_H = 192;         // inference canvas height (was 240)

const CLASS_CONFIG = {
  phone:    { label: "cell phone", score: 0.38, cooldown: 4000, confirm: 1, msg: "📱 Phone detected — put it away"      },
  person:   { label: "person",     score: 0.65, cooldown: 4000, confirm: 2, msg: "👤 Extra person detected in frame"    },
  book:     { label: "book",       score: 0.42, cooldown: 6000, confirm: 2, msg: "📖 Book or notes detected"           },
  laptop:   { label: "laptop",     score: 0.48, cooldown: 6000, confirm: 2, msg: "💻 Extra device detected"            },
  keyboard: { label: "keyboard",   score: 0.48, cooldown: 6000, confirm: 2, msg: "⌨️ Extra keyboard detected"         },
};

/**
 * ObjectDetector
 *
 * Fixes vs original:
 *   1. Removed broken `import "@tensorflow/tfjs-backend-webgl"` — causes a
 *      "backend already registered" crash because tfjs bundles it already.
 *   2. SCAN_INTERVAL 800 → 400ms (2× faster scans)
 *   3. lite_mobilenet_v2 model — ~30% faster than mobilenet_v2
 *   4. Canvas shrunk 320×240 → 256×192 (~40% fewer pixels to process)
 *   5. phone confirm frames reduced 2 → 1 (don't need to see it twice)
 *   6. tf.tidy() removed from around async model.detect() — tidy() only tracks
 *      synchronous allocations; wrapping async code with it does nothing and
 *      masks memory leaks. Now using tf.dispose(preds) explicitly instead.
 *   7. Warm-up inference on load so first real frame runs at full GPU speed.
 *
 * Props:
 *   videoRef  — ref to the live webcam <video> element
 *   onDetect  — called with a violation message string
 */
export default function ObjectDetector({ videoRef, onDetect }) {
  const onDetectRef  = useRef(onDetect);
  const stoppedRef   = useRef(false);
  const lastAlertRef = useRef({});
  const consecRef    = useRef({});

  useEffect(() => { onDetectRef.current = onDetect; }, [onDetect]);

  useEffect(() => {
    stoppedRef.current = false;
    let timeoutId;

    const canvas = document.createElement("canvas");
    canvas.width = INF_W; canvas.height = INF_H;
    const ctx = canvas.getContext("2d");

    function check(type, detected) {
      const cfg = CLASS_CONFIG[type];
      if (detected) {
        const now = Date.now();
        if (now - (lastAlertRef.current[type] || 0) < cfg.cooldown) return;
        consecRef.current[type] = (consecRef.current[type] || 0) + 1;
        if (consecRef.current[type] >= cfg.confirm) {
          lastAlertRef.current[type] = now;
          consecRef.current[type]    = 0;
          onDetectRef.current(cfg.msg);
        }
      } else {
        // Decay rather than hard reset — avoids flickering alerts
        consecRef.current[type] = Math.max(0, (consecRef.current[type] || 0) - 1);
      }
    }

    const detectLoop = async (model) => {
      if (stoppedRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, INF_W, INF_H);

          // model.detect() is async — tf.tidy() cannot track its tensor
          // allocations. Call tf.dispose() on results manually instead.
          const preds = await model.detect(canvas);

          check("phone",    preds.some(p => p.class === "cell phone" && p.score > CLASS_CONFIG.phone.score));
          check("person",   preds.filter(p => p.class === "person"   && p.score > CLASS_CONFIG.person.score).length >= 2);
          check("book",     preds.some(p => p.class === "book"        && p.score > CLASS_CONFIG.book.score));
          check("laptop",   preds.filter(p => p.class === "laptop"    && p.score > CLASS_CONFIG.laptop.score).length >= 2);
          check("keyboard", preds.filter(p => p.class === "keyboard"  && p.score > CLASS_CONFIG.keyboard.score).length >= 2);

          tf.dispose(preds); // explicit cleanup — prevents GPU memory leak
        } catch (err) {
          // Swallow silently: tab hidden, video paused, WebGL context lost
          if (import.meta.env?.DEV) console.warn("[ObjectDetector]", err);
        }
      }

      timeoutId = setTimeout(() => detectLoop(model), SCAN_INTERVAL);
    };

    cocoSsd.load({ base: "lite_mobilenet_v2" })
      .then(async (model) => {
        if (stoppedRef.current) return;
        // Warm-up: first inference is slow (shader compilation). Run on blank
        // canvas so the first real exam frame runs at full speed.
        try {
          const warmup = document.createElement("canvas");
          warmup.width = INF_W; warmup.height = INF_H;
          const p = await model.detect(warmup);
          tf.dispose(p);
        } catch { /* ignore warm-up errors */ }
        if (!stoppedRef.current) detectLoop(model);
      })
      .catch((err) => {
        if (import.meta.env?.DEV) console.error("[ObjectDetector] model load failed:", err);
      });

    return () => {
      stoppedRef.current = true;
      clearTimeout(timeoutId);
    };
  }, [videoRef]);

  return null;
}