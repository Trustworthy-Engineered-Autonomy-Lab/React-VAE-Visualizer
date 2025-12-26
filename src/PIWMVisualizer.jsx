// src/PIWMVisualizer.jsx
import React, { useEffect, useRef, useState } from "react";
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

        const [_vaeEnc, _vaeDec, _lstm, _piwmEnc, _piwmDec] =
          await Promise.all([
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
      drawCHWFloatToCanvases(
        xRecon.data,
        latentSmallCanvasRef.current,
        latentBigCanvasRef.current
      );
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

      // NOTE: your piwm decoder input name must be "state" and output "image"
      const out = await piwmDec.run({ state: sTensor });
      if (token !== piwmDecodeTokenRef.current) return;

      const img = out["image"];
      drawCHWFloatToCanvases(
        img.data,
        piwmSmallCanvasRef.current,
        piwmBigCanvasRef.current
      );
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
    // update physics states immediately (UI)
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
        const actionTensor = new ort.Tensor(
          "float32",
          new Float32Array([actionVal]),
          [1, 1]
        );

        let hArr = hData;
        let cArr = cData;
        if (!hArr || !cArr) {
          hArr = new Float32Array(NUM_LAYERS * 1 * HIDDEN_DIM);
          cArr = new Float32Array(NUM_LAYERS * 1 * HIDDEN_DIM);
        }

        const h0 = new ort.Tensor("float32", hArr, [NUM_LAYERS, 1, HIDDEN_DIM]);
        const c0 = new ort.Tensor("float32", cArr, [NUM_LAYERS, 1, HIDDEN_DIM]);

        const out = await lstm.run({
          latent: latentTensor,
          action: actionTensor,
          h0,
          c0,
        });

        setLatent(Array.from(out["next_latent"].data));
        setHData(new Float32Array(out["h1"].data));
        setCData(new Float32Array(out["c1"].data));
      });
    } catch (e) {
      console.error(e);
      setError(String(e));
    }
  };

  const disabled =
    loading || !vaeEnc || !vaeDec || !lstm || !piwmEnc || !piwmDec;

  return (
    <div style={{ justifyContent: 'center', padding: 16, fontFamily: "sans-serif" }}>

      {loading && <p>Loading ONNX models…</p>}
      {error && (
        <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {error}</p>
      )}

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {/* ===================== GT ===================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Ground Truth</h3>

          <canvas ref={gtRenderCanvasRef} width={RENDER_W} height={RENDER_H} style={{ display: "none" }} />
          <canvas ref={gtSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />

          <canvas
            ref={gtBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={{
              width: `${IMG_W * SCALE}px`,
              height: `${IMG_H * SCALE}px`,
              imageRendering: "pixelated",
              border: "1px solid #ccc",
              backgroundColor: "#000",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontFamily: "monospace" }}>
                Position = {gtState.x.toFixed(2)}
              </label>
              <input
                type="range"
                min={-2.4}
                max={2.4}
                step={0.01}
                value={gtState.x}
                onChange={(e) => setGtState((prev) => ({ ...prev, x: Number(e.target.value) }))}
                style={{ width: 220, accentColor: "#2563eb" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "monospace" }}>
                Angle = {gtState.theta.toFixed(2)}
              </label>
              <input
                type="range"
                min={-3.14159}
                max={3.14159}
                step={0.01}
                value={gtState.theta}
                onChange={(e) => setGtState((prev) => ({ ...prev, theta: Number(e.target.value) }))}
                style={{ width: 220, accentColor: "#2563eb" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setGtState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 })}
              style={{ padding: "8px 12px", fontSize: 16 }}
            >
              Reset GT
            </button>
            <button
              onClick={syncGT}
              disabled={disabled}
              style={{ padding: "8px 12px", fontSize: 16 }}
            >
              Sync GT → VAE + PIWM
            </button>
          </div>

          <div style={{ fontSize: 12, color: "#666" }}>
            GT state: (x={gtState.x.toFixed(2)}, xDot={gtState.xDot.toFixed(2)}, θ={gtState.theta.toFixed(2)}, θDot={gtState.thetaDot.toFixed(2)})
          </div>
        </div>

        {/* ===================== LSTM ===================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <h3 style={{ margin: 0 }}>LSTM Latent Rollout</h3>

          <canvas ref={latentSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />
          <canvas
            ref={latentBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={{
              width: `${IMG_W * SCALE}px`,
              height: `${IMG_H * SCALE}px`,
              imageRendering: "pixelated",
              border: "1px solid #ccc",
              backgroundColor: "#000",
            }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => stepWithAction(0)}
              disabled={disabled}
              style={{ padding: "8px 12px", fontSize: 16 }}
            >
              Action: Left
            </button>
            <button
              onClick={() => stepWithAction(1)}
              disabled={disabled}
              style={{ padding: "8px 12px", fontSize: 16 }}
            >
              Action: Right
            </button>
          </div>

          <button
            onClick={() => {
              setLatent(Array(LATENT_DIM).fill(0));
              setHData(null);
              setCData(null);
            }}
            style={{ padding: "8px 12px", fontSize: 16 }}
          >
            Reset latent & hidden
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: 16,
              rowGap: 12,
              maxHeight: 520,
              overflowY: "auto",
              paddingRight: 8,
              marginTop: 6,
            }}
          >
            {latent.map((v, i) => (
              <div key={i}>
                <label style={{ display: "block", fontFamily: "monospace" }}>
                  z[{i}] = {v.toFixed(2)}
                </label>
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
                  style={{ width: 220, accentColor: "#2563eb" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ===================== PIWM ===================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <h3 style={{ margin: 0 }}>PIWM (state ↔ image)</h3>

          <canvas ref={piwmSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />
          <canvas
            ref={piwmBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={{
              width: `${IMG_W * SCALE}px`,
              height: `${IMG_H * SCALE}px`,
              imageRendering: "pixelated",
              border: "1px solid #ccc",
              backgroundColor: "#000",
            }}
          />

          <div style={{ fontSize: 12, color: "#666" }}>
            PIWM state: (x={piwmState.x.toFixed(2)}, xDot={piwmState.xDot.toFixed(2)}, θ={piwmState.theta.toFixed(2)}, θDot={piwmState.thetaDot.toFixed(2)})
            <br />
            Decoder input (pos,angle)=({piwmState.x.toFixed(2)}, {piwmState.theta.toFixed(2)})
          </div>

          <button
            onClick={() => setPiwmState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 })}
            style={{ padding: "8px 12px", fontSize: 16 }}
          >
            Reset PIWM state
          </button>
        </div>
      </div>
    </div>
  );
}

