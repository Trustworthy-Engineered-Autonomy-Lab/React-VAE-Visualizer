// src/LatentRolloutVisualizer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

import { useUiTheme } from "./components/theme";
import { Card, CardTitleRow } from "./components/Card";
import { Button } from "./components/Button";
import { Dot } from "./components/Pill";
import { CanvasFrame } from "./components/CanvasFrame";
import { PageHeader } from "./components/PageHeader";
import { SliderGrid } from "./components/SliderGrid";

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

  sctx.imageSmoothingEnabled = true;
  sctx.clearRect(0, 0, IMG_W, IMG_H);
  sctx.drawImage(renderCanvas, 0, 0, RENDER_W, RENDER_H, 0, 0, IMG_W, IMG_H);
}

function blitUpscale(smallCanvas, bigCanvas) {
  const bctx = bigCanvas.getContext("2d");
  bctx.imageSmoothingEnabled = false;
  bctx.clearRect(0, 0, bigCanvas.width, bigCanvas.height);
  bctx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, 0, 0, bigCanvas.width, bigCanvas.height);
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
  // ---- theme ----
  const styles = useUiTheme({ imgW: IMG_W, imgH: IMG_H, scale: SCALE });

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
  const gtSmallCanvasRef = useRef(null); // 96x96 offscreen
  const gtBigCanvasRef = useRef(null); // visible 384x384

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

        drawCHWFloatToCanvases(xRecon.data, latentSmallCanvasRef.current, latentBigCanvasRef.current);
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

  const resetGT = () => setGtState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 });
  const resetLatent = () => {
    setLatent(Array(LATENT_DIM).fill(0));
    setHData(null);
    setCData(null);
  };

  const disabled = loading || !encoderSession || !decoderSession || !lstmSession;

  const subtitle = useMemo(
    () => (
      <>
        Compare <span style={styles.kbd}>Ground Truth</span> observation rendering against <span style={styles.kbd}>LSTM</span>{" "}
        latent rollout decoded back to pixels. Use <b>Sync</b> to initialize latent from the GT image.
      </>
    ),
    [styles.kbd]
  );

  return (
    <div style={styles.page}>
      <PageHeader
        styles={styles}
        title="Latent Rollout Visualizer"
        subtitle={subtitle}
        callout={
          <>
            <b>Flow:</b> set GT sliders → <b>Sync GT image → latent</b> → step actions → compare decoded drift vs GT.
          </>
        }
      />

      {loading && (
        <Card style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Loading ONNX models…</div>
          <div style={styles.smallText}>If loading hangs, double-check model paths and WASM asset delivery.</div>
        </Card>
      )}

      {error && <div style={styles.err}>Error: {error}</div>}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: "1fr 1fr", // this page has 2 columns, not 3
        }}
      >
        {/* ===================== GT ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Ground Truth</div>
                <div style={styles.smallText}>Deterministic renderer driven by the GT state</div>
              </div>
            </div>

            <Button variant="danger" styles={styles} onClick={resetGT}>
              Reset
            </Button>
          </CardTitleRow>

          {/* hidden render canvases */}
          <canvas ref={gtRenderCanvasRef} width={RENDER_W} height={RENDER_H} style={{ display: "none" }} />
          <canvas ref={gtSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />

          <CanvasFrame
            canvasRef={gtBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Button variant="primary" styles={styles} onClick={syncGTToLatent} disabled={disabled}>
              Sync GT image → latent
            </Button>

            <div style={styles.smallText}>
              GT full state: (x={gtState.x.toFixed(2)}, xDot={gtState.xDot.toFixed(2)}, θ={gtState.theta.toFixed(2)}, θDot=
              {gtState.thetaDot.toFixed(2)})
            </div>
          </div>


          <SliderGrid
            styles={styles}
            title={null}
            description={null}
            columns={2}
            maxHeight={220}
            values={[gtState.x, gtState.theta]}
            labelForIndex={(i) => (i === 0 ? "Position" : "Angle")}
            formatValue={(v) => Number(v).toFixed(2)}
            rangeForIndex={(i) =>
              i === 0
                ? { min: -2.4, max: 2.4, step: 0.01, width: 240 }
                : { min: -3.14159, max: 3.14159, step: 0.01, width: 240 }
            }
            onChangeIndex={(i, val) => {
              if (i === 0) setGtState((prev) => ({ ...prev, x: val }));
              else setGtState((prev) => ({ ...prev, theta: val }));
            }}
          />

        </Card>

        {/* ===================== LSTM ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#0ea5e9" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>LSTM Latent Rollout</div>
                <div style={styles.smallText}>Latent transition + VAE decoder back to pixels</div>
              </div>
            </div>

            <Button variant="danger" styles={styles} onClick={resetLatent}>
              Reset latent & hidden
            </Button>
          </CardTitleRow>

          <canvas ref={latentSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />
          <CanvasFrame
            canvasRef={latentBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Button variant="primary" styles={styles} onClick={() => stepWithAction(0)} disabled={disabled}>
              Action: Left
            </Button>
            <Button variant="primary" styles={styles} onClick={() => stepWithAction(1)} disabled={disabled}>
              Action: Right
            </Button>
          </div>

          <SliderGrid
            styles={styles}
            latent={latent}
            onChangeLatent={(i, val) => {
              setLatent((prev) => {
                const next = [...prev];
                next[i] = val;
                return next;
              });
            }}
          />
        </Card>
      </div>
    </div>
  );
}

