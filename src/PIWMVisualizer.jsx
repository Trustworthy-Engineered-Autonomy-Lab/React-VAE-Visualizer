import React, { useEffect, useMemo, useRef, useState } from "react";

import { useOrtRuntime } from "./hooks/useOrtRuntime";
import { usePiwmModels } from "./hooks/usePiwmModels";
import { useRunQueue } from "./hooks/useRunQueue";
import { useVaeDecode } from "./hooks/useVaeDecode";
import { usePiwmDecode } from "./hooks/usePiwmDecode";
import { usePiwmControls } from "./hooks/usePiwmControls";

import { IMG_H, IMG_W, blitUpscale } from "./utils/canvas";
import { renderObservationTo96 } from "./utils/render.js";

import { useUiTheme } from "./components/theme";
import { Card, CardTitleRow } from "./components/Card";
import { Button } from "./components/Button";
import { Pill, Dot } from "./components/Pill";
import { CanvasFrame } from "./components/CanvasFrame";
import { PageHeader } from "./components/PageHeader";
import { SliderGrid } from "./components/SliderGrid";

const SCALE = 4;

const LATENT_DIM = 16;
// LSTM ONNX must match
const NUM_LAYERS = 2;
const HIDDEN_DIM = 128;

// render canvas (match python)
const RENDER_W = 600;
const RENDER_H = 400;



