import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import {
  ShieldCheck, Camera, AlertTriangle, Loader2,
  RefreshCw, CheckCircle2, XCircle, Upload,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
// Use your local /models folder (where you already have the weights)
const MODELS_URL        = "/models/";
const MATCH_THRESHOLD   = 0.50;
const RECHECK_INTERVAL  = 60_000;
const RECHECK_FAILS_MAX = 2;

// ── ID-card face detection ────────────────────────────────────────────────────
//
// Problem: ID cards contain a small face photo (~15–25% of card width).
// TinyFaceDetector fails on small faces because its minimum detectable face
// size is roughly 1/8 of the inputSize — if the card is 1000px wide and the
// face is 150px, inputSize:320 maps the face to only ~48px, below detection.
//
// Solution: multi-pass detection with progressive upscaling
//   Pass 1 — full image, inputSize 608 (largest TinyFD supports) + low threshold
//   Pass 2 — if pass 1 fails, also try SsdMobilenetv1 (better on small faces)
//   Pass 3 — if still nothing, crop 9 overlapping tiles from the image, upscale
//             each to 640×640, and run TinyFD on them. The tile covering the
//             actual face photo will have it large enough to detect.
//
// For live selfies (face fills most of the frame) pass 1 always succeeds.

/**
 * Draw source image onto a new canvas at target dimensions.
 * Optionally crops a region { sx, sy, sw, sh } before scaling.
 */
function imgToCanvas(source, tw, th, crop = null) {
  const c = document.createElement("canvas");
  c.width = tw; c.height = th;
  const ctx = c.getContext("2d");
  if (crop) {
    ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, tw, th);
  } else {
    ctx.drawImage(source, 0, 0, tw, th);
  }
  return c;
}

/**
 * Run TinyFaceDetector with given inputSize and scoreThreshold.
 * Returns the full detection result (with landmarks + descriptor) or null.
 */
async function runTiny(source, inputSize, threshold) {
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: threshold });
  const r = await faceapi
    .detectSingleFace(source, opts)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return r ?? null;
}

/**
 * Run SsdMobilenetv1 (more sensitive to small/off-angle faces).
 * Returns result or null.
 */
async function runSsd(source, threshold) {
  const opts = new faceapi.SsdMobilenetv1Options({ minConfidence: threshold });
  const r = await faceapi
    .detectSingleFace(source, opts)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return r ?? null;
}

/**
 * getDescriptorFromID — tries multiple strategies to detect a face from an
 * ID card image where the face is typically small and in a corner.
 *
 * Returns { descriptor, strategy } on success, or null on failure.
 */
async function getDescriptorFromID(img) {
  const W = img.naturalWidth  || img.width;
  const H = img.naturalHeight || img.height;

  // ── Pass 1: full image, large inputSize, relaxed threshold ────────────────
  try {
    // Upscale small images before detection — face-api works best ≥640px
    const targetW = Math.max(W, 640);
    const targetH = Math.round(H * (targetW / W));
    const canvas  = imgToCanvas(img, targetW, targetH);

    // Try inputSize 608 first (max TinyFD supports: 128,160,224,320,416,512,608)
    let r = await runTiny(canvas, 608, 0.2);
    if (r) return { descriptor: r.descriptor, strategy: "full-608" };

    // Try 416 in case 608 misses due to normalization quirks
    r = await runTiny(canvas, 416, 0.15);
    if (r) return { descriptor: r.descriptor, strategy: "full-416" };
  } catch { /* continue */ }

  // ── Pass 2: SsdMobilenetv1 on full image ──────────────────────────────────
  // SSD is heavier but much better at detecting small/rotated faces
  try {
    if (faceapi.nets.ssdMobilenetv1.isLoaded) {
      const canvas = imgToCanvas(img, Math.max(W, 640), Math.round(H * Math.max(W, 640) / W));
      const r = await runSsd(canvas, 0.15);
      if (r) return { descriptor: r.descriptor, strategy: "ssd-full" };
    }
  } catch { /* continue */ }

  // ── Pass 3: tiled crop-and-upscale ────────────────────────────────────────
  // Divide the image into overlapping tiles, upscale each to 640×640,
  // and run TinyFD. The tile containing the ID photo face will have it
  // large enough to detect. Grid: 3×3 with 25% overlap.
  try {
    const TILE_COLS = 3;
    const TILE_ROWS = 3;
    const OVERLAP   = 0.25;
    const TILE_OUT  = 640;

    const stepX = W / TILE_COLS;
    const stepY = H / TILE_ROWS;
    const tileW = stepX * (1 + OVERLAP);
    const tileH = stepY * (1 + OVERLAP);

    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        const sx = Math.max(0, col * stepX - stepX * OVERLAP * 0.5);
        const sy = Math.max(0, row * stepY - stepY * OVERLAP * 0.5);
        const sw = Math.min(tileW, W - sx);
        const sh = Math.min(tileH, H - sy);

        const tile = imgToCanvas(img, TILE_OUT, TILE_OUT, { sx, sy, sw, sh });

        let r = await runTiny(tile, 416, 0.15);
        if (r) return { descriptor: r.descriptor, strategy: `tile-${row}-${col}` };

        // Also try SSD on this tile if available
        if (faceapi.nets.ssdMobilenetv1.isLoaded) {
          r = await runSsd(tile, 0.15);
          if (r) return { descriptor: r.descriptor, strategy: `tile-ssd-${row}-${col}` };
        }
      }
    }
  } catch { /* continue */ }

  return null; // all passes failed
}

