import React, { useEffect, useMemo, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

import { useUiTheme } from "./components/theme";
import { Card, CardTitleRow } from "./components/Card";
import { Button } from "./components/Button";
import { Dot } from "./components/Pill";
import { CanvasFrame } from "./components/CanvasFrame";
import { SliderGrid } from "./components/SliderGrid";
import { PageHeader } from "./components/PageHeader";

const STATE_DIM = 4;
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

export default function SemiInterpretableVisualizer() {
  // ---- theme ----
  const styles = useUiTheme({ imgW: IMG_W, imgH: IMG_H, scale: SCALE });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // sliders: expose position + angle
  const [position, setPosition] = useState(0); // state[0]
  const [angle, setAngle] = useState(0); // state[2]

  const smallCanvasRef = useRef(null); // 96x96 (offscreen)
  const bigCanvasRef = useRef(null); // 384x384 (visible)

  // Load ONNX model once
  useEffect(() => {
    let alive = true;

    async function loadModel() {
      try {
        setLoading(true);
        const s = await ort.InferenceSession.create("/state_to_image.onnx");
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

      // Build state vector: [pos, vel, angle, angle_vel]
      const stateArr = new Float32Array(STATE_DIM);
      stateArr[0] = position;
      stateArr[1] = 0;
      stateArr[2] = angle;
      stateArr[3] = 0;

      const stateTensor = new ort.Tensor("float32", stateArr, [1, STATE_DIM]);

      try {
        const outputs = await session.run({ state: stateTensor });
        if (!alive) return;

        const xRecon = outputs["x_recon"]; // [1, 3, 96, 96]
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
        Manipulate <span style={styles.kbd}>position</span> and <span style={styles.kbd}>angle</span>, then decode the
        corresponding observation using the <span style={styles.kbd}>state → image</span> model.
      </>
    ),
    [styles.kbd]
  );

  return (
    <div style={styles.page}>
      <PageHeader
        styles={styles}
        title="Semi-Interpretable State Decoder"
        subtitle={subtitle}
        callout={
          <>
            <b>Tip:</b> position/angle are fed into the state vector with velocity terms set to 0. Use{" "}
            <b>Reset</b> to return to the origin quickly.
          </>
        }
      />

      {loading && (
        <Card style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Loading state_to_image.onnx…</div>
          <div style={styles.smallText}>If this hangs, confirm the model path and that WASM assets are served.</div>
        </Card>
      )}

      {error && <div style={styles.err}>Error: {error}</div>}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: "1fr 1fr", // 2-col layout for this visualizer
        }}
      >
        {/* ===================== Controls ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#2563eb" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>State controls</div>
                <div style={styles.smallText}>Decoder input: (pos, vel=0, angle, angleVel=0)</div>
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

          <div style={{ marginTop: 12 }}>
            <div style={{ ...styles.smallText, marginTop: 10 }}>
              State vector fed to model:
              <br />
              <span style={styles.kbd}>
                [{position.toFixed(2)}, 0.00, {angle.toFixed(2)}, 0.00]
              </span>
            </div>
          </div>
        </Card>

        {/* ===================== Output ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Decoded image</div>
                <div style={styles.smallText}>Model output: x_recon (CHW → canvas)</div>
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