export default function PIWMVisualizer() {
  // ---- ORT runtime config ----
  useOrtRuntime();

  // ---- models ----
  const { vaeEnc, vaeDec, lstm, piwmEnc, piwmDec, loading, error, setError } = usePiwmModels();

  // ---- theme ----
  const styles = useUiTheme({ imgW: IMG_W, imgH: IMG_H, scale: SCALE });

  // ---- state: Ground truth full state ----
  const [gtState, setGtState] = useState({
    x: 0,
    xDot: 0,
    theta: 0,
    thetaDot: 0,
  });

  // ---- state: LSTM latent + hidden ----
  const [latent, setLatent] = useState(() => Array(LATENT_DIM).fill(0));
  const [hData, setHData] = useState(null);
  const [cData, setCData] = useState(null);

  // ---- state: PIWM state (decoder uses only x/theta) ----
  const [piwmState, setPiwmState] = useState({
    x: 0,
    xDot: 0,
    theta: 0,
    thetaDot: 0,
  });

  // ---- refs - GT renderer ----
  const gtRenderCanvasRef = useRef(null);
  const gtSmallCanvasRef = useRef(null);
  const gtBigCanvasRef = useRef(null);

  // ---- refs - VAE latent decoded image ----
  const latentSmallCanvasRef = useRef(null);
  const latentBigCanvasRef = useRef(null);

  // ---- refs - PIWM decoded image ----
  const piwmSmallCanvasRef = useRef(null);
  const piwmBigCanvasRef = useRef(null);

  // IMPORTANT: ONE global queue for *all* ORT runs (prevents Session already started)
  const ortQueueRef = useRunQueue();

  // ---- GT render effect ----
  useEffect(() => {
    if (!gtRenderCanvasRef.current || !gtSmallCanvasRef.current || !gtBigCanvasRef.current) return;

    renderObservationTo96({
      position: gtState.x,
      angle: gtState.theta,
      renderCanvas: gtRenderCanvasRef.current,
      smallCanvas96: gtSmallCanvasRef.current,
      renderW: RENDER_W,
      renderH: RENDER_H,
    });

    blitUpscale(gtSmallCanvasRef.current, gtBigCanvasRef.current);
  }, [gtState]);

  // ---- decode hooks ----
  useVaeDecode({
    vaeDec,
    latent,
    queueRef: ortQueueRef,
    smallRef: latentSmallCanvasRef,
    bigRef: latentBigCanvasRef,
    onError: (msg) => setError?.(msg),
  });

  usePiwmDecode({
    piwmDec,
    piwmState,
    queueRef: ortQueueRef,
    smallRef: piwmSmallCanvasRef,
    bigRef: piwmBigCanvasRef,
    onError: (msg) => setError?.(msg),
  });

  // ---- controls (sync + action stepping) ----
  const { syncGT, stepWithAction } = usePiwmControls({
    vaeEnc,
    piwmEnc,
    lstm,
    queueRef: ortQueueRef,
    gtSmallCanvasRef,

    latent,
    setLatent,
    hData,
    setHData,
    cData,
    setCData,

    setGtState,
    setPiwmState,

    onError: (msg) => setError?.(msg),

    LATENT_DIM,
    NUM_LAYERS,
    HIDDEN_DIM,
  });

  // ---- resets ----
  const resetGT = () => setGtState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 });
  const resetLatent = () => {
    setLatent(Array(LATENT_DIM).fill(0));
    setHData(null);
    setCData(null);
  };
  const resetPiwm = () => setPiwmState({ x: 0, xDot: 0, theta: 0, thetaDot: 0 });

  const disabled = loading || !vaeEnc || !vaeDec || !lstm || !piwmEnc || !piwmDec;

  const subtitle = useMemo(
    () => (
      <>
        Side-by-side comparison of <span style={styles.kbd}>Ground Truth</span>,{" "}
        <span style={styles.kbd}>Latent LSTM</span>, and <span style={styles.kbd}>PIWM state↔image</span>. Use{" "}
        <b>Sync</b> to align all representations to the same GT observation.
      </>
    ),
    [styles.kbd]
  );

  const rightBadges = useMemo(
    () => (
      <>
        <Pill styles={styles} bg="rgba(34,197,94,0.10)" border="rgba(34,197,94,0.28)" dotColor="#22c55e">
          Ground Truth
        </Pill>
        <Pill styles={styles} bg="rgba(14,165,233,0.10)" border="rgba(14,165,233,0.26)" dotColor="#0ea5e9">
          LSTM Rollout
        </Pill>
        <Pill styles={styles} bg="rgba(168,85,247,0.10)" border="rgba(168,85,247,0.24)" dotColor="#a855f7">
          PIWM
        </Pill>
      </>
    ),
    [styles]
  );

  return (
    <div style={styles.page}>
      <PageHeader
        styles={styles}
        title="PIWM Visualizer"
        subtitle={subtitle}
        right={rightBadges}
        callout={
          <>
            <b>Recommended flow:</b> Set a clean GT state → <b>Sync GT → VAE + PIWM</b> → apply actions (Left/Right) →
            observe drift. If anything looks off, reset + sync again.
          </>
        }
      />

      {loading && (
        <Card style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Loading ONNX models…</div>
          <div style={styles.smallText}>
            If this takes unusually long, confirm the model paths are correct and that the browser is not blocking WASM
            assets.
          </div>
        </Card>
      )}

      {error && <div style={styles.err}>Error: {error}</div>}

      <div style={styles.grid}>
        {/* ===================== GT ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Ground Truth</div>
                <div style={styles.smallText}>Physics transition + deterministic renderer</div>
              </div>
            </div>

            <Button variant="danger" styles={styles} onClick={resetGT} aria-label="Reset ground truth">
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
            <Button variant="primary" styles={styles} onClick={syncGT} disabled={disabled}>
              Sync GT → VAE + PIWM
            </Button>

            <div style={styles.smallText}>
              State: x={gtState.x.toFixed(2)}, xDot={gtState.xDot.toFixed(2)}, θ={gtState.theta.toFixed(2)}, θDot=
              {gtState.thetaDot.toFixed(2)}
            </div>
          </div>

          <SliderGrid
            styles={styles}
            title={null}
            description={null}
            columns={2}
            maxHeight={220} // small since it's only 2 sliders; optional
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
                <div style={styles.smallText}>Latent transition (z, a, h/c) → z′</div>
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

        {/* ===================== PIWM ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#a855f7" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>PIWM (state ↔ image)</div>
                <div style={styles.smallText}>Encoder: image → (x, θ) • Decoder: (x, θ) → image</div>
              </div>
            </div>

            <Button variant="danger" styles={styles} onClick={resetPiwm}>
              Reset
            </Button>
          </CardTitleRow>

          <canvas ref={piwmSmallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />
          <CanvasFrame
            canvasRef={piwmBigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>State</div>
            <div style={styles.smallText}>
              PIWM state: x={piwmState.x.toFixed(2)}, xDot={piwmState.xDot.toFixed(2)}, θ={piwmState.theta.toFixed(2)},
              θDot={piwmState.thetaDot.toFixed(2)}
              <br />
              Decoder input (pos, angle) = ({piwmState.x.toFixed(2)}, {piwmState.theta.toFixed(2)})
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>Actions update PIWM too</div>
              <div style={styles.smallText}>
                Clicking <b>Action: Left/Right</b> also steps PIWM dynamics once (learned parameters). Compare drift vs
                GT.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

