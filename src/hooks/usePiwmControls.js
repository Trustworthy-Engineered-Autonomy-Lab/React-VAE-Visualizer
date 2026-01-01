
// src/visualizers/piwm/hooks/usePiwmControls.js
import * as ort from "onnxruntime-web";
import { canvasToCHWFloat, IMG_H, IMG_W } from "../utils/canvas";
import { transitionModel, learnedTransitionModel } from "../utils/physics";
import { useEffect } from "react";
export function usePiwmControls({
  vaeEnc,
  piwmEnc,
  lstm,
  queueRef,
  gtSmallCanvasRef,

  latent,
  setLatent,
  hData,
  setHData,
  cData,
  setCData,

  setGtState,
  setPiwmState,

  onError,
  LATENT_DIM,
  NUM_LAYERS,
  HIDDEN_DIM,
}) {
  const syncGT = async () => {
    if (!vaeEnc || !piwmEnc || !gtSmallCanvasRef.current) return;

    try {
      await queueRef.current(async () => {
        const chw = canvasToCHWFloat(gtSmallCanvasRef.current);
        const xTensor = new ort.Tensor("float32", chw, [1, 3, IMG_H, IMG_W]);

        const outV = await vaeEnc.run({ x: xTensor });
        const mu = outV["mu"];

        const outP = await piwmEnc.run({ x: xTensor });
        const st2 = outP["state"];

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
      onError?.(String(e));
    }
  };

  const stepWithAction = async (actionVal) => {
    // UI physics updates happen immediately
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
      await queueRef.current(async () => {
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
      onError?.(String(e));
    }
  };

  useEffect(() => {
    syncGT();
  }, [vaeEnc, piwmEnc]);

  return { syncGT, stepWithAction };
}
