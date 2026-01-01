// src/theme.js
import { useMemo } from "react";

export function useUiTheme({ imgW, imgH, scale } = {}) {
  return useMemo(() => {
    const font =
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"';

    // ---------- shared primitives ----------
    const dot = (c) => ({
      width: 9,
      height: 9,
      borderRadius: 999,
      background: c,
      boxShadow: "0 0 0 3px rgba(15,23,42,0.05)",
      flex: "0 0 auto",
    });

    const card = {
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.86)",
      boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
      padding: 16,
    };

    const titleRow = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    };

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
        background:
          "linear-gradient(180deg, rgba(59,130,246,0.16), rgba(59,130,246,0.07))",
      },
      danger: {
        ...baseBtn,
        border: "1px solid rgba(244,63,94,0.28)",
        background:
          "linear-gradient(180deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      },
    };

    const btnDisabled = { opacity: 0.55, cursor: "not-allowed" };

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

    const canvasFrame = imgW && imgH && scale ? {
      width: `${imgW * scale}px`,
      height: `${imgH * scale}px`,
      imageRendering: "pixelated",
      borderRadius: 14,
      border: "1px solid rgba(15,23,42,0.14)",
      background:
        "radial-gradient(450px 220px at 30% 20%, rgba(59,130,246,0.10), rgba(15,23,42,0.02))",
      boxShadow: "0 12px 22px rgba(15,23,42,0.06)",
      display: "block",
    } : undefined;

    const smallText = {
      fontSize: 12.5,
      color: "#64748b",
      lineHeight: 1.55,
      marginBottom: 10,
    };

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

    const slider = { width: 240, accentColor: "#2563eb" };

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
      background:
        "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(236,72,153,0.08))",
      padding: 16,
      boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
    };

    const h1 = { margin: 0, fontSize: 22, letterSpacing: -0.35 };
    const lead = {
      margin: "6px 0 0 0",
      color: "#334155",
      fontSize: 13.5,
      lineHeight: 1.6,
    };

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
      background:
        "linear-gradient(180deg, rgba(56,189,248,0.10), rgba(56,189,248,0.04))",
      fontSize: 13,
      color: "#334155",
      lineHeight: 1.55,
    };

    const err = {
      borderRadius: 16,
      border: "1px solid rgba(244,63,94,0.25)",
      background:
        "linear-gradient(180deg, rgba(244,63,94,0.10), rgba(244,63,94,0.03))",
      padding: 12,
      color: "#991b1b",
      whiteSpace: "pre-wrap",
      fontSize: 13,
      marginBottom: 12,
    };

    // ---------- App shell + TopNav styles ----------
    const appShell = {
      fontFamily: font,
      color: "#0f172a",
      minHeight: "100vh",
      background:
        "radial-gradient(1100px 650px at 15% -10%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 55%),",
    };

    const topWrap = { padding: "16px 20px 10px" };

    const topBar = {
      maxWidth: "100%",
      margin: "0 auto",
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(8px)",
      boxShadow: "0 12px 26px rgba(15,23,42,0.06)",
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    };

    const brand = {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minWidth: 240,
    };

    const logo = {
      width: 36,
      height: 36,
      borderRadius: 12,
      background:
        "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(236,72,153,0.85))",
      boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
      flex: "0 0 auto",
    };

    const brandText = { display: "flex", flexDirection: "column", lineHeight: 1.1 };

    const brandTitle = {
      margin: 0,
      fontWeight: 700,
      letterSpacing: -0.2,
      fontSize: 15.5,
    };

    const brandSub = { margin: 0, fontSize: 14.5, color: "#64748b" };

    const navRow = {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    };

    const linkBase = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 12px",
      borderRadius: 999,
      textDecoration: "none",
      fontSize: 13.5,
      lineHeight: 1,
      border: "1px solid transparent",
      transition: "transform 120ms ease, background 120ms ease, border 120ms ease",
      userSelect: "none",
      whiteSpace: "nowrap",
    };

    const linkInactive = {
      color: "#334155",
      background: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(15,23,42,0.08)",
    };

    const linkActive = {
      color: "#0b1220",
      background:
        "linear-gradient(180deg, rgba(59,130,246,0.14), rgba(59,130,246,0.06))",
      border: "1px solid rgba(59,130,246,0.28)",
      boxShadow: "0 10px 18px rgba(37,99,235,0.10)",
      fontWeight: 750,
    };

    // External link styling (no dot + subtle external indicator)
    const externalLink = {
      display: "inline-flex",
      alignItems: "center",
      padding: "9px 12px",
      borderRadius: 999,
      textDecoration: "none",
      fontSize: 13.5,
      lineHeight: 1,
      color: "#334155",
      background: "rgba(255,255,255,0.45)",
      border: "1px dashed rgba(15,23,42,0.18)",
      transition: "transform 120ms ease, background 120ms ease, border 120ms ease",
      userSelect: "none",
      whiteSpace: "nowrap",
    };

    const externalIcon = {
      fontSize: 12,
      opacity: 0.65,
      marginLeft: 6,
      transform: "translateY(-1px)",
    };

    const contentWrap = { padding: "0 0 22px" };

    // Centralize your nav config here so App.jsx is just plumbing
    const navItems = [
      { to: "/home", label: "Home", dot: "#22c55e" },
      { to: "/guide", label: "Guide", dot: "#22c55e" },
      { to: "/piwm", label: "PIWM", dot: "#a855f7" },
      { to: "/rollout", label: "LSTM", dot: "#ec4899" },
      { to: "/latent", label: "Latent", dot: "#3b82f6" },
      { to: "/semi", label: "Semi-Interpretable", dot: "#0ea5e9" },
      { to: "/state", label: "Interpretable", dot: "#f59e0b" },
      {
        to: "https://ivan.ece.ufl.edu/research/#piwm",
        label: "Learn More",
        external: true,
      },
    ];

    return {
      // existing stuff
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

      // new app-level theme stuff
      appShell,
      contentWrap,
      topWrap,
      topBar,
      brand,
      logo,
      brandText,
      brandTitle,
      brandSub,
      navRow,
      linkBase,
      linkInactive,
      linkActive,
      externalLink,
      externalIcon,

      // nav config
      navItems,
      font,
    };
  }, [imgW, imgH, scale]);
}

