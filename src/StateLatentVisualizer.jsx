import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

import { useUiTheme } from "./components/theme";
import { Card, CardTitleRow } from "./components/Card";
import { Button } from "./components/Button";
import { Dot } from "./components/Pill";
import { CanvasFrame } from "./components/CanvasFrame";
import { PageHeader } from "./components/PageHeader";
import { SliderGrid } from "./components/SliderGrid";

const STATE_DIM = 2;
const IMG_H = 96;
const IMG_W = 96;
const SCALE = 4;

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

  const bctx = bigCanvas.getContext("2d");
  bctx.imageSmoothingEnabled = false;
  bctx.clearRect(0, 0, bigCanvas.width, bigCanvas.height);
  bctx.drawImage(smallCanvas, 0, 0, IMG_W, IMG_H, 0, 0, bigCanvas.width, bigCanvas.height);
}

export default function StateLatentVisualizer() {
  // ---- theme ----
  const styles = useUiTheme({ imgW: IMG_W, imgH: IMG_H, scale: SCALE });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // sliders: expose position + angle
  const [position, setPosition] = useState(0); // state[0]
  const [angle, setAngle] = useState(0); // state[1]

  const smallCanvasRef = useRef(null); // offscreen 96x96
  const bigCanvasRef = useRef(null); // visible 384x384

  // Load ONNX model once
  useEffect(() => {
    let alive = true;

    async function loadModel() {
      try {
        setLoading(true);
        const s = await ort.InferenceSession.create("/decoder_interpretable.onnx");
        if (!alive) return;
        setSession(s);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    loadModel();
    return () => {
      alive = false;
    };
  }, []);

  // Run inference whenever sliders change
  useEffect(() => {
    let alive = true;

    async function runInference() {
      if (!session || !smallCanvasRef.current || !bigCanvasRef.current) return;

      const stateArr = new Float32Array(STATE_DIM);
      stateArr[0] = position;
      stateArr[1] = angle;

      const stateTensor = new ort.Tensor("float32", stateArr, [1, STATE_DIM]);

      try {
        const outputs = await session.run({ state: stateTensor });
        if (!alive) return;

        const xRecon = outputs["image"]; // [1, 3, 96, 96]
        drawCHWFloatToCanvases(xRecon.data, smallCanvasRef.current, bigCanvasRef.current);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(String(e));
      }
    }

    runInference();
    return () => {
      alive = false;
    };
  }, [session, position, angle]);

  const resetState = () => {
    setPosition(0);
    setAngle(0);
  };

  const disabled = loading || !session;

  const subtitle = useMemo(
    () => (
      <>
        Drive the <span style={styles.kbd}>interpretable decoder</span> with a 2D state vector{" "}
        <span style={styles.kbd}>[position, angle]</span> and render the predicted observation.
      </>
    ),
    [styles.kbd]
  );

  return (
    <div style={styles.page}>
      <PageHeader
        styles={styles}
        title="State → Latent Decoder"
        subtitle={subtitle}
        callout={
          <>
            <b>Note:</b> Model input is exactly <span style={styles.kbd}>[pos, angle]</span>. Output is{" "}
            <span style={styles.kbd}>image</span> in CHW float format.
          </>
        }
      />

      {loading && (
        <Card style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Loading decoder_interpretable.onnx…</div>
          <div style={styles.smallText}>If this hangs, confirm the model path and that WASM assets are served.</div>
        </Card>
      )}

      {error && <div style={styles.err}>Error: {error}</div>}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* ===================== Controls ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#2563eb" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Inputs</div>
                <div style={styles.smallText}>state = [pos, angle]</div>
              </div>
            </div>

            <Button variant="danger" styles={styles} onClick={resetState}>
              Reset
            </Button>
          </CardTitleRow>

          <div style={styles.sliderWrap}>
            <SliderGrid
              styles={styles}
              // “compact / generic” usage: no header, just sliders
              title={null}
              description={null}
              columns={2}
              maxHeight={220}
              values={[position, angle]}
              labelForIndex={(i) => (i === 0 ? "Position" : "Angle")}
              formatValue={(v) => Number(v).toFixed(2)}
              rangeForIndex={(i) =>
                i === 0
                  ? { min: -2.14, max: 2.14, step: 0.01, width: 240 }
                  : { min: -3.14159, max: 3.14159, step: 0.01, width: 240 }
              }
              onChangeIndex={(i, val) => {
                if (i === 0) setPosition(val);
                else setAngle(val);
              }}
            />
          </div>

        </Card>

        {/* ===================== Output ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Decoded image</div>
                <div style={styles.smallText}>Output: image (CHW floats → canvas)</div>
              </div>
            </div>
            <Button variant="danger" styles={styles} onClick={resetState}>
              Reset State
            </Button>
          </CardTitleRow>

          {/* offscreen small canvas */}
          <canvas ref={smallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />

          {/* visible upscaled */}
          <CanvasFrame
            canvasRef={bigCanvasRef}
            width={IMG_W * SCALE}
            height={IMG_H * SCALE}
            style={styles.canvasFrame}
          />

        </Card>
      </div>
    </div>
  );
}

