// src/PIWMVisualizer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

const IMG_H = 96;
const IMG_W = 96;
const SCALE = 4;

const LATENT_DIM = 16;

// LSTM ONNX must match
const NUM_LAYERS = 2;
const HIDDEN_DIM = 128;

// ---------- Ground-truth constants (match python) ----------
const GRAVITY = 9.8;
const MASS_CART = 1.0;
const MASS_POLE = 0.1;
const TOTAL_MASS = MASS_POLE + MASS_CART;
const LENGTH = 0.5; // half pole length
const POLEMASS_LENGTH = MASS_POLE * LENGTH;
const FORCE_MAG = 10.0;
const TAU = 0.02;

const X_THRESHOLD = 2.4;

// render canvas (match python)
const RENDER_W = 600;
const RENDER_H = 400;

// ---------- ORT run serialization (GLOBAL) ----------
function makeRunQueue() {
  let chain = Promise.resolve();
  return async (fn) => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => { });
    return next;
  };
}

// ---------- GT transition model (match python) ----------
function transitionModel(state, action) {
  const x = state.x;
  const xDot = state.xDot;
  const theta = state.theta;
  const thetaDot = state.thetaDot;

  const force = action === 1 ? FORCE_MAG : -FORCE_MAG;

  const costheta = Math.cos(theta);
  const sintheta = Math.sin(theta);

  const temp =
    (force + POLEMASS_LENGTH * thetaDot * thetaDot * sintheta) / TOTAL_MASS;

  const thetaAcc =
    (GRAVITY * sintheta - costheta * temp) /
    (LENGTH * (4.0 / 3.0 - (MASS_POLE * costheta * costheta) / TOTAL_MASS));

  const xAcc = temp - (POLEMASS_LENGTH * thetaAcc * costheta) / TOTAL_MASS;

  return {
    x: x + TAU * xDot,
    xDot: xDot + TAU * xAcc,
    theta: theta + TAU * thetaDot,
    thetaDot: thetaDot + TAU * thetaAcc,
  };
}

// ---------- PIWM learned dynamics ----------
function learnedTransitionModel(
  state,
  action,
  { force_mag = 11.26, mass_cart = 1.017, mass_pole = 0.103, length = 0.5 } = {}
) {
  const x = state.x;
  const xDot = state.xDot;
  const theta = state.theta;
  const thetaDot = state.thetaDot;

  const total_mass = mass_cart + mass_pole;
  const polemass_length = mass_pole * length;

  const force = action === 1 ? force_mag : -force_mag;

  const costheta = Math.cos(theta);
  const sintheta = Math.sin(theta);

  const temp =
    (force + polemass_length * thetaDot * thetaDot * sintheta) / total_mass;

  const thetaAcc =
    (GRAVITY * sintheta - costheta * temp) /
    (length * (4.0 / 3.0 - (mass_pole * costheta * costheta) / total_mass));

  const xAcc = temp - (polemass_length * thetaAcc * costheta) / total_mass;

  return {
    x: x + TAU * xDot,
    xDot: xDot + TAU * xAcc,
    theta: theta + TAU * thetaDot,
    thetaDot: thetaDot + TAU * thetaAcc,
  };
}

