
// src/App.jsx
import React, { useMemo } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import VaeLatentVisualizer from "./VaeLatentVisualizer";
import StateLatentVisualizer from "./StateLatentVisualizer";
import LatentRolloutVisualizer from "./LatentRolloutVisualizer";
import SemiInterpretableVisualizer from "./SemiInterpretableVisualizer";
import PIWMVisualizer from "./PIWMVisualizer";
import Guide from "./Guide";
import Home from "./Home";
const S = {
  shell: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    color: "#0f172a",
    minHeight: "100vh",
    background:
      "radial-gradient(1100px 650px at 15% -10%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 55%),",
  },

  // keep nav nicely aligned with your Guide width (1440) without forcing Guide to change
  topWrap: { padding: "16px 20px 10px" },
  topBar: {
    maxWidth: '100%',
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
  },

  brand: { display: "flex", alignItems: "center", gap: 12, minWidth: 240 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(236,72,153,0.85))",
    boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
    flex: "0 0 auto",
  },
  brandText: { display: "flex", flexDirection: "column", lineHeight: 1.1 },
  brandTitle: {
    margin: 0,
    fontWeight: 700,
    letterSpacing: -0.2,
    fontSize: 15.5,
  },
  brandSub: {
    margin: 0,
    fontSize: 14.5,
    color: "#64748b",
  },

  navRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  linkBase: {
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
  },
  linkInactive: {
    color: "#334155",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(15,23,42,0.08)",
  },
  linkActive: {
    color: "#0b1220",
    background:
      "linear-gradient(180deg, rgba(59,130,246,0.14), rgba(59,130,246,0.06))",
    border: "1px solid rgba(59,130,246,0.28)",
    boxShadow: "0 10px 18px rgba(37,99,235,0.10)",
    fontWeight: 750,
  },

  dot: (bg) => ({
    width: 9,
    height: 9,
    borderRadius: 999,
    background: bg,
    boxShadow: "0 0 0 3px rgba(15,23,42,0.05)",
    flex: "0 0 auto",
  }),

  contentWrap: { padding: "0 0 22px" },
};

function TopNav() {
  const location = useLocation();

  // label + accent dot per route (optional but looks “research dashboard”)
  const items = useMemo(
    () => [
      { to: "/home ", label: "Home", dot: "#22c55e" },
      { to: "/guide", label: "Guide", dot: "#22c55e" },
      { to: "/piwm", label: "PIWM", dot: "#a855f7" },
      { to: "/latent", label: "Latent", dot: "#3b82f6" },
      { to: "/semi", label: "Semi-Interpretable", dot: "#0ea5e9" },
      { to: "/state", label: "Interpretable", dot: "#f59e0b" },
      { to: "/rollout", label: "LSTM", dot: "#ec4899" },
    ],
    []
  );

  // helpful subtitle that changes with page, but still minimal
  const subtitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/piwm")) return "PIWM Model";
    if (path.startsWith("/home")) return "Home";
    if (path.startsWith("/latent")) return "VAE encoder/decoder Latent Space";
    if (path.startsWith("/rollout")) return "Latent Rollouts";
    if (path.startsWith("/state")) return "Interpretable State Mapping";
    if (path.startsWith("/semi")) return "Semi-interpretable State Mapping";
    return "User Guide";
  }, [location.pathname]);

  return (
    <div style={S.topWrap}>
      <div style={S.topBar}>
        <div style={S.brand}>
          <div style={S.logo} aria-hidden />
          <div style={S.brandText}>
            <p style={S.brandTitle}>PIWM Visualizers</p>
            <p style={S.brandSub}>{subtitle}</p>
          </div>
        </div>

        <div style={S.navRow} aria-label="Primary navigation">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              style={({ isActive }) => ({
                ...S.linkBase,
                ...(isActive ? S.linkActive : S.linkInactive),
                transform: isActive ? "translateY(-1px)" : "translateY(0px)",
              })}
            >
              <span style={S.dot(it.dot)} aria-hidden />
              {it.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={S.shell}>
      <TopNav />

      <div style={S.contentWrap}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/home" element={<Home />} />
          <Route path="/latent" element={<VaeLatentVisualizer />} />
          <Route path="/state" element={<StateLatentVisualizer />} />
          <Route path="/semi" element={<SemiInterpretableVisualizer />} />
          <Route path="/rollout" element={<LatentRolloutVisualizer />} />
          <Route path="/piwm" element={<PIWMVisualizer />} />
          <Route path="*" element={<Navigate to="/guide" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