/**
 * getDescriptorFromLive — for webcam selfies the face is large and centred,
 * so a single-pass TinyFD at inputSize 320 is sufficient and fastest.
 */
async function getDescriptorFromLive(canvas) {
  try {
    const r = await Promise.race([
      runTiny(canvas, 320, 0.35),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15_000)),
    ]);
    return r ? { descriptor: r.descriptor } : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FaceVerifier({ videoRef, onVerified, onViolation }) {
  const [step, setStep]               = useState("loading");
  const [idPreview, setIdPreview]     = useState(null);
  const [livePreview, setLivePreview] = useState(null);
  const [loadPct, setLoadPct]         = useState(0);
  const [error, setError]             = useState("");
  const [score, setScore]             = useState(null);
  const [detailMsg, setDetailMsg]     = useState("");  // e.g. "Scanning tile 3/9…"

  const idDescriptor   = useRef(null);
  const recheckFails   = useRef(0);
  const recheckTimer   = useRef(null);
  const onViolationRef = useRef(onViolation);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ── Load models ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Load SsdMobilenetv1 in addition to Tiny — needed for Pass 2 on IDs.
    // faceLandmark68Net (full, not tiny) pairs with SSD.
    const nets = [
      { net: faceapi.nets.tinyFaceDetector,     label: "Tiny detector"  },
      { net: faceapi.nets.ssdMobilenetv1,        label: "SSD detector"  },
      { net: faceapi.nets.faceLandmark68TinyNet, label: "Landmarks (tiny)" },
      { net: faceapi.nets.faceLandmark68Net,     label: "Landmarks"     },
      { net: faceapi.nets.faceRecognitionNet,    label: "Recognition"   },
    ];

    (async () => {
      try {
        for (let i = 0; i < nets.length; i++) {
          if (cancelled) return;
          await nets[i].net.loadFromUri(MODELS_URL);
          if (!cancelled) setLoadPct(Math.round(((i + 1) / nets.length) * 100));
        }
        if (!cancelled) setStep("upload_id");
      } catch (err) {
        console.error("[FaceVerifier] model load error:", err);
        if (!cancelled)
          setError("Could not load face models from /models. Make sure the weights folder is served correctly.");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Upload ID ──────────────────────────────────────────────────────────────
  const handleIdUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError("");
    setDetailMsg("Reading image…");
    setStep("processing_id");

    const dataUrl = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = () => res(reader.result);
      reader.onerror = () => rej();
      reader.readAsDataURL(file);
    }).catch(() => null);

    if (!dataUrl) {
      setError("Could not read the file. Please choose a JPEG or PNG image.");
      setStep("upload_id");
      return;
    }

    setIdPreview(dataUrl);

    const img = await new Promise((res) => {
      const el = new Image();
      el.onload  = () => res(el);
      el.onerror = () => res(null);
      el.src = dataUrl;
    });

    if (!img) {
      setError("Could not decode the image. Please try a different file.");
      setIdPreview(null);
      setStep("upload_id");
      return;
    }

    setDetailMsg("Scanning for face — trying full image…");
    const result = await getDescriptorFromID(img);

    if (!result) {
      setError(
        "Could not detect a face in the ID photo after multiple attempts.\n\n" +
        "Tips:\n" +
        "• Photograph the ID on a flat, well-lit surface\n" +
        "• Avoid glare or shadows on the face area\n" +
        "• Make sure the ID photo is sharp, not blurry\n" +
        "• Try cropping the photo closer to just the face portion of the ID"
      );
      setIdPreview(null);
      setStep("upload_id");
      return;
    }

    console.info("[FaceVerifier] ID face detected via strategy:", result.strategy);
    idDescriptor.current = result.descriptor;
    setDetailMsg("");
    setStep("capture_live");
  }, []);

  // ── Live selfie ────────────────────────────────────────────────────────────
  function captureFrame() {
    const v = videoRef.current;
    if (!v || v.readyState < 2 || v.videoWidth === 0) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    return c;
  }

  function waitForVideo() {
    return new Promise((res, rej) => {
      const v = videoRef.current;
      if (!v) { rej(); return; }
      if (v.readyState >= 2 && v.videoWidth > 0) { res(); return; }
      let n = 0;
      const iv = setInterval(() => {
        if (v.readyState >= 2 && v.videoWidth > 0) { clearInterval(iv); res(); }
        else if (++n > 40) { clearInterval(iv); rej(); }
      }, 100);
    });
  }

  async function handleCaptureLive() {
    setError("");
    setDetailMsg("Capturing…");
    setStep("processing_live");

    try { await waitForVideo(); }
    catch { setError("Camera not ready. Wait a moment and try again."); setStep("capture_live"); return; }

    const canvas = captureFrame();
    if (!canvas) { setError("Could not capture from camera. Try again."); setStep("capture_live"); return; }

    setLivePreview(canvas.toDataURL("image/jpeg", 0.85));
    setDetailMsg("Detecting face…");

    const result = await getDescriptorFromLive(canvas);
    if (!result) {
      setError("No face detected. Look directly at the camera in good lighting.");
      setLivePreview(null);
      setStep("capture_live");
      return;
    }

    const dist = faceapi.euclideanDistance(idDescriptor.current, result.descriptor);
    const pct = Math.max(0, Math.min(100, Math.round((1 - dist) * 100)));
    setScore(pct);
    setDetailMsg("");

    if (dist <= MATCH_THRESHOLD) {
      setStep("verified");
      startPeriodicRecheck(idDescriptor.current);
      setTimeout(() => onVerified(), 1800);
    } else {
      setStep("failed");
    }
  }

  // ── Background recheck ─────────────────────────────────────────────────────
  function startPeriodicRecheck(ref) {
    clearInterval(recheckTimer.current);
    recheckTimer.current = setInterval(async () => {
      const canvas = captureFrame();
      if (!canvas) return;
      const result = await getDescriptorFromLive(canvas).catch(() => null);
      if (!result) {
        if (++recheckFails.current >= RECHECK_FAILS_MAX)
          onViolationRef.current("🚨 Identity check failed — face not detected");
        return;
      }
      const dist = faceapi.euclideanDistance(ref, result.descriptor);
      if (dist > MATCH_THRESHOLD) {
        if (++recheckFails.current >= RECHECK_FAILS_MAX)
          onViolationRef.current("🚨 Identity mismatch — different person detected");
      } else {
        recheckFails.current = 0;
      }
    }, RECHECK_INTERVAL);
  }

  useEffect(() => () => clearInterval(recheckTimer.current), []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.overlay}>
      <div style={S.card}>

        <div style={S.header}>
          <div style={S.headerIcon}><ShieldCheck size={18} color="#6366f1" /></div>
          <div>
            <p style={S.headerTitle}>Identity Verification</p>
            <p style={S.headerSub}>Required before your exam begins</p>
          </div>
        </div>

        {!["loading","verified","failed"].includes(step) && (
          <StepBar current={["upload_id","processing_id"].includes(step) ? 1 : 2} />
        )}

        <div style={S.body}>

          {/* LOADING */}
          {step === "loading" && (
            <Centered>
              <Loader2 size={30} color="#6366f1" style={{ animation: "vf-spin 1s linear infinite", marginBottom: 16 }} />
              <Title>Loading face models…</Title>
              <Sub>({loadPct}% complete)</Sub>
              <div style={S.track}><div style={{ ...S.fill, width: `${loadPct}%` }} /></div>
              {error && <ErrBox multiline>{error}</ErrBox>}
            </Centered>
          )}

          {/* UPLOAD ID */}
          {step === "upload_id" && (
            <Centered>
              <IconBox color="#6366f1"><Upload size={20} color="#6366f1" /></IconBox>
              <Title>Step 1 — Upload your ID photo</Title>
              <Sub>
                Choose a clear photo of your <strong style={{ color: "#f4f4f5" }}>government-issued ID</strong>{"\n"}(Aadhaar, Passport, Driving Licence).
              </Sub>
              {error && <ErrBox multiline>{error}</ErrBox>}
              <label style={S.uploadBtn}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Upload size={15} /> Choose ID Photo
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleIdUpload} style={{ display: "none" }} />
              </label>
              <p style={S.hint}>JPEG · PNG · WebP</p>
            </Centered>
          )}

          {/* PROCESSING */}
          {(step === "processing_id" || step === "processing_live") && (
            <Centered>
              <Loader2 size={32} color="#6366f1" style={{ animation: "vf-spin 1s linear infinite", marginBottom: 16 }} />
              <Title>Analysing…</Title>
              <Sub>{detailMsg || (step === "processing_id" ? "Scanning ID photo for a face." : "Comparing faces. Please hold still.")}</Sub>
              {step === "processing_id" && (
                <p style={{ fontSize: 12, color: "#3f3f46", textAlign: "center", marginTop: 4 }}>
                  ID cards may take 5–15 seconds — scanning multiple regions
                </p>
              )}
              {(idPreview || livePreview) && (
                <img src={step === "processing_live" ? livePreview : idPreview} alt="preview" style={S.previewImg} />
              )}
            </Centered>
          )}

          {/* CAPTURE LIVE */}
          {step === "capture_live" && (
            <Centered>
              <IconBox color="#10b981"><ShieldCheck size={20} color="#10b981" /></IconBox>
              <Title>Step 2 — Take a selfie</Title>
              <Sub><strong style={{ color: "#f4f4f5" }}>Put your ID aside</strong> and look directly at the camera.</Sub>
              {idPreview && <div style={{ marginBottom: 14 }}><Thumb src={idPreview} label="ID Photo ✓" /></div>}
              <LivePreview videoRef={videoRef} />
              {error && <ErrBox>{error}</ErrBox>}
              <Btn onClick={handleCaptureLive} color="#10b981"><Camera size={15} /> Capture Selfie</Btn>
              <GhostBtn onClick={() => { setIdPreview(null); idDescriptor.current = null; setError(""); setStep("upload_id"); }}>
                <RefreshCw size={13} /> Re-upload ID
              </GhostBtn>
            </Centered>
          )}

          {/* VERIFIED */}
          {step === "verified" && (
            <Centered>
              <IconBox color="#10b981"><CheckCircle2 size={26} color="#10b981" /></IconBox>
              <Title style={{ color: "#10b981" }}>Identity Verified ✓</Title>
              <Sub>Matched with {score}% confidence. Starting your exam…</Sub>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Thumb src={idPreview} label="ID Photo" />
                <Thumb src={livePreview} label="Live Photo" />
              </div>
            </Centered>
          )}

          {/* FAILED */}
          {step === "failed" && (
            <Centered>
              <IconBox color="#f43f5e"><XCircle size={26} color="#f43f5e" /></IconBox>
              <Title style={{ color: "#f43f5e" }}>Identity Mismatch</Title>
              <Sub>Your selfie doesn't match the ID. Use <strong style={{ color: "#f4f4f5" }}>your own ID</strong> and ensure your face is clearly lit.</Sub>
              <div style={{ display: "flex", gap: 12, marginTop: 8, marginBottom: 14 }}>
                <Thumb src={idPreview} label="ID Photo" />
                <Thumb src={livePreview} label="Live Photo" />
              </div>
              <div style={S.flagNote}>
                <AlertTriangle size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>This attempt has been flagged. Contact your teacher if this is an error.</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn onClick={() => { setLivePreview(null); setScore(null); setError(""); setStep("capture_live"); }} color="#6366f1">
                  <Camera size={14} /> Retry Selfie
                </Btn>
                <GhostBtn onClick={() => { setIdPreview(null); setLivePreview(null); idDescriptor.current = null; setScore(null); setError(""); setStep("upload_id"); }}>
                  <RefreshCw size={13} /> Change ID
                </GhostBtn>
              </div>
            </Centered>
          )}

        </div>
      </div>
      <style>{`
        @keyframes vf-spin  { to { transform: rotate(360deg); } }
        @keyframes vf-blink { 50% { opacity: 0; } }
        @keyframes vf-in    { from { opacity:0;transform:translateY(6px); } to { opacity:1;transform:none; } }
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"0 28px", marginBottom:20 }}>
      {[1,2].map((n,i) => (
        <div key={n} style={{ display:"flex", alignItems:"center", flex: i<1 ? 1 : "none" }}>
          <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0, background: current>=n ? "#6366f1" : "rgba(255,255,255,0.06)", color: current>=n ? "#fff" : "#52525b", border:`2px solid ${current===n ? "#818cf8" : "transparent"}`, transition:"all .3s" }}>{n}</div>
          {i<1 && <div style={{ flex:1, height:2, margin:"0 8px", background: current>1 ? "#6366f1" : "rgba(255,255,255,0.06)", transition:"background .3s" }} />}
        </div>
      ))}
    </div>
  );
}

function LivePreview({ videoRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const disp = ref.current, src = videoRef.current;
    if (!disp || !src) return;
    const attach = () => { if (src.srcObject) { disp.srcObject = src.srcObject; return true; } return false; };
    if (!attach()) { const iv = setInterval(() => { if (attach()) clearInterval(iv); }, 100); return () => clearInterval(iv); }
  }, [videoRef]);
  return (
    <div style={{ position:"relative", width:"100%", maxWidth:300, borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", marginBottom:14, background:"#000" }}>
      <video ref={ref} autoPlay playsInline muted style={{ width:"100%", display:"block", transform:"scaleX(-1)" }} />
      <div style={{ position:"absolute", top:8, left:8, display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,0.6)", borderRadius:6, padding:"3px 8px" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:"#f43f5e", animation:"vf-blink 1s step-end infinite" }} />
        <span style={{ fontSize:10, color:"#fff", fontFamily:"monospace" }}>LIVE</span>
      </div>
    </div>
  );
}

function Centered({ children }) { return <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%", animation:"vf-in .2s ease" }}>{children}</div>; }
function Title({ children, style={} }) { return <h2 style={{ margin:"10px 0 8px", fontSize:"clamp(17px,3vw,20px)", fontWeight:700, color:"#f4f4f5", textAlign:"center", ...style }}>{children}</h2>; }
function Sub({ children }) { return <p style={{ margin:"0 0 16px", fontSize:13, color:"#71717a", textAlign:"center", lineHeight:1.75, maxWidth:360, whiteSpace:"pre-line" }}>{children}</p>; }
function IconBox({ color, children }) { return <div style={{ width:52, height:52, borderRadius:16, background:`${color}18`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 }}>{children}</div>; }
function ErrBox({ children, multiline }) {
  return (
    <div style={{ display:"flex", alignItems: multiline ? "flex-start" : "center", gap:8, background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.25)", borderRadius:10, padding:"10px 14px", marginBottom:14, width:"100%", boxSizing:"border-box" }}>
      <AlertTriangle size={14} color="#f43f5e" style={{ flexShrink:0, marginTop: multiline ? 2 : 0 }} />
      <span style={{ fontSize:13, color:"#f43f5e", lineHeight:1.7, whiteSpace:"pre-line" }}>{children}</span>
    </div>
  );
}
function Btn({ children, onClick, color }) {
  return <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:12, background:color, color:"#fff", border:"none", cursor:"pointer", fontWeight:600, fontSize:14, marginTop:6, fontFamily:"inherit", transition:"opacity .15s" }} onMouseEnter={e=>e.currentTarget.style.opacity="0.85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
}
function GhostBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, background:"transparent", color:"#71717a", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", fontSize:12, marginTop:8, fontFamily:"inherit" }} onMouseEnter={e=>{e.currentTarget.style.color="#e4e4e7";e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";}} onMouseLeave={e=>{e.currentTarget.style.color="#71717a";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>{children}</button>;
}
function Thumb({ src, label }) {
  if (!src) return null;
  return <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}><img src={src} alt={label} style={{ width:110, height:82, objectFit:"cover", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)" }} /><span style={{ fontSize:11, color:"#52525b", fontFamily:"monospace" }}>{label}</span></div>;
}

const S = {
  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 },
  card:       { background:"#18181b", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, width:"100%", maxWidth:480, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" },
  header:     { display:"flex", alignItems:"center", gap:14, padding:"20px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" },
  headerIcon: { width:40, height:40, borderRadius:12, background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.25)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  headerTitle:{ margin:0, fontSize:15, fontWeight:700, color:"#f4f4f5" },
  headerSub:  { margin:"2px 0 0", fontSize:12, color:"#52525b" },
  body:       { padding:"24px 28px 28px" },
  track:      { width:"100%", maxWidth:260, height:4, borderRadius:999, background:"rgba(255,255,255,0.06)", overflow:"hidden", marginTop:10 },
  fill:       { height:"100%", background:"#6366f1", borderRadius:999, transition:"width .4s ease" },
  previewImg: { width:"100%", maxWidth:300, borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", marginTop:12 },
  uploadBtn:  { display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:12, background:"#6366f1", color:"#fff", cursor:"pointer", fontWeight:600, fontSize:14, marginTop:6, fontFamily:"inherit", transition:"opacity .15s", userSelect:"none" },
  hint:       { margin:"8px 0 0", fontSize:11, color:"#3f3f46", fontFamily:"monospace" },
  flagNote:   { display:"flex", alignItems:"flex-start", gap:6, fontSize:12, color:"#f59e0b", maxWidth:320, lineHeight:1.6, padding:"8px 12px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10 },
};