
import { useMemo } from "react";

export function useUiTheme({ imgW, imgH, scale }) {
  return useMemo(() => {
    const font =
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"';

    const card = {
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.86)",
      boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
      padding: 16,
    };

    const titleRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };

    const dot = (c) => ({
      width: 9,
      height: 9,
      borderRadius: 999,
      background: c,
      boxShadow: "0 0 0 3px rgba(15,23,42,0.05)",
    });

    const pill = (bg, border) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderRadius: 999,
      border: `1px solid ${border}`,
      background: bg,
      fontSize: 12.5,
      color: "#0f172a",
      whiteSpace: "nowrap",
    });

    const baseBtn = {
      padding: "9px 12px",
      fontSize: 13.5,
      borderRadius: 12,
      border: "1px solid rgba(15,23,42,0.14)",
      background: "rgba(255,255,255,0.78)",
      color: "#0f172a",
      cursor: "pointer",
      boxShadow: "0 10px 18px rgba(15,23,42,0.04)",
      userSelect: "none",
    };

    const btnVariants = {
      default: baseBtn,
      primary: {
        ...baseBtn,
        border: "1px solid rgba(37,99,235,0.28)",
        background: "linear-gradient(180deg, rgba(59,130,246,0.16), rgba(59,130,246,0.07))",
      },
      danger: {
        ...baseBtn,
        border: "1px solid rgba(244,63,94,0.28)",
        background: "linear-gradient(180deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      },
    };

    const btnDisabled = {
      opacity: 0.55,
      cursor: "not-allowed",
    };

    const kbd = {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12.5,
      padding: "2px 6px",
      borderRadius: 8,
      border: "1px solid rgba(15,23,42,0.18)",
      background: "rgba(255,255,255,0.78)",
      color: "#0f172a",
      whiteSpace: "nowrap",
    };

    const canvasFrame = {
      width: `${imgW * scale}px`,
      height: `${imgH * scale}px`,
      imageRendering: "pixelated",
      borderRadius: 14,
      border: "1px solid rgba(15,23,42,0.14)",
      background:
        "radial-gradient(450px 220px at 30% 20%, rgba(59,130,246,0.10), rgba(15,23,42,0.02))",
      boxShadow: "0 12px 22px rgba(15,23,42,0.06)",
      display: "block",
    };

    const smallText = { fontSize: 12.5, color: "#64748b", lineHeight: 1.55, marginBottom: 10 };

    const sliderWrap = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginTop: 8,
    };

    const sliderLabel = {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12.5,
      color: "#0f172a",
      marginBottom: 6,
    };

    const slider = {
      width: 240,
      accentColor: "#2563eb",
    };

    const page = {
      fontFamily: font,
      color: "#0f172a",
      padding: 18,
      maxWidth: "95%",
      margin: "0 auto",
    };

    const header = {
      marginBottom: 14,
      borderRadius: 18,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(236,72,153,0.08))",
      padding: 16,
      boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
    };

    const h1 = { margin: 0, fontSize: 22, letterSpacing: -0.35 };
    const lead = { margin: "6px 0 0 0", color: "#334155", fontSize: 13.5, lineHeight: 1.6 };

    const grid = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 16,
      alignItems: "start",
    };

    const callout = {
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(2,132,199,0.22)",
      background: "linear-gradient(180deg, rgba(56,189,248,0.10), rgba(56,189,248,0.04))",
      fontSize: 13,
      color: "#334155",
      lineHeight: 1.55,
    };

    const err = {
      borderRadius: 16,
      border: "1px solid rgba(244,63,94,0.25)",
      background: "linear-gradient(180deg, rgba(244,63,94,0.10), rgba(244,63,94,0.03))",
      padding: 12,
      color: "#991b1b",
      whiteSpace: "pre-wrap",
      fontSize: 13,
      marginBottom: 12,
    };

    return {
      page,
      header,
      h1,
      lead,
      grid,
      card,
      titleRow,
      pill,
      dot,
      btnVariants,
      btnDisabled,
      kbd,
      canvasFrame,
      smallText,
      sliderWrap,
      sliderLabel,
      slider,
      callout,
      err,
    };
  }, [imgW, imgH, scale]);
}
