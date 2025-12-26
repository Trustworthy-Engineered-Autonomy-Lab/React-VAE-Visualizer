// src/App.jsx
import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import VaeLatentVisualizer from "./VaeLatentVisualizer";
import StateLatentVisualizer from "./StateLatentVisualizer";
import LatentRolloutVisualizer from "./LatentRolloutVisualizer"; // ← new
import SemiInterpretableVisualizer from "./SemiInterpretableVisualizer";
import PIWMVisualizer from "./PIWMVisualizer";
import Guide from "./Guide";

function App() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav
        style={{
          display: "flex",
          fontSize: 25,
          gap: 26,
          padding: "12px 16px",
          borderBottom: "1px solid #ddd",
          marginBottom: 16,
        }}
      >

        <NavLink
          to="/guide"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#2563eb" : "#444",
          })}
        >
          Guide
        </NavLink>
        <NavLink
          to="/piwm"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#2563eb" : "#444",
          })}
        >
          PIWM
        </NavLink>
        <NavLink
          to="/latent"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#2563eb" : "#444",
          })}
        >
          Latent
        </NavLink>
        <NavLink
          to="/semi"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#2563eb" : "#444",
          })}
        >
          Semi-Interpretable
        </NavLink>


        <NavLink
          to="/state"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#2563eb" : "#444",
          })}
        >
          Interpretable
        </NavLink>

        <NavLink
          to="/rollout"
          style={({ isActive }) => ({
            textDecoration: "none",
            fontWeight: isActive ? "700" : "500",
            color: isActive ? "#2563eb" : "#444",
          })}
        >
          LSTM
        </NavLink>


      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/guide" replace />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/latent" element={<VaeLatentVisualizer />} />
        <Route path="/state" element={<StateLatentVisualizer />} />
        <Route path="/semi" element={<SemiInterpretableVisualizer />} />
        <Route path="/rollout" element={<LatentRolloutVisualizer />} />
        <Route path="/piwm" element={<PIWMVisualizer />} />
        <Route path="*" element={<Navigate to="/latent" replace />} />
      </Routes>
    </div>
  );
}

export default App;

