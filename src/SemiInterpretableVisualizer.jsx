import React, { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

const STATE_DIM = 4;
const IMG_H = 96;
const IMG_W = 96;
const SCALE = 4;

function SemiInterpretableVisualizer() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // sliders: we only expose position + angle
  const [position, setPosition] = useState(0); // state[0]
  const [angle, setAngle] = useState(0);       // state[2]

  const smallCanvasRef = useRef(null); // 96x96
  const bigCanvasRef = useRef(null);   // 384x384

  // Load ONNX model once
  useEffect(() => {
    async function loadModel() {
      try {
        setLoading(true);
        const s = await ort.InferenceSession.create("/state_to_image.onnx");
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

  // Run inference whenever sliders change
  useEffect(() => {
    async function runInference() {
      if (!session || !smallCanvasRef.current || !bigCanvasRef.current) return;

      // Build state vector: [pos, vel, angle, angle_vel]
      // Here we treat sliders as *normalized* values; velocity and angle_vel = 0.
      const stateArr = new Float32Array(STATE_DIM);
      stateArr[0] = position; // pos
      stateArr[1] = 0;
      stateArr[2] = angle;    // angle
      stateArr[3] = 0;

      const stateTensor = new ort.Tensor("float32", stateArr, [1, STATE_DIM]);

      try {
        const outputs = await session.run({ state: stateTensor });
        const xRecon = outputs["x_recon"]; // [1, 3, 96, 96]
        console.log(outputs)
        const data = xRecon.data;          // Float32Array

        // --- Draw 96x96 image into small canvas ---
        const smallCanvas = smallCanvasRef.current;
        const sctx = smallCanvas.getContext("2d");

        const imageData = sctx.createImageData(IMG_W, IMG_H);
        const rgba = imageData.data;
        const planeSize = IMG_H * IMG_W;

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
            rgba[idxRGBA + 3] = 255;
          }
        }

        sctx.putImageData(imageData, 0, 0);

        // --- Upscale into big canvas ---
        const bigCanvas = bigCanvasRef.current;
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
      } catch (e) {
        console.error(e);
        setError(String(e));
      }
    }

    runInference();
  }, [session, position, angle]);

  const resetState = () => {
    setPosition(0);
    setAngle(0);
  };

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      {loading && <p>Loading state_to_image.onnx…</p>}
      {error && (
        <p style={{ color: "red", whiteSpace: "pre-wrap" }}>
          Error: {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Sliders */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 52,
          maxHeight: "100%",
          maxWidth: "100%",
          overflowY: "auto",
        }}>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 18,
                marginBottom: 4,
                fontFamily: "monospace",
              }}
            >
              Position  = {position.toFixed(2)}
            </label>
            <input
              type="range"
              min={-2.14}
              max={2.14}
              step={0.01}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              style={{
                width: 200,
                accentColor: "#2563eb",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 18,
                marginBottom: 4,
                fontFamily: "monospace",
              }}
            >
              Angle = {angle.toFixed(2)}
            </label>
            <input
              type="range"
              min={-3.14159}
              max={3.14159}
              step={0.01}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              style={{
                width: 200,
                accentColor: "#2563eb",
              }}
            />
          </div>


        </div>

        {/* Canvases */}
        <div>

          <p style={{ fontSize: 25, color: "#666", marginBottom: 8 }}>
            Decoded image
          </p>
          <div>
            {/* offscreen small canvas */}
            <canvas
              ref={smallCanvasRef}
              width={IMG_W}
              height={IMG_H}
              style={{ display: "none" }}
            />

            {/* visible upscaled canvas */}
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
            <br />
            <button onClick={resetState} style={{ padding: "8px 16px", marginTop: 12, fontSize: 25 }}>
              Reset State
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default SemiInterpretableVisualizer;
