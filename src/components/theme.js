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

    // Base "card" (non-interactive)
    const card = {
      borderRadius: 16,
      flex: "1 1 320px",
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

    const canvasFrame =
      imgW && imgH && scale
        ? {
          width: `${imgW * scale}px`,
          height: `${imgH * scale}px`,
          imageRendering: "pixelated",
          borderRadius: 14,
          border: "1px solid rgba(15,23,42,0.14)",
          background:
            "radial-gradient(450px 220px at 30% 20%, rgba(59,130,246,0.10), rgba(15,23,42,0.02))",
          boxShadow: "0 12px 22px rgba(15,23,42,0.06)",
          display: "flex",
          justifyContent: "center",
        }
        : undefined;

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

    // ---------- Layout ----------
    const containerWide = { maxWidth: "95%", margin: "0 auto" };

    const page = {
      fontFamily: font,
      color: "#0f172a",
      padding: 18,
      maxWidth: "95%",
      margin: "0 auto",
    };

    // "Header/Hero" shared look
    const hero = {
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

    const flexGrid = {
      display: "flex",
      gap: 16,
      alignItems: "stretch",
      flexWrap: "wrap",
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

    // ---------- Interactive Card (shared) ----------
    const interactiveCard = {
      borderRadius: 18,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.86)",
      boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
      padding: 16,
      cursor: "pointer",
      userSelect: "none",
      transition: "transform 140ms ease, box-shadow 140ms ease, border 140ms ease",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 120,
      outline: "none",
    };

    const interactiveCardHover = {
      transform: "translateY(-2px)",
      boxShadow: "0 16px 34px rgba(15,23,42,0.08)",
      border: "1px solid rgba(37,99,235,0.22)",
    };

    const interactiveCardFocus = {
      boxShadow:
        "0 0 0 4px rgba(37,99,235,0.16), 0 16px 34px rgba(15,23,42,0.08)",
      border: "1px solid rgba(37,99,235,0.28)",
    };

    // ---------- Home-specific (pulled from Home.jsx S) ----------
    const homePage = {
      fontFamily: font,
      color: "#0f172a",
      minHeight: "calc(100vh - 92px)", // leaves room for TopNav
      padding: "18px 20px 28px",
      background:
        "radial-gradient(1200px 700px at 15% -10%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 55%)",
    };

    const homeHero = {
      ...hero,
      padding: 18, // Home was slightly roomier than header
    };

    const homeH1 = {
      margin: 0,
      fontSize: 26,
      letterSpacing: -0.45,
      lineHeight: 1.15,
    };

    const homeSub = {
      margin: "8px 0 0 0",
      color: "#334155",
      fontSize: 14.5,
      lineHeight: 1.6,
      maxWidth: 980,
    };

    const homeGrid12 = {
      display: "grid",
      gridTemplateColumns: "repeat(12, 1fr)",
      gap: 14,
      marginTop: 14,
    };

    const dotBox = (bg, border) => ({
      height: 46,
      borderRadius: 16,
      border: `1px solid ${border}`,
      background: bg,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 15px",
      boxShadow: "0 10px 18px rgba(15,23,42,0.05)",
      maxWidth: "fit-content",
    });

    const dotBoxText = {
      fontWeight: 950,
      letterSpacing: -0.25,
      fontSize: 14,
      color: "#0f172a",
      maxWidth: "fit-content",
    };

    const homeDesc = { margin: 0, color: "#334155", fontSize: 13.5, lineHeight: 1.55 };

    // ---------- App shell + TopNav styles ----------
    const appShell = {
      fontFamily: font,
      color: "#0f172a",
      minHeight: "100vh",
      background:
        "radial-gradient(1100px 650px at 15% -10%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 55%)",
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
      backgroundImage: "url(/logo.png)",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "contain",
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


    // ---------- Guide-specific styles (pulled from Guide.jsx S) ----------
    const guidePage = {
      fontFamily: font,
      color: "#0f172a",
      minHeight: "100vh",
      background:
        "radial-gradient(1200px 700px at 15% -10%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 55%)",
      padding: 28,
    };

    const guideContainer = { maxWidth: "90%", margin: "0 auto" };

    const guideTopBar = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 18,
    };

    const guideBrand = { display: "flex", alignItems: "center", gap: 12 };

    const guideBrandLogo = {
      width: 36,
      height: 36,
      borderRadius: 12,
      background:
        "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(236,72,153,0.85))",
      boxShadow: "0 10px 25px rgba(15,23,42,0.14)",
    };

    const guideBrandText = { display: "flex", flexDirection: "column" };
    const guideBrandTitle = { fontWeight: 750, letterSpacing: -0.3, margin: 0, fontSize: 16 };
    const guideBrandSub = { margin: 0, color: "#64748b", fontSize: 13 };

    const guidePillRow = {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "flex-end",
    };

    const guidePill = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid rgba(15,23,42,0.10)",
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(6px)",
      fontSize: 12.5,
      color: "#0f172a",
    };

    const guideHero = {
      borderRadius: 18,
      border: "1px solid rgba(15,23,42,0.08)",
      background:
        "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(236,72,153,0.08))",
      padding: 22,
      boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
    };

    const guideH1 = { margin: 0, fontSize: 30, letterSpacing: -0.55, lineHeight: 1.12 };

    const guideHeroP = {
      margin: "10px 0 0 0",
      color: "#334155",
      fontSize: 15.5,
      lineHeight: 1.6,
      maxWidth: 1200,
    };

    const guideLayout = {
      display: "flex",
      gap: 20,
      marginTop: 16,
      alignItems: "flex-start",
      flexWrap: "wrap",
    };

    const guideNavBase = {
      alignSelf: "flex-start",
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.82)",
      boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
      padding: 14,
      flex: "0 0 280px",
      maxWidth: "100%",
    };

    const guideNavTitle = {
      margin: "0 0 10px 0",
      fontSize: 12,
      letterSpacing: 0.35,
      color: "#0f172a",
      textTransform: "uppercase",
      opacity: 0.85,
    };

    const guideNavLink = {
      display: "block",
      padding: "8px 10px",
      borderRadius: 12,
      textDecoration: "none",
      color: "#0f172a",
      fontSize: 13.5,
      lineHeight: 1.25,
      border: "1px solid transparent",
    };

    const guideNavLinkMuted = { color: "#334155" };

    const guideMain = {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      flex: "1 1 560px",
      minWidth: 0,
    };

    const guideCard = {
      borderRadius: 16,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.86)",
      boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
      padding: 18,
    };

    const guideCardTitle = {
      margin: 0,
      fontSize: 14,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      color: "#0f172a",
      opacity: 0.9,
    };

    const guideH2 = { margin: "10px 0 8px 0", fontSize: 18, letterSpacing: -0.2 };
    const guideH3 = { margin: "14px 0 6px 0", fontSize: 15.5, letterSpacing: -0.15 };

    const guidePText = { margin: "8px 0", fontSize: 14.5, color: "#334155", lineHeight: 1.7 };

    const guideCallout = {
      marginTop: 12,
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(2,132,199,0.22)",
      background:
        "linear-gradient(180deg, rgba(56,189,248,0.11), rgba(56,189,248,0.04))",
    };

    const guideWarn = {
      marginTop: 12,
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(244,63,94,0.25)",
      background:
        "linear-gradient(180deg, rgba(244,63,94,0.09), rgba(244,63,94,0.03))",
    };

    const guideCalloutTitle = { margin: 0, fontWeight: 750, fontSize: 14, color: "#0b1220" };

    const guideCalloutText = {
      margin: "6px 0 0 0",
      fontSize: 14,
      color: "#334155",
      lineHeight: 1.65,
    };

    const guideGrid2 = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginTop: 10,
    };

    const guideGrid3 = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 12,
      marginTop: 10,
    };

    const guideCode = {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12.5,
      color: "#0f172a",
      background: "rgba(15,23,42,0.04)",
      border: "1px solid rgba(15,23,42,0.08)",
      borderRadius: 12,
      padding: 12,
      overflowX: "auto",
      lineHeight: 1.55,
      marginTop: 10,
    };

    const guideUl = { margin: "8px 0 0 18px", color: "#334155", lineHeight: 1.7 };
    const guideLi = { margin: "7px 0", fontSize: 14.5 };

    const guideStep = {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.62)",
    };

    const guideStepNum = {
      width: 26,
      height: 26,
      borderRadius: 10,
      display: "grid",
      placeItems: "center",
      fontWeight: 800,
      fontSize: 13,
      color: "#0f172a",
      background: "rgba(59,130,246,0.14)",
      border: "1px solid rgba(59,130,246,0.25)",
      flex: "0 0 auto",
    };

    const guideTable = {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      marginTop: 10,
      fontSize: 13.5,
      color: "#334155",
      overflow: "hidden",
      borderRadius: 14,
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.70)",
    };

    const guideTh = {
      textAlign: "left",
      padding: "10px 12px",
      fontSize: 12,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      color: "#0f172a",
      background: "rgba(15,23,42,0.03)",
      borderBottom: "1px solid rgba(15,23,42,0.08)",
    };

    const guideTd = {
      padding: "10px 12px",
      borderBottom: "1px solid rgba(15,23,42,0.06)",
      verticalAlign: "top",
    };

    const guideFooter = {
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid rgba(15,23,42,0.10)",
      color: "#64748b",
      fontSize: 12.5,
      lineHeight: 1.6,
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 10,
    };

    return {
      // existing stuff
      page,
      hero,
      h1,
      lead,
      grid,
      flexGrid,
      containerWide,
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

      // shared interactive
      interactiveCard,
      interactiveCardHover,
      interactiveCardFocus,

      // Home
      homePage,
      homeHero,
      homeH1,
      homeSub,
      homeGrid12,
      dotBox,
      dotBoxText,
      homeDesc,

      // app shell + topnav
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

      // Guide
      guidePage,
      guideContainer,
      guideTopBar,
      guideBrand,
      guideBrandLogo,
      guideBrandText,
      guideBrandTitle,
      guideBrandSub,
      guidePillRow,
      guidePill,

      guideHero,
      guideH1,
      guideHeroP,
      guideLayout,
      guideNavBase,
      guideNavTitle,
      guideNavLink,
      guideNavLinkMuted,
      guideMain,

      guideCard,
      guideCardTitle,
      guideH2,
      guideH3,
      guidePText,
      guideCallout,
      guideWarn,
      guideCalloutTitle,
      guideCalloutText,
      guideGrid2,
      guideGrid3,
      guideCode,
      guideUl,
      guideLi,
      guideStep,
      guideStepNum,
      guideTable,
      guideTh,
      guideTd,
      guideFooter,
    };
  }, [imgW, imgH, scale]);
}

