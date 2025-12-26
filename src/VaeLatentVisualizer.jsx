
import React, { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

const LATENT_DIM = 16;
const IMG_H = 96;
const IMG_W = 96;
const SCALE = 4; // upscale factor → 96 * 4 = 384

const UNUSED_LATENTS = [0, 2, 1, 3, 4, 6, 7, 8, 13, 14];

function VaeLatentVisualizer() {
  const [session, setSession] = useState(null);
  const [latent, setLatent] = useState(() => Array(LATENT_DIM).fill(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // small offscreen canvas (96x96)
  const smallCanvasRef = useRef(null);
  // big visible canvas (384x384)
  const bigCanvasRef = useRef(null);

  // Load ONNX model once
  useEffect(() => {
    async function loadModel() {
      try {
        setLoading(true);
        // assumes public/vae_decoder16.onnx → /vae_decoder16.onnx
        const s = await ort.InferenceSession.create("/vae_decoder16.onnx");
        setSession(s);
      } catch (e) {
        console.error(e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    loadModel();
  }, []);

  // Run inference whenever latent changes (and session is ready)
  useEffect(() => {
    async function runInference() {
      if (!session || !smallCanvasRef.current || !bigCanvasRef.current) return;

      // Build latent vector: [1, LATENT_DIM]
      const zData = new Float32Array(LATENT_DIM);
      for (let i = 0; i < LATENT_DIM; i++) {
        zData[i] = latent[i];
      }
      const zTensor = new ort.Tensor("float32", zData, [1, LATENT_DIM]);

      try {
        const outputs = await session.run({ z: zTensor });
        const xRecon = outputs["x_recon"]; // Tensor: [1, 3, 96, 96]
        const data = xRecon.data; // Float32Array

        // --- Draw to small (offscreen) 96x96 canvas ---
        const smallCanvas = smallCanvasRef.current;
        const sctx = smallCanvas.getContext("2d");

        const imageData = sctx.createImageData(IMG_W, IMG_H);
        const rgba = imageData.data;
        const planeSize = IMG_H * IMG_W; // 9216

        for (let y = 0; y < IMG_H; y++) {
          for (let x = 0; x < IMG_W; x++) {
            const idxHW = y * IMG_W + x;

            const r = data[0 * planeSize + idxHW];
            const g = data[1 * planeSize + idxHW];
            const b = data[2 * planeSize + idxHW];

            const idxRGBA = idxHW * 4;
            rgba[idxRGBA + 0] = Math.max(0, Math.min(255, Math.round(r * 255)));
            rgba[idxRGBA + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
            rgba[idxRGBA + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
            rgba[idxRGBA + 3] = 255; // alpha
          }
        }

        sctx.putImageData(imageData, 0, 0);

        // --- Upscale from small canvas to big visible canvas ---
        const bigCanvas = bigCanvasRef.current;
        const bctx = bigCanvas.getContext("2d");

        bctx.imageSmoothingEnabled = false; // no blur
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
      } catch (e) {
        console.error(e);
        setError(String(e));
      }
    }

    runInference();
  }, [session, latent]);

  const handleSliderChange = (idx, value) => {
    setLatent((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const resetLatent = () => {
    setLatent(Array(LATENT_DIM).fill(0));
  };

  const randomLatent = () => {
    // sample z ~ N(0,1) via Box–Muller
    const arr = [];
    for (let i = 0; i < LATENT_DIM; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const r = Math.sqrt(-2.0 * Math.log(Math.max(u1, 1e-8)));
      const theta = 2.0 * Math.PI * u2;
      const z = r * Math.cos(theta);
      arr.push(z);
    }
    setLatent(arr);
  };

  return (
    <div style={{ justifyContent: "center", padding: 16, fontFamily: "sans-serif" }}>
      {loading && <p>Loading ONNX model…</p>}
      {error && (
        <p style={{ color: "red", whiteSpace: "pre-wrap" }}>
          Error: {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Sliders */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 52,
            maxHeight: "100%",
            maxWidth: "100%",
            overflowY: "auto",
          }}
        >
          {latent.map((value, i) => {
            const isUnused = UNUSED_LATENTS.includes(i);

            return (
              <div key={i}>
                <label
                  style={{
                    display: "block",
                    fontSize: 20,
                    marginBottom: 4,
                    fontFamily: "monospace",
                    color: isUnused ? "#888" : "#000",
                  }}
                >
                  z[{i}] = {value.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={value}
                  onChange={(e) => handleSliderChange(i, Number(e.target.value))}
                  style={{
                    width: 200,
                    // accentColor controls slider thumb/track color in modern browsers
                    accentColor: isUnused ? "#888888" : "#2563eb", // grey vs blue
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Canvases */}
        <div>
          {/* offscreen small canvas (96x96) */}
          <p style={{ fontSize: 25, color: "#666", marginBottom: 8 }}>
            Decoded image
          </p>
          <canvas
            ref={smallCanvasRef}
            width={IMG_W}
            height={IMG_H}
            style={{ display: "none" }}
          />
          {/* visible upscaled canvas (96*4 x 96*4) */}
          <canvas
            ref={bigCanvasRef}
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
          <div style={{ marginTop: 20 }}>
            <button onClick={resetLatent} style={{ padding: "8px 16px", fontSize: 25 }}>
              Reset Latent
            </button>
            <button
              onClick={randomLatent}
              style={{ padding: "8px 16px", fontSize: 25, marginLeft: 17 }}
            >
              Random latent
            </button>
          </div>
        </div>

      </div>


    </div>
  );
}

export default VaeLatentVisualizer;

