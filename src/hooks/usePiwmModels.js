
// src/visualizers/piwm/hooks/usePiwmModels.js
import { useEffect, useState } from "react";
import * as ort from "onnxruntime-web";

export function usePiwmModels() {
  const [models, setModels] = useState({
    vaeEnc: null,
    vaeDec: null,
    lstm: null,
    piwmEnc: null,
    piwmDec: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const sessOpts = { executionProviders: ["wasm"] };

        const [vaeEnc, vaeDec, lstm, piwmEnc, piwmDec] = await Promise.all([
          ort.InferenceSession.create("/vae_encoder16.onnx", sessOpts),
          ort.InferenceSession.create("/vae_decoder16.onnx", sessOpts),
          ort.InferenceSession.create("/lstm_latent_step.onnx", sessOpts),
          ort.InferenceSession.create("/piwm_encoder.onnx", sessOpts),
          ort.InferenceSession.create("/piwm_decoder.onnx", sessOpts),
        ]);

        if (cancelled) return;
        setModels({ vaeEnc, vaeDec, lstm, piwmEnc, piwmDec });
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...models, loading, error, setError };
}
