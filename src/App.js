// src/App.jsx
import React, { useMemo } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";

import VaeLatentVisualizer from "./VaeLatentVisualizer";
import StateLatentVisualizer from "./StateLatentVisualizer";
import LatentRolloutVisualizer from "./LatentRolloutVisualizer";
import SemiInterpretableVisualizer from "./SemiInterpretableVisualizer";
import PIWMVisualizer from "./PIWMVisualizer";
import Guide from "./Guide";
import Home from "./Home";

import { useUiTheme } from "./components/theme";

function TopNav() {
  const t = useUiTheme(); // app-level usage; visualizers can still pass imgW/imgH/scale
  const location = useLocation();

  const items = useMemo(() => t.navItems, [t.navItems]);

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
    <div style={t.topWrap}>
      <div style={t.topBar}>
        <div style={t.brand}>
          <div style={t.logo} aria-hidden />
          <div style={t.brandText}>
            <p style={t.brandTitle}>World Model Visualizers</p>
            <p style={t.brandSub}>{subtitle}</p>
          </div>
        </div>

        <div style={t.navRow} aria-label="Primary navigation">
          {items.map((it) =>
            it.external ? (
              <a
                key={it.to}
                href={it.to}
                target="_blank"
                rel="noopener noreferrer"
                style={t.externalLink}
              >
                {it.label}
                <span style={t.externalIcon} aria-hidden>
                  ↗
                </span>
              </a>
            ) : (
              <NavLink
                key={it.to}
                to={it.to}
                style={({ isActive }) => ({
                  ...t.linkBase,
                  ...(isActive ? t.linkActive : t.linkInactive),
                  transform: isActive
                    ? "translateY(-1px)"
                    : "translateY(0px)",
                })}
              >
                <span style={t.dot(it.dot)} aria-hidden />
                {it.label}
              </NavLink>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const t = useUiTheme();

  return (
    <div style={t.appShell}>
      <TopNav />

      <div style={t.contentWrap}>
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

