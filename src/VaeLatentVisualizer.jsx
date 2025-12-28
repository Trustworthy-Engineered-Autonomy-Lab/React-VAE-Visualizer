import React, { useMemo, useRef, useState } from "react";

import { useOrtRuntime } from "./hooks/useOrtRuntime";
import { useRunQueue } from "./hooks/useRunQueue";
import { useVaeDecoderOnly } from "./hooks/useVaeDecoderOnly";
import { useVaeDecode } from "./hooks/useVaeDecode";

import { IMG_H, IMG_W } from "./utils/canvas";

import { useUiTheme } from "./components/theme";
import { Card, CardTitleRow } from "./components/Card";
import { Button } from "./components/Button";
import { Dot } from "./components/Pill";
import { CanvasFrame } from "./components/CanvasFrame";
import { PageHeader } from "./components/PageHeader";
import { SliderGrid } from "./components/SliderGrid";

const LATENT_DIM = 16;
const SCALE = 4;

const UNUSED_LATENTS = [0, 2, 1, 3, 4, 6, 7, 8, 13, 14];

function sampleStandardNormal() {
  // Box–Muller
  const u1 = Math.max(Math.random(), 1e-8);
  const u2 = Math.random();
  const r = Math.sqrt(-2.0 * Math.log(u1));
  const theta = 2.0 * Math.PI * u2;
  return r * Math.cos(theta);
}

export default function VaeLatentVisualizer() {
  // ORT runtime config (same as PIWM)
  useOrtRuntime();

  // Theme (shared look)
  const styles = useUiTheme({ imgW: IMG_W, imgH: IMG_H, scale: SCALE });

  // One global queue for ORT runs
  const ortQueueRef = useRunQueue();

  // Decoder-only model loader
  const { vaeDec: session, loading, error, setError } = useVaeDecoderOnly();

  const [latent, setLatent] = useState(() => Array(LATENT_DIM).fill(0));

  // canvases
  const smallCanvasRef = useRef(null);
  const bigCanvasRef = useRef(null);

  // Decode on latent change
  useVaeDecode({
    vaeDec: session,
    latent,
    queueRef: ortQueueRef,
    smallRef: smallCanvasRef,
    bigRef: bigCanvasRef,
    onError: (msg) => setError?.(msg),
  });

  const disabled = loading || !session;

  const resetLatent = () => setLatent(Array(LATENT_DIM).fill(0));

  const randomLatent = () => {
    const arr = Array.from({ length: LATENT_DIM }, () => sampleStandardNormal());
    setLatent(arr);
  };

  const onChangeLatent = (i, val) => {
    setLatent((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const subtitle = useMemo(
    () => (
      <>
        Probe the decoder by manipulating <span style={styles.kbd}>z</span> directly. Dimensions marked as{" "}
        <span style={styles.kbd}>unused</span> are de-emphasized.
      </>
    ),
    [styles.kbd]
  );

  return (
    <div style={styles.page}>
      <PageHeader
        styles={styles}
        title="VAE Latent Visualizer"
        subtitle={subtitle}
        callout={
          <>
            <b>Flow:</b> drag sliders → decoder renders instantly. Use <b>Random latent</b> to sample z ~ N(0,1).
          </>
        }
      />

      {loading && (
        <Card style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Loading ONNX model…</div>
          <div style={styles.smallText}>
            If this takes unusually long, check model paths and whether the browser is blocking WASM assets.
          </div>
        </Card>
      )}

      {error && <div style={styles.err}>Error: {error}</div>}

      <div style={{ ...styles.grid, gridTemplateColumns: "1fr 1fr" }}>
        {/* ===================== Controls ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#0ea5e9" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Latent controls</div>
                <div style={styles.smallText}>Edit z[i] and observe decoded pixels</div>
              </div>
            </div>
          </CardTitleRow>

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <Button styles={styles} variant="primary" onClick={randomLatent} disabled={disabled}>
              Random latent
            </Button>
            <Button variant="danger" styles={styles} onClick={resetLatent} disabled={disabled}>
              Reset latent
            </Button>
          </div>

          <SliderGrid
            styles={styles}
            latent={latent}
            onChangeLatent={onChangeLatent}
            unusedIndices={UNUSED_LATENTS}
            description={
              <>
                “Unused” dims the control and changes the slider accent to gray (still editable).
              </>
            }
          />
        </Card>

        {/* ===================== Output ===================== */}
        <Card style={styles.card}>
          <CardTitleRow style={styles.titleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot styles={styles} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 850, letterSpacing: -0.2 }}>Decoded image</div>
                <div style={styles.smallText}>Decoder output rendered at 96×96 then upscaled</div>
              </div>
            </div>
          </CardTitleRow>

          {/* offscreen small canvas */}
          <canvas ref={smallCanvasRef} width={IMG_W} height={IMG_H} style={{ display: "none" }} />

          {/* visible upscaled canvas */}
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

