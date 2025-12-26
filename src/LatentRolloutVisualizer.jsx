// src/LatentRolloutVisualizer.jsx
import React, { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

const IMG_H = 96;
const IMG_W = 96;
const SCALE = 4;

const LATENT_DIM = 16;

// must match exported lstm_latent_step.onnx
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

// ---------- Ground-truth transition model (match python) ----------
function transitionModel(state, action) {
  const x = state.x;
  const xDot = state.xDot;
  const theta = state.theta;
  const thetaDot = state.thetaDot;

  const force = action === 1 ? FORCE_MAG : -FORCE_MAG;

  const costheta = Math.cos(theta);
  const sintheta = Math.sin(theta);

  const temp = (force + POLEMASS_LENGTH * thetaDot * thetaDot * sintheta) / TOTAL_MASS;

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
function renderObservationTo96({
  position,
  angle,
  renderCanvas,
  smallCanvas96,
}) {
  const rctx = renderCanvas.getContext("2d");
  const sctx = smallCanvas96.getContext("2d");

  // ---- python: surf.fill((255,255,255)) ----
  rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.clearRect(0, 0, RENDER_W, RENDER_H);
  rctx.fillStyle = "#ffffff";
  rctx.fillRect(0, 0, RENDER_W, RENDER_H);

  // python parameters
  const worldWidth = X_THRESHOLD * 2;
  const scale = RENDER_W / worldWidth;
  const polewidth = 10.0;
  const polelen = scale * (2 * LENGTH);
  const cartwidth = 50.0;
  const cartheight = 30.0;

  // cart coords & placement
  const l = -cartwidth / 2;
  const r = cartwidth / 2;
  const t = cartheight / 2;
  const b = -cartheight / 2;
  const axleoffset = cartheight / 4.0;

  const cartx = position * scale + RENDER_W / 2.0;
  const carty = RENDER_H / 2.0;

  // ---- python flips vertically AFTER drawing:
  // surf = pygame.transform.flip(surf, False, True)
  // We'll simulate that by drawing everything in a flipped-y coordinate system
  // so final pixels match.
  rctx.save();
  rctx.translate(0, RENDER_H);
  rctx.scale(1, -1);

  // ---- cart polygon (black) ----
  const cartPts = [
    { x: l + cartx, y: b + carty },
    { x: l + cartx, y: t + carty },
    { x: r + cartx, y: t + carty },
    { x: r + cartx, y: b + carty },
  ];
  fillPolygon(rctx, cartPts, "#000000", "#000000");

  // ---- pole polygon (brown) rotated around (cartx, carty+axleoffset)
  // python uses coords: (-polew/2, -polew/2), (-polew/2, polelen-polew/2), ...
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

  // python: rotate_rad(-angle)
  const polePts = localPole.map((p) => {
    const q = rot(p.x, p.y, -angle);
    return { x: q.x + anchorX, y: q.y + anchorY };
  });

  fillPolygon(rctx, polePts, "rgb(202,152,101)", "rgb(202,152,101)");

  // ---- axle (blue circle) ----
  rctx.beginPath();
  rctx.arc(anchorX, anchorY, polewidth / 2, 0, Math.PI * 2);
  rctx.fillStyle = "rgb(129,132,203)";
  rctx.fill();
  rctx.strokeStyle = "rgb(129,132,203)";
  rctx.stroke();

  // ---- ground line: gfxdraw.hline(surf, 0, render_width, int(carty), (0,0,0))
  rctx.beginPath();
  rctx.moveTo(0, carty);
  rctx.lineTo(RENDER_W, carty);
  rctx.strokeStyle = "#000000";
  rctx.lineWidth = 1;
  rctx.stroke();

  rctx.restore();

  // ---- resize to 96x96 (cv2.INTER_AREA-ish). drawImage does decent area downsample.
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
    const r = chwData[0 * planeSize + i];
    const g = chwData[1 * planeSize + i];
    const b = chwData[2 * planeSize + i];
    const idx = i * 4;
    rgba[idx + 0] = Math.max(0, Math.min(255, Math.round(r * 255)));
    rgba[idx + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    rgba[idx + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
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

export default function LatentRolloutVisualizer() {
  // ONNX sessions
  const [encoderSession, setEncoderSession] = useState(null);
  const [decoderSession, setDecoderSession] = useState(null);
  const [lstmSession, setLstmSession] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ground-truth state (only changes on slider OR button press)
  const [gtState, setGtState] = useState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 });

  // Latent + hidden
  const [latent, setLatent] = useState(() => Array(LATENT_DIM).fill(0));
  const [hData, setHData] = useState(null);
  const [cData, setCData] = useState(null);

  // refs
  const gtRenderCanvasRef = useRef(null); // 600x400 offscreen
  const gtSmallCanvasRef = useRef(null);  // 96x96 offscreen
  const gtBigCanvasRef = useRef(null);    // visible 384x384

  const latentSmallCanvasRef = useRef(null);
  const latentBigCanvasRef = useRef(null);

  // load models once
  useEffect(() => {
    async function loadModels() {
      try {
        setLoading(true);
        const [enc, dec, lstm] = await Promise.all([
          ort.InferenceSession.create("/vae_encoder16.onnx"),
          ort.InferenceSession.create("/vae_decoder16.onnx"),
          ort.InferenceSession.create("/lstm_latent_step.onnx"),
        ]);
        setEncoderSession(enc);
        setDecoderSession(dec);
        setLstmSession(lstm);
      } catch (e) {
        console.error(e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  // GT render whenever gtState changes (sliders or action button)
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

  // latent decode whenever latent changes
  useEffect(() => {
    async function decodeLatent() {
      if (!decoderSession || !latentSmallCanvasRef.current || !latentBigCanvasRef.current) return;

      try {
        const z = new Float32Array(LATENT_DIM);
        for (let i = 0; i < LATENT_DIM; i++) z[i] = latent[i];
        const zTensor = new ort.Tensor("float32", z, [1, LATENT_DIM]);

        const out = await decoderSession.run({ z: zTensor });
        const xRecon = out["x_recon"];
        drawCHWFloatToCanvases(
          xRecon.data,
          latentSmallCanvasRef.current,
          latentBigCanvasRef.current
        );
      } catch (e) {
        console.error(e);
        setError(String(e));
      }
    }
    decodeLatent();
  }, [decoderSession, latent]);

  const syncGTToLatent = async () => {
    if (!encoderSession || !gtSmallCanvasRef.current) return;

    try {
      const chw = canvasToCHWFloat(gtSmallCanvasRef.current);
      const xTensor = new ort.Tensor("float32", chw, [1, 3, IMG_H, IMG_W]);

      const out = await encoderSession.run({ x: xTensor });
      const mu = out["mu"];
      setLatent(Array.from(mu.data));
      setHData(null);
      setCData(null);
    } catch (e) {
      console.error(e);
      setError(String(e));
    }
  };

  const stepWithAction = async (actionVal) => {
    // 1) update GT state (ONLY HERE for action)
    setGtState((prev) => transitionModel(prev, actionVal));

    // 2) update LSTM latent (ONLY HERE for action)
    if (!lstmSession) return;

    try {
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

      const out = await lstmSession.run({
        latent: latentTensor,
        action: actionTensor,
        h0,
        c0,
      });

      setLatent(Array.from(out["next_latent"].data));
      setHData(new Float32Array(out["h1"].data));
      setCData(new Float32Array(out["c1"].data));
    } catch (e) {
      console.error(e);
      setError(String(e));
    }
  };

  const disabled = loading || !encoderSession || !decoderSession || !lstmSession;

  return (

    <div>
      <div>

        {loading && <p>Loading ONNX models…</p>}
        {error && <p style={{ color: "red", whiteSpace: "pre-wrap" }}>Error: {error}</p>}
      </div>
      <div style={{ padding: 16, fontFamily: "sans-serif", display: "flex", flexDirection: "row" }}>


        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexDirection: "column" }}>
          {/* LEFT: Ground truth */}
          <div>
            <h3>Ground Truth</h3>
            {/* offscreen render canvases */}
            <canvas ref={gtRenderCanvasRef} width={RENDER_W} height={RENDER_H} style={{ display: "none" }} />
            <canvas ref={gtSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />

            {/* visible upscaled */}
            <p style={{ color: "#666", marginTop: 12 }}>Observation (96×96 upscaled)</p>
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

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                onClick={() => setGtState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 })}
                style={{ padding: "8px 12px", fontSize: 18 }}
              >
                Reset GT
              </button>
              <button
                onClick={syncGTToLatent}
                disabled={disabled}
                style={{ padding: "8px 12px", fontSize: 18 }}
              >
                Sync GT image → latent
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              GT full state: (x={gtState.x.toFixed(2)}, xDot={gtState.xDot.toFixed(2)}, θ={gtState.theta.toFixed(2)}, θDot={gtState.thetaDot.toFixed(2)})
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
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
                onChange={(e) => {
                  const x = Number(e.target.value);
                  // slider change updates GT state (as you wanted)
                  setGtState((prev) => ({ ...prev, x }));
                }}
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
                onChange={(e) => {
                  const theta = Number(e.target.value);
                  // slider change updates GT state (as you wanted)
                  setGtState((prev) => ({ ...prev, theta }));
                }}
                style={{ width: 220, accentColor: "#2563eb" }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: LSTM */}
        <div style={{ marginLeft: "100px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>

          <h3 style={{ padding: 16, margin: 0 }}>LSTM Latent Rollout</h3>
          <p style={{ color: "#666", margin: 0 }}>Decoded image (latent)</p>
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

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <button
              onClick={() => stepWithAction(0)}
              disabled={disabled}
              style={{ padding: "8px 12px", fontSize: 18 }}
            >
              Action: Left
            </button>
            <button
              onClick={() => stepWithAction(1)}
              disabled={disabled}
              style={{ padding: "8px 12px", fontSize: 18 }}
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
            style={{ padding: "8px 12px", fontSize: 18 }}
          >
            Reset latent & hidden
          </button>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: 18,
              rowGap: 14,
              maxHeight: 520,
              overflowY: "auto",
              paddingRight: 8,
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
      </div>
    </div>
  );
}

