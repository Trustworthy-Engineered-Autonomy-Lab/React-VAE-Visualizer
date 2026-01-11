import React, { useMemo } from "react";
import { MenuCard } from "../components/MenuCard";
import { useUiTheme } from "../components/theme";

export default function Home() {
  const styles = useUiTheme();

  const items = useMemo(
    () => [
      {
        to: "/guide",
        title: "User Guide",
        iconBg: "linear-gradient(180deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))",
        iconBorder: "rgba(34,197,94,0.25)",
        desc: "Quickstart flow, panel meanings, sync rules, and common failure modes.",
        span: "span 6",
      },
      {
        to: "/piwm",
        title: "PIWM",
        iconBg: "linear-gradient(180deg, rgba(168,85,247,0.14), rgba(168,85,247,0.06))",
        iconBorder: "rgba(168,85,247,0.24)",
        desc: "Learned low-dimensional state, encoder/decoder reconstruction, and learned dynamics rollouts.",
        span: "span 6",
      },
      {
        to: "/rollout",
        title: "LSTM Rollout",
        iconBg: "linear-gradient(180deg, rgba(236,72,153,0.14), rgba(236,72,153,0.06))",
        iconBorder: "rgba(236,72,153,0.24)",
        desc: "Latent transition model (z, action, hidden) → z′. Watch drift over horizons.",
        span: "span 4",
      },
      {
        to: "/latent",
        title: "VAE Latent",
        iconBg: "linear-gradient(180deg, rgba(59,130,246,0.14), rgba(59,130,246,0.06))",
        iconBorder: "rgba(59,130,246,0.26)",
        desc: "Explore latent directions and how the decoder maps z → observation frames.",
        span: "span 4",
      },
      {
        to: "/semi",
        title: "Semi-Interpretable",
        iconBg: "linear-gradient(180deg, rgba(14,165,233,0.14), rgba(14,165,233,0.06))",
        iconBorder: "rgba(14,165,233,0.24)",
        desc: "Representation between latent and explicit state—inspect what it preserves and what it discards.",
        span: "span 4",
      },
      {
        to: "/state",
        title: "Interpretable",
        iconBg: "linear-gradient(180deg, rgba(245,158,11,0.14), rgba(245,158,11,0.06))",
        iconBorder: "rgba(245,158,11,0.26)",
        desc: "Direct interpretable state controls and mappings for clarity-focused comparisons.",
        span: "span 4",
      },
    ],
    []
  );

  return (
    <div style={styles.homePage}>
      <div style={styles.containerWide}>
        <div style={styles.homeHero}>
          <h1 style={styles.homeH1}>World Model Visualizers</h1>
          <p style={styles.homeSub}>
            Pick a module to explore. For clean demos: start with{" "}
            <span style={styles.kbd}>User Guide</span>, then run{" "}
            <span style={styles.kbd}>PIWM</span> with the recommended{" "}
            <b>Sync → Actions → Drift</b> flow.
          </p>
        </div>

        <div style={styles.homeGrid12}>
          {items.map((it) => (
            <MenuCard key={it.to} item={it} styles={styles} />
          ))}
        </div>
      </div>
    </div>
  );
}

