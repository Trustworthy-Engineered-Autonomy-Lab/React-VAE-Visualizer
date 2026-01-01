// src/Home.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const S = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    color: "#0f172a",
    minHeight: "calc(100vh - 92px)", // leaves room for your TopNav
    padding: "18px 20px 28px",
    background:
      "radial-gradient(1200px 700px at 15% -10%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 55%),",
  },
  container: { maxWidth: "95%", margin: "0 auto" },

  hero: {
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.08)",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(236,72,153,0.08))",
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  },
  h1: { margin: 0, fontSize: 26, letterSpacing: -0.45, lineHeight: 1.15 },
  sub: {
    margin: "8px 0 0 0",
    color: "#334155",
    fontSize: 14.5,
    lineHeight: 1.6,
    maxWidth: 980,
  },
  kbd: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12.5,
    padding: "2px 6px",
    borderRadius: 8,
    border: "1px solid rgba(15,23,42,0.18)",
    background: "rgba(255,255,255,0.78)",
    color: "#0f172a",
    whiteSpace: "nowrap",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 14,
    marginTop: 14,
  },

  card: {
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
  },
  cardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 16px 34px rgba(15,23,42,0.08)",
    border: "1px solid rgba(37,99,235,0.22)",
  },
  cardFocus: {
    boxShadow: "0 0 0 4px rgba(37,99,235,0.16), 0 16px 34px rgba(15,23,42,0.08)",
    border: "1px solid rgba(37,99,235,0.28)",
  },

  // big “dot box” that contains the title
  dotBox: (bg, border) => ({
    height: 46,
    borderRadius: 16,
    border: `1px solid ${border}`,
    background: bg,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 14px",
    boxShadow: "0 10px 18px rgba(15,23,42,0.05)",
    width: "fit-content",
  }),
  dotBoxText: {
    fontWeight: 950,
    letterSpacing: -0.25,
    fontSize: 14,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },

  desc: { margin: 0, color: "#334155", fontSize: 13.5, lineHeight: 1.55 },

  span6: { gridColumn: "span 6" },
  span4: { gridColumn: "span 4" },
};

function MenuCard({ item }) {
  const nav = useNavigate();
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => nav(item.to)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nav(item.to);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        ...S.card,
        ...(hover ? S.cardHover : null),
        ...(focus ? S.cardFocus : null),
        gridColumn: item.span,
      }}
      aria-label={`Go to ${item.title}`}
    >
      {/* Title is ONLY here, inside the dotBox */}
      <div style={S.dotBox(item.iconBg, item.iconBorder)} aria-hidden>
        <span style={S.dotBoxText}>{item.title}</span>
      </div>

      <p style={S.desc}>{item.desc}</p>
    </div>
  );
}

export default function Home() {
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
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.hero}>
          <h1 style={S.h1}>World Model Visualizers</h1>
          <p style={S.sub}>
            Pick a module to explore. For clean demos: start with <span style={S.kbd}>User Guide</span>, then run{" "}
            <span style={S.kbd}>PIWM</span> with the recommended <b>Sync → Actions → Drift</b> flow.
          </p>
        </div>

        <div style={S.grid}>
          {items.map((it) => (
            <MenuCard key={it.to} item={it} />
          ))}
        </div>
      </div>
    </div>
  );
}