// ---------- draw polygon helper ----------
function fillPolygon(ctx, pts, fillStyle, strokeStyle) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ---------- rotate point (x,y) by angle radians ----------
function rot(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

// ---------- GT observation renderer (match python geometry) ----------
function renderObservationTo96({ position, angle, renderCanvas, smallCanvas96 }) {
  const rctx = renderCanvas.getContext("2d");
  const sctx = smallCanvas96.getContext("2d");

  rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.clearRect(0, 0, RENDER_W, RENDER_H);
  rctx.fillStyle = "#ffffff";
  rctx.fillRect(0, 0, RENDER_W, RENDER_H);

  const worldWidth = X_THRESHOLD * 2;
  const scale = RENDER_W / worldWidth;
  const polewidth = 10.0;
  const polelen = scale * (2 * LENGTH);
  const cartwidth = 50.0;
  const cartheight = 30.0;

  const l = -cartwidth / 2;
  const r = cartwidth / 2;
  const t = cartheight / 2;
  const b = -cartheight / 2;
  const axleoffset = cartheight / 4.0;

  const cartx = position * scale + RENDER_W / 2.0;
  const carty = RENDER_H / 2.0;

  // flip y like pygame.transform.flip(..., True)
  rctx.save();
  rctx.translate(0, RENDER_H);
  rctx.scale(1, -1);

  const cartPts = [
    { x: l + cartx, y: b + carty },
    { x: l + cartx, y: t + carty },
    { x: r + cartx, y: t + carty },
    { x: r + cartx, y: b + carty },
  ];
  fillPolygon(rctx, cartPts, "#000000", "#000000");

  const pl = -polewidth / 2;
  const pr = polewidth / 2;
  const pt = polelen - polewidth / 2;
  const pb = -polewidth / 2;

  const anchorX = cartx;
  const anchorY = carty + axleoffset;

  const localPole = [
    { x: pl, y: pb },
    { x: pl, y: pt },
    { x: pr, y: pt },
    { x: pr, y: pb },
  ];

  // rotate_rad(-angle)
  const polePts = localPole.map((p) => {
    const q = rot(p.x, p.y, -angle);
    return { x: q.x + anchorX, y: q.y + anchorY };
  });
  fillPolygon(rctx, polePts, "rgb(202,152,101)", "rgb(202,152,101)");

  rctx.beginPath();
  rctx.arc(anchorX, anchorY, polewidth / 2, 0, Math.PI * 2);
  rctx.fillStyle = "rgb(129,132,203)";
  rctx.fill();
  rctx.strokeStyle = "rgb(129,132,203)";
  rctx.stroke();

  rctx.beginPath();
  rctx.moveTo(0, carty);
  rctx.lineTo(RENDER_W, carty);
  rctx.strokeStyle = "#000000";
  rctx.lineWidth = 1;
  rctx.stroke();

  rctx.restore();

  // downsample to 96x96 (area-ish)
  sctx.imageSmoothingEnabled = true;
  sctx.clearRect(0, 0, IMG_W, IMG_H);
  sctx.drawImage(renderCanvas, 0, 0, RENDER_W, RENDER_H, 0, 0, IMG_W, IMG_H);
}

function blitUpscale(smallCanvas, bigCanvas) {
  const bctx = bigCanvas.getContext("2d");
  bctx.imageSmoothingEnabled = false;
  bctx.clearRect(0, 0, bigCanvas.width, bigCanvas.height);
  bctx.drawImage(
    smallCanvas,
    0,
    0,
    smallCanvas.width,
    smallCanvas.height,
    0,
    0,
    bigCanvas.width,
    bigCanvas.height
  );
}

function drawCHWFloatToCanvases(chwData, smallCanvas, bigCanvas) {
  const sctx = smallCanvas.getContext("2d");
  const imageData = sctx.createImageData(IMG_W, IMG_H);
  const rgba = imageData.data;
  const planeSize = IMG_H * IMG_W;

  for (let i = 0; i < planeSize; i++) {
    const rr = chwData[0 * planeSize + i];
    const gg = chwData[1 * planeSize + i];
    const bb = chwData[2 * planeSize + i];
    const idx = i * 4;
    rgba[idx + 0] = Math.max(0, Math.min(255, Math.round(rr * 255)));
    rgba[idx + 1] = Math.max(0, Math.min(255, Math.round(gg * 255)));
    rgba[idx + 2] = Math.max(0, Math.min(255, Math.round(bb * 255)));
    rgba[idx + 3] = 255;
  }

  sctx.putImageData(imageData, 0, 0);
  blitUpscale(smallCanvas, bigCanvas);
}

function canvasToCHWFloat(smallCanvas) {
  const ctx = smallCanvas.getContext("2d");
  const img = ctx.getImageData(0, 0, IMG_W, IMG_H).data;
  const planeSize = IMG_W * IMG_H;
  const chw = new Float32Array(3 * planeSize);

  for (let i = 0; i < planeSize; i++) {
    chw[0 * planeSize + i] = img[i * 4 + 0] / 255;
    chw[1 * planeSize + i] = img[i * 4 + 1] / 255;
    chw[2 * planeSize + i] = img[i * 4 + 2] / 255;
  }
  return chw;
}

export default function PIWMVisualizer() {
  // ONNX sessions
  const [vaeEnc, setVaeEnc] = useState(null);
  const [vaeDec, setVaeDec] = useState(null);
  const [lstm, setLstm] = useState(null);

  const [piwmEnc, setPiwmEnc] = useState(null);
  const [piwmDec, setPiwmDec] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ground truth full state
  const [gtState, setGtState] = useState({
    x: 0,
    xDot: 0,
    theta: 0,
    thetaDot: 0,
  });

  // LSTM latent + hidden
  const [latent, setLatent] = useState(() => Array(LATENT_DIM).fill(0));
  const [hData, setHData] = useState(null);
  const [cData, setCData] = useState(null);

  // PIWM state (decoder uses only x/theta)
  const [piwmState, setPiwmState] = useState({
    x: 0,
    xDot: 0,
    theta: 0,
    thetaDot: 0,
  });

  // refs - GT renderer
  const gtRenderCanvasRef = useRef(null);
  const gtSmallCanvasRef = useRef(null);
  const gtBigCanvasRef = useRef(null);

  // refs - VAE latent decoded image
  const latentSmallCanvasRef = useRef(null);
  const latentBigCanvasRef = useRef(null);

  // refs - PIWM decoded image
  const piwmSmallCanvasRef = useRef(null);
  const piwmBigCanvasRef = useRef(null);

  // IMPORTANT: ONE global queue for *all* ORT runs (prevents Session already started)
  const ortQueueRef = useRef(makeRunQueue());

  // “latest only” tokens for decodes
  const vaeDecodeTokenRef = useRef(0);
  const piwmDecodeTokenRef = useRef(0);

  const styles = useMemo(() => {
    const font =
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"';

    const card = {
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.86)",
      boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
      padding: 16,
    };

    const titleRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };

    const pill = (bg, border) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${border}`,
      background: bg,
      fontSize: 12.5,
      color: "#0f172a",
      whiteSpace: "nowrap",
    });

    const dot = (c) => ({
      width: 9,
      height: 9,
      borderRadius: 999,
      background: c,
      boxShadow: "0 0 0 3px rgba(15,23,42,0.05)",
    });

    const btn = {
      padding: "9px 12px",
      fontSize: 13.5,
      borderRadius: 12,
      border: "1px solid rgba(15,23,42,0.14)",
      background: "rgba(255,255,255,0.78)",
      color: "#0f172a",
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(15,23,42,0.04)",
    };

    const btnPrimary = {
      ...btn,
      border: "1px solid rgba(37,99,235,0.28)",
      background:
        "linear-gradient(180deg, rgba(59,130,246,0.16), rgba(59,130,246,0.07))",
    };

    const btnDanger = {
      ...btn,
      border: "1px solid rgba(244,63,94,0.28)",
      background:
        "linear-gradient(180deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
    };

    const btnDisabled = {
      opacity: 0.55,
      cursor: "not-allowed",
    };

    const kbd = {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12.5,
      padding: "2px 6px",
      borderRadius: 8,
      border: "1px solid rgba(15,23,42,0.18)",
      background: "rgba(255,255,255,0.78)",
      color: "#0f172a",
      whiteSpace: "nowrap",
    };

    const canvasFrame = {
      width: `${IMG_W * SCALE}px`,
      height: `${IMG_H * SCALE}px`,
      imageRendering: "pixelated",
      borderRadius: 14,
      border: "1px solid rgba(15,23,42,0.14)",
      background:
        "radial-gradient(450px 220px at 30% 20%, rgba(59,130,246,0.10), rgba(15,23,42,0.02))",
      boxShadow: "0 12px 22px rgba(15,23,42,0.06)",
    };

    const smallText = { fontSize: 12.5, color: "#64748b", lineHeight: 1.55, marginBottom: 10 };

    const sliderWrap = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginTop: 8,
    };

    const sliderLabel = {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12.5,
      color: "#0f172a",
      marginBottom: 6,
    };

    const slider = {
      width: 240,
      accentColor: "#2563eb",
    };

    const page = {
      fontFamily: font,
      color: "#0f172a",
      padding: 18,
      maxWidth: "95%",
      margin: "0 auto",
    };

    const header = {
      marginBottom: 14,
      borderRadius: 18,
      border: "1px solid rgba(15,23,42,0.08)",
      background:
        "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(236,72,153,0.08))",
      padding: 16,
      boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
    };

    const h1 = { margin: 0, fontSize: 22, letterSpacing: -0.35 };
    const lead = { margin: "6px 0 0 0", color: "#334155", fontSize: 13.5, lineHeight: 1.6 };

    const grid = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 16,
      alignItems: "start",
    };

    const callout = {
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(2,132,199,0.22)",
      background:
        "linear-gradient(180deg, rgba(56,189,248,0.10), rgba(56,189,248,0.04))",
      fontSize: 13,
      color: "#334155",
      lineHeight: 1.55,
    };

    const err = {
      borderRadius: 16,
      border: "1px solid rgba(244,63,94,0.25)",
      background:
        "linear-gradient(180deg, rgba(244,63,94,0.10), rgba(244,63,94,0.03))",
      padding: 12,
      color: "#991b1b",
      whiteSpace: "pre-wrap",
      fontSize: 13,
      marginBottom: 12,
    };

    return {
      page,
      header,
      h1,
      lead,
      grid,
      card,
      titleRow,
      pill,
      dot,
      btn,
      btnPrimary,
      btnDanger,
      btnDisabled,
      kbd,
      canvasFrame,
      smallText,
      sliderWrap,
      sliderLabel,
      slider,
      callout,
      err,
    };
  }, []);

  // load models once
  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setLoading(true);
        setError(null);

        // ---- Force ORT wasm single-thread & no proxy to avoid mismatch ----
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
        ort.env.wasm.proxy = false;

        // ---- Force same EP for ALL sessions ----
        const sessOpts = { executionProviders: ["wasm"] };

        const [_vaeEnc, _vaeDec, _lstm, _piwmEnc, _piwmDec] = await Promise.all([
          ort.InferenceSession.create("/vae_encoder16.onnx", sessOpts),
          ort.InferenceSession.create("/vae_decoder16.onnx", sessOpts),
          ort.InferenceSession.create("/lstm_latent_step.onnx", sessOpts),
          ort.InferenceSession.create("/piwm_encoder.onnx", sessOpts),
          ort.InferenceSession.create("/piwm_decoder.onnx", sessOpts),
        ]);

        if (cancelled) return;

        setVaeEnc(_vaeEnc);
        setVaeDec(_vaeDec);
        setLstm(_lstm);
        setPiwmEnc(_piwmEnc);
        setPiwmDec(_piwmDec);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Render GT image whenever gtState changes ----
  useEffect(() => {
    if (!gtRenderCanvasRef.current || !gtSmallCanvasRef.current || !gtBigCanvasRef.current) return;

    renderObservationTo96({
      position: gtState.x,
      angle: gtState.theta,
      renderCanvas: gtRenderCanvasRef.current,
      smallCanvas96: gtSmallCanvasRef.current,
    });
    blitUpscale(gtSmallCanvasRef.current, gtBigCanvasRef.current);
  }, [gtState]);

  // ---- Decode VAE latent -> image whenever latent changes (GLOBAL serialized) ----
  useEffect(() => {
    if (!vaeDec || !latentSmallCanvasRef.current || !latentBigCanvasRef.current) return;

    const token = ++vaeDecodeTokenRef.current;

    ortQueueRef.current(async () => {
      if (token !== vaeDecodeTokenRef.current) return;

      const z = new Float32Array(LATENT_DIM);
      for (let i = 0; i < LATENT_DIM; i++) z[i] = latent[i];
      const zTensor = new ort.Tensor("float32", z, [1, LATENT_DIM]);

      const out = await vaeDec.run({ z: zTensor });
      if (token !== vaeDecodeTokenRef.current) return;

      const xRecon = out["x_recon"];
      drawCHWFloatToCanvases(xRecon.data, latentSmallCanvasRef.current, latentBigCanvasRef.current);
    }).catch((e) => {
      console.error(e);
      setError(String(e));
    });
  }, [vaeDec, latent]);

  // ---- Decode PIWM state -> image whenever piwmState changes (GLOBAL serialized) ----
  useEffect(() => {
    if (!piwmDec || !piwmSmallCanvasRef.current || !piwmBigCanvasRef.current) return;

    const token = ++piwmDecodeTokenRef.current;

    ortQueueRef.current(async () => {
      if (token !== piwmDecodeTokenRef.current) return;

      const s = new Float32Array([piwmState.x, piwmState.theta]);
      const sTensor = new ort.Tensor("float32", s, [1, 2]);

      const out = await piwmDec.run({ state: sTensor });
      if (token !== piwmDecodeTokenRef.current) return;

      const img = out["image"];
      drawCHWFloatToCanvases(img.data, piwmSmallCanvasRef.current, piwmBigCanvasRef.current);
    }).catch((e) => {
      console.error(e);
      setError(String(e));
    });
  }, [piwmDec, piwmState]);

  // ---- Sync button: GT image -> VAE latent AND PIWM state (GLOBAL serialized) ----
  const syncGT = async () => {
    if (!vaeEnc || !piwmEnc || !gtSmallCanvasRef.current) return;

    try {
      await ortQueueRef.current(async () => {
        const chw = canvasToCHWFloat(gtSmallCanvasRef.current);
        const xTensor = new ort.Tensor("float32", chw, [1, 3, IMG_H, IMG_W]);

        const outV = await vaeEnc.run({ x: xTensor });
        const mu = outV["mu"];

        const outP = await piwmEnc.run({ x: xTensor });
        const st2 = outP["state"]; // [1,2] pos, angle

        setLatent(Array.from(mu.data));
        setHData(null);
        setCData(null);

        setPiwmState({
          x: Number(st2.data[0]),
          xDot: 0,
          theta: Number(st2.data[1]),
          thetaDot: 0,
        });
      });
    } catch (e) {
      console.error(e);
      setError(String(e));
    }
  };

  // ---- Action: updates GT, LSTM, PIWM. All ORT runs serialized globally. ----
  const stepWithAction = async (actionVal) => {
    // Update physics states (UI)
    setGtState((prev) => transitionModel(prev, actionVal));
    setPiwmState((prev) =>
      learnedTransitionModel(prev, actionVal, {
        force_mag: 11.26,
        mass_cart: 1.017,
        mass_pole: 0.103,
        length: 0.5,
      })
    );

    if (!lstm) return;

    try {
      await ortQueueRef.current(async () => {
        const zArr = new Float32Array(LATENT_DIM);
        for (let i = 0; i < LATENT_DIM; i++) zArr[i] = latent[i];

        const latentTensor = new ort.Tensor("float32", zArr, [1, LATENT_DIM]);
        const actionTensor = new ort.Tensor("float32", new Float32Array([actionVal]), [1, 1]);

        let hArr = hData;
        let cArr = cData;
        if (!hArr || !cArr) {
          hArr = new Float32Array(NUM_LAYERS * 1 * HIDDEN_DIM);
          cArr = new Float32Array(NUM_LAYERS * 1 * HIDDEN_DIM);
        }

        const h0 = new ort.Tensor("float32", hArr, [NUM_LAYERS, 1, HIDDEN_DIM]);
        const c0 = new ort.Tensor("float32", cArr, [NUM_LAYERS, 1, HIDDEN_DIM]);

        const out = await lstm.run({ latent: latentTensor, action: actionTensor, h0, c0 });

        setLatent(Array.from(out["next_latent"].data));
        setHData(new Float32Array(out["h1"].data));
        setCData(new Float32Array(out["c1"].data));
      });
    } catch (e) {
      console.error(e);
      setError(String(e));
    }
  };

  const resetGT = () => setGtState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 });
  const resetLatent = () => {
    setLatent(Array(LATENT_DIM).fill(0));
    setHData(null);
    setCData(null);
  };
  const resetPiwm = () => setPiwmState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 });

  const disabled = loading || !vaeEnc || !vaeDec || !lstm || !piwmEnc || !piwmDec;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={styles.h1}>PIWM Visualizer</h1>
            <p style={styles.lead}>
              Side-by-side comparison of <span style={styles.kbd}>Ground Truth</span>,{" "}
              <span style={styles.kbd}>Latent LSTM</span>, and <span style={styles.kbd}>PIWM state↔image</span>.
              Use <b>Sync</b> to align all representations to the same GT observation.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={styles.pill("rgba(34,197,94,0.10)", "rgba(34,197,94,0.28)")}>
              <span style={styles.dot("#22c55e")} /> Ground Truth
            </span>
            <span style={styles.pill("rgba(14,165,233,0.10)", "rgba(14,165,233,0.26)")}>
              <span style={styles.dot("#0ea5e9")} /> LSTM Rollout
            </span>
            <span style={styles.pill("rgba(168,85,247,0.10)", "rgba(168,85,247,0.24)")}>
              <span style={styles.dot("#a855f7")} /> PIWM
            </span>
          </div>
        </div>

        <div style={styles.callout}>
          <b>Recommended flow:</b> Set a clean GT state → <b>Sync GT → VAE + PIWM</b> → apply actions (Left/Right) →
          observe drift. If anything looks off, reset + sync again.
        </div>
      </div>

      {loading && (
        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Loading ONNX models…</div>
          <div style={styles.smallText}>
            If this takes unusually long, confirm the model paths are correct and that the browser is not blocking WASM assets.
          </div>
        </div>
      )}

      {error && <div style={styles.err}>Error: {error}</div>}

      <div style={styles.grid}>
        {/* ===================== GT ===================== */}
        <section style={styles.card}>
          <div style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={styles.dot("#22c55e")} aria-hidden />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Ground Truth</div>
                <div style={styles.smallText}>Physics transition + deterministic renderer</div>
              </div>
            </div>

            <button
              onClick={resetGT}
              style={{ ...styles.btnDanger }}
              type="button"
              aria-label="Reset ground truth"
            >
              Reset
            </button>
          </div>

          {/* hidden render canvases */}
          <canvas ref={gtRenderCanvasRef} width={RENDER_W} height={RENDER_H} style={{ display: "none" }} />
          <canvas ref={gtSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />

          <canvas
            ref={gtBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

          <div style={styles.sliderWrap}>
            <div>
              <div style={styles.sliderLabel}>
                <span>Position</span>
                <span>{gtState.x.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-2.4}
                max={2.4}
                step={0.01}
                value={gtState.x}
                onChange={(e) => setGtState((prev) => ({ ...prev, x: Number(e.target.value) }))}
                style={styles.slider}
              />
            </div>

            <div>
              <div style={styles.sliderLabel}>
                <span>Angle</span>
                <span>{gtState.theta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-3.14159}
                max={3.14159}
                step={0.01}
                value={gtState.theta}
                onChange={(e) => setGtState((prev) => ({ ...prev, theta: Number(e.target.value) }))}
                style={styles.slider}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              onClick={syncGT}
              disabled={disabled}
              style={{ ...styles.btnPrimary, ...(disabled ? styles.btnDisabled : {}) }}
              type="button"
            >
              Sync GT → VAE + PIWM
            </button>

            <div style={styles.smallText}>
              State: x={gtState.x.toFixed(2)}, xDot={gtState.xDot.toFixed(2)}, θ={gtState.theta.toFixed(2)}, θDot=
              {gtState.thetaDot.toFixed(2)}
            </div>
          </div>
        </section>

        {/* ===================== LSTM ===================== */}
        <section style={styles.card}>
          <div style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={styles.dot("#0ea5e9")} aria-hidden />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>LSTM Latent Rollout</div>
                <div style={styles.smallText}>Latent transition (z, a, h/c) → z′</div>
              </div>
            </div>

            <button onClick={resetLatent} style={styles.btn} type="button">
              Reset latent & hidden
            </button>
          </div>

          <canvas ref={latentSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />
          <canvas
            ref={latentBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => stepWithAction(0)}
              disabled={disabled}
              style={{ ...styles.btnPrimary, ...(disabled ? styles.btnDisabled : {}) }}
              type="button"
            >
              Action: Left
            </button>
            <button
              onClick={() => stepWithAction(1)}
              disabled={disabled}
              style={{ ...styles.btnPrimary, ...(disabled ? styles.btnDisabled : {}) }}
              type="button"
            >
              Action: Right
            </button>
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>Latent controls</div>
            <div style={styles.smallText}>
              Edit <span style={styles.kbd}>z[i]</span> manually to probe what directions the decoder uses.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: 16,
                rowGap: 12,
                maxHeight: 420,
                overflowY: "auto",
                paddingRight: 6,
                marginTop: 10,
              }}
            >
              {latent.map((v, i) => (
                <div key={i}>
                  <div style={styles.sliderLabel}>
                    <span>z[{i}]</span>
                    <span>{v.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={-3}
                    max={3}
                    step={0.05}
                    value={v}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLatent((prev) => {
                        const next = [...prev];
                        next[i] = val;
                        return next;
                      });
                    }}
                    style={styles.slider}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== PIWM ===================== */}
        <section style={styles.card}>
          <div style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={styles.dot("#a855f7")} aria-hidden />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>PIWM (state ↔ image)</div>
                <div style={styles.smallText}>Encoder: image → (x, θ) • Decoder: (x, θ) → image</div>
              </div>
            </div>

            <button onClick={resetPiwm} style={styles.btnDanger} type="button">
              Reset
            </button>
          </div>

          <canvas ref={piwmSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />
          <canvas
            ref={piwmBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>State</div>
            <div style={styles.smallText}>
              PIWM state: x={piwmState.x.toFixed(2)}, xDot={piwmState.xDot.toFixed(2)}, θ={piwmState.theta.toFixed(2)}, θDot=
              {piwmState.thetaDot.toFixed(2)}
              <br />
              Decoder input (pos, angle) = ({piwmState.x.toFixed(2)}, {piwmState.theta.toFixed(2)})
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>Actions update PIWM too</div>
              <div style={styles.smallText}>
                Clicking <b>Action: Left/Right</b> also steps PIWM dynamics once (learned parameters). Compare drift vs GT.
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}

