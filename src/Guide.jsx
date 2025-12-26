
import React, { useMemo } from "react";

const S = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    color: "#0f172a",
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 15% -10%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 55%)",
    padding: 28,
  },

  // ✅ Wider content
  container: { maxWidth: 1440, margin: "0 auto" },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(236,72,153,0.85))",
    boxShadow: "0 10px 25px rgba(15,23,42,0.14)",
  },
  brandText: { display: "flex", flexDirection: "column" },
  brandTitle: { fontWeight: 750, letterSpacing: -0.3, margin: 0, fontSize: 16 },
  brandSub: { margin: 0, color: "#64748b", fontSize: 13 },

  pillRow: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  pill: {
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
  },
  dot: (bg) => ({
    width: 9,
    height: 9,
    borderRadius: 999,
    background: bg,
    boxShadow: "0 0 0 3px rgba(15,23,42,0.05)",
  }),

  hero: {
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.08)",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(236,72,153,0.08))",
    padding: 22,
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  },
  h1: { margin: 0, fontSize: 30, letterSpacing: -0.55, lineHeight: 1.12 },

  // ✅ Wider hero copy
  heroP: {
    margin: "10px 0 0 0",
    color: "#334155",
    fontSize: 15.5,
    lineHeight: 1.6,
    maxWidth: 1200,
  },

  // ✅ Wider main layout: fixed nav width, main gets the rest
  layout: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: 20,
    marginTop: 16,
    alignItems: "start",
  },

  nav: {
    position: "sticky",
    top: 16,
    alignSelf: "start",
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.82)",
    boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
    padding: 14,
  },
  navTitle: {
    margin: "0 0 10px 0",
    fontSize: 12,
    letterSpacing: 0.35,
    color: "#0f172a",
    textTransform: "uppercase",
    opacity: 0.85,
  },
  navLink: {
    display: "block",
    padding: "8px 10px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#0f172a",
    fontSize: 13.5,
    lineHeight: 1.25,
    border: "1px solid transparent",
  },
  navLinkMuted: { color: "#334155" },

  main: { display: "flex", flexDirection: "column", gap: 16 },

  card: {
    borderRadius: 16,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.86)",
    boxShadow: "0 12px 24px rgba(15,23,42,0.05)",
    padding: 18,
  },
  cardTitle: {
    margin: 0,
    fontSize: 14,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: "#0f172a",
    opacity: 0.9,
  },
  h2: { margin: "10px 0 8px 0", fontSize: 18, letterSpacing: -0.2 },
  h3: { margin: "14px 0 6px 0", fontSize: 15.5, letterSpacing: -0.15 },
  p: { margin: "8px 0", fontSize: 14.5, color: "#334155", lineHeight: 1.7 },

  callout: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(2,132,199,0.22)",
    background:
      "linear-gradient(180deg, rgba(56,189,248,0.11), rgba(56,189,248,0.04))",
  },
  warn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(244,63,94,0.25)",
    background:
      "linear-gradient(180deg, rgba(244,63,94,0.09), rgba(244,63,94,0.03))",
  },
  calloutTitle: { margin: 0, fontWeight: 750, fontSize: 14, color: "#0b1220" },
  calloutText: { margin: "6px 0 0 0", fontSize: 14, color: "#334155", lineHeight: 1.65 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 10 },

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
  code: {
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
  },

  ul: { margin: "8px 0 0 18px", color: "#334155", lineHeight: 1.7 },
  li: { margin: "7px 0", fontSize: 14.5 },

  step: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.62)",
  },
  stepNum: {
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
  },

  table: {
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
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: "#0f172a",
    background: "rgba(15,23,42,0.03)",
    borderBottom: "1px solid rgba(15,23,42,0.08)",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    verticalAlign: "top",
  },

  footer: {
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
  },
};

function Anchor({ id, title, children }) {
  return (
    <section id={id} style={S.card}>
      <div style={S.cardTitle}>{title}</div>
      {children}
    </section>
  );
}

function Step({ n, title, children }) {
  return (
    <div style={S.step}>
      <div style={S.stepNum}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ color: "#334155", fontSize: 14.5, lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function MiniTable({ rows }) {
  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.th}>Area</th>
          <th style={S.th}>What it represents</th>
          <th style={S.th}>What can change it</th>
          <th style={S.th}>What it should affect</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td style={S.td}>
              <b style={{ color: "#0f172a" }}>{r.area}</b>
            </td>
            <td style={S.td}>{r.rep}</td>
            <td style={S.td}>{r.change}</td>
            <td style={S.td}>{r.affect}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Guide() {
  const nav = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "quickstart", label: "Quickstart (recommended demo flow)" },
      { id: "gt", label: "Visualizer: Ground Truth" },
      { id: "vae", label: "Visualizer: VAE Latent" },
      { id: "lstm", label: "Visualizer: LSTM Rollout" },
      { id: "piwm", label: "Visualizer: PIWM" },
      { id: "sync", label: "Sync rules: what sync does (and doesn’t)" },
      { id: "actions", label: "Actions: what happens on a step" },
      { id: "interpretation", label: "How to interpret results" },
      // { id: "pitfalls", label: "Common pitfalls (what “broken” looks like)" },
      { id: "faq", label: "FAQ" },
      { id: "ort", label: "onnxruntime-web stability notes" },
    ],
    []
  );

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Top bar */}
        <div style={S.topBar}>
          <div style={S.brand}>
            <div style={S.logo} aria-hidden />
            <div style={S.brandText}>
              <p style={S.brandTitle}>PIWM Visualizers: User Guide</p>
            </div>
          </div>

          <div style={S.pillRow}>
            <span style={S.pill}>
              <span style={S.dot("#22c55e")} />
              Ground Truth
            </span>
            <span style={S.pill}>
              <span style={S.dot("#3b82f6")} />
              VAE / Latent
            </span>
            <span style={S.pill}>
              <span style={S.dot("#0ea5e9")} />
              LSTM Rollout
            </span>
            <span style={S.pill}>
              <span style={S.dot("#a855f7")} />
              PIWM
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={S.hero}>
          <h1 style={S.h1}>How to Use the Visualizers</h1>
          <p style={S.heroP}>
            This page explains <b>what each panel means</b>, <b>what each button actually does</b>,
            and <b>how to run a clean comparison</b> between: the physics-based ground truth renderer,
            a VAE latent space, an LSTM latent transition model, and PIWM’s learned state/image modules.
          </p>
          <div style={S.callout}>
            <p style={S.calloutTitle}>Key Notes</p>
            <p style={S.calloutText}>
              Treat <b>Sync</b> as “align all representations to the same starting observation.”
              Only interpret rollouts after Sync. If something drifts or looks off, <b>Sync again from a clean GT state</b>.
            </p>
            <p style={S.calloutText}>
              In the event the message <b> "Loading Onyx Models" </b> appears please wait until it disappears as the model weights are being loaded.
            </p>
          </div>
        </div>

        {/* Layout */}
        <div style={S.layout}>
          {/* Nav */}
          <aside style={S.nav}>
            <div style={S.navTitle}>On this page</div>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} style={S.navLink}>
                <span style={S.navLinkMuted}>{n.label}</span>
              </a>
            ))}

          </aside>

          {/* Main */}
          <main style={S.main}>
            <Anchor id="overview" title="Overview">
              <h2 style={S.h2}>What the system is doing</h2>
              <p style={S.p}>This system visualizes the dynamics of OpenAI's cartpole model. The visualizer allows the user to compare and contrast the predictive abilities of our developed models with the ground truth state when actions are applied to the model. For convenience, users can adjust ground truth state and sync to all models to analyze predictive capability in a variety of starting states.  </p>
              <p style={S.p}>You have multiple “representations” of the same environment state:</p>
              <ul style={S.ul}>
                <li style={S.li}>
                  <b>Ground Truth (GT)</b>: physics state → rendered 96×96 observation.
                </li>
                <li style={S.li}>
                  <b>LSTM Rollout</b>: transitions from actions in latent space via VAE: <span style={S.kbd}>zₜ, aₜ → zₜ₊₁</span>,
                  then decode to visualize.
                </li>
                <li style={S.li}>
                  <b>PIWM</b>: a learned dynamics model
                  that predicts the next state from current state + action and uses a custom decoder to convert to image.
                </li>
                <li style={S.li}>
                  <b>VAE Latent</b>: an image is encoded into a 16-D latent vector <span style={S.kbd}>z</span>,
                  and decoded back into an image.
                </li>
              </ul>

              <MiniTable
                rows={[
                  {
                    area: "Ground Truth",
                    rep: "Reference physics + renderer",
                    change: "GT sliders, action buttons, reset",
                    affect: "GT image only (unless you Sync)",
                  },
                  {
                    area: "VAE Latent",
                    rep: "16-D latent z + decoder image",
                    change: "Sync from GT, latent sliders, LSTM step output",
                    affect: "Latent decoded image (and next LSTM step)",
                  },
                  {
                    area: "LSTM Rollout",
                    rep: "Latent transition model + hidden state",
                    change: "Action buttons, reset hidden",
                    affect: "Latent z, hidden (h/c), latent decoded image",
                  },
                  {
                    area: "PIWM",
                    rep: "Learned low-dim state + PIWM decoder image",
                    change: "Sync from GT, action buttons, PIWM reset",
                    affect: "PIWM state and PIWM decoded image",
                  },
                ]}
              />

              <div style={S.callout}>
                <p style={S.calloutTitle}>Glossary</p>
                <p style={S.calloutText}>
                  <b>Sync</b> = encode GT observation into other representations (latent/state).
                  <br />
                  <b>Step / Action</b> = apply exactly one control input to each model’s transition function.
                  <br />
                  <b>Decode</b> = convert latent or PIWM state back into an image for visualization.
                </p>
              </div>
            </Anchor>

            <Anchor id="quickstart" title="Quickstart (recommended demo flow)">
              <h2 style={S.h2}>Recommended demo flow (clean and reproducible)</h2>
              <p style={S.p}>
                If you’re showing this to someone (advisor, teammate, paper demo), do this exact flow.
                It produces a consistent “apples-to-apples” comparison.
              </p>

              <Step n="1" title="Start from a clean Ground Truth state">
                Use the GT <b>Position</b> and <b>Angle</b> sliders to set a simple, interpretable state
                (e.g., near centered position, small angle). Avoid extreme angles at first.
              </Step>

              <Step n="2" title="Sync GT into both VAE and PIWM">
                Press <b>Sync GT → VAE + PIWM</b>. This aligns the latent <span style={S.kbd}>z</span> and PIWM state
                to the <i>same</i> GT observation image.
              </Step>

              <Step n="3" title="Validate the initialization visually">
                After Sync, check: the <b>latent decoded image</b> and the <b>PIWM decoded image</b> should roughly
                resemble the GT observation. It won’t be perfect, but it should be “the same scene.”
              </Step>

              <Step n="4" title="Run a rollout with actions">
                Click <b>Action: Left</b> or <b>Action: Right</b> repeatedly (5–20 steps). Watch how each model drifts.
              </Step>

              <Step n="5" title="Reset & repeat with a different starting condition">
                Reset hidden/latent, reset PIWM, set a new GT state, Sync again, and rerun the exact same action sequence.
              </Step>

              <div style={S.callout}>
                <p style={S.calloutTitle}>Why this flow matters</p>
                <p style={S.calloutText}>
                  Without Sync, the LSTM and PIWM are not guaranteed to represent what GT is showing. You’ll be comparing
                  different “starting points,” which makes qualitative conclusions unreliable.
                </p>
              </div>
            </Anchor>

            <Anchor id="gt" title="Visualizer: Ground Truth">
              <h2 style={S.h2}>Ground Truth panel</h2>
              <p style={S.p}>
                Ground Truth is your reference: physics + renderer. It’s the only view that directly corresponds to the
                actual CartPole equations + your observation renderer.
              </p>

              <h3 style={S.h3}>Controls</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  <b>Position slider</b>: edits <span style={S.kbd}>x</span> (cart position).
                </li>
                <li style={S.li}>
                  <b>Angle slider</b>: edits <span style={S.kbd}>θ</span> (pole angle in radians).
                </li>
                <li style={S.li}>
                  <b>Reset GT</b>: sets state to zeros.
                </li>
              </ul>

              <h3 style={S.h3}>Important behavior rules</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  Changing GT sliders updates <b>only GT</b> until you press Sync.
                </li>
                <li style={S.li}>
                  Pressing action buttons should update GT by exactly one transition step.
                </li>
              </ul>

              <div style={S.callout}>
                <p style={S.calloutTitle}>Interpretation tip</p>
                <p style={S.calloutText}>
                  GT is what you “trust.” Other panels are models approximating GT behavior, either through latent dynamics
                  or learned state transitions.
                </p>
              </div>
            </Anchor>

            <Anchor id="vae" title="Visualizer: VAE Latent">
              <h2 style={S.h2}>VAE Latent panel (encoder/decoder)</h2>
              <p style={S.p}>
                The VAE provides a compact representation <span style={S.kbd}>z ∈ ℝ¹⁶</span>.
                You can (a) initialize <span style={S.kbd}>z</span> from GT via Sync, (b) manually edit latent sliders,
                and (c) decode <span style={S.kbd}>z</span> into an image.
              </p>

              <h3 style={S.h3}>How to use it</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  Use <b>Sync</b> to set latent <span style={S.kbd}>z</span> from the GT image.
                </li>
                <li style={S.li}>
                  Move latent sliders to explore what the decoder does. This is useful for understanding what
                  directions in latent correspond to (cart position, pole angle, etc.).
                </li>
              </ul>

              <div style={S.warn}>
                <p style={S.calloutTitle}>Common confusion</p>
                <p style={S.calloutText}>
                  Editing latent sliders is <b>not</b> guaranteed to correspond to a valid GT physics state.
                  It’s a learned representation; it may produce images that don’t map cleanly to GT.
                </p>
              </div>
            </Anchor>

            <Anchor id="lstm" title="Visualizer: LSTM Rollout">
              <h2 style={S.h2}>LSTM Rollout panel</h2>
              <p style={S.p}>
                The LSTM rollout updates latent state using actions:
                <span style={{ marginLeft: 6 }}>
                  <span style={S.kbd}>zₜ, aₜ, (hₜ,cₜ) → zₜ₊₁, (hₜ₊₁,cₜ₊₁)</span>
                </span>
                . The visualization is the decoded image of <span style={S.kbd}>z</span>.
              </p>

              <h3 style={S.h3}>What should change on an action</h3>
              <ul style={S.ul}>
                <li style={S.li}>Latent values update.</li>
                <li style={S.li}>Hidden state updates (h/c).</li>
                <li style={S.li}>Decoded latent image updates.</li>
              </ul>

              <h3 style={S.h3}>How to run a fair rollout</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  Sync first (initializes a meaningful starting <span style={S.kbd}>z</span>).
                </li>
                <li style={S.li}>
                  Apply a fixed sequence of actions (e.g., Right, Right, Left, Left, …) and compare drift to PIWM/GT.
                </li>
              </ul>

              <div style={S.callout}>
                <p style={S.calloutTitle}>Reset button meaning</p>
                <p style={S.calloutText}>
                  Reset latent & hidden clears the rollout memory. Use it when switching scenarios, or if the LSTM drifted
                  into garbage.
                </p>
              </div>
            </Anchor>

            <Anchor id="piwm" title="Visualizer: PIWM">
              <h2 style={S.h2}>PIWM panel (state ↔ image + learned dynamics)</h2>
              <p style={S.p}>PIWM consists of three conceptual parts:</p>
              <ul style={S.ul}>
                <li style={S.li}>
                  <b>PIWM encoder</b>: observation image → PIWM state (typically position & angle).
                </li>
                <li style={S.li}>
                  <b>PIWM decoder</b>: PIWM state → reconstructed observation image.
                </li>
                <li style={S.li}>
                  <b>PIWM predictor</b>: PIWM state + action → next PIWM state.
                </li>
              </ul>

              <h3 style={S.h3}>What PIWM should do in the demo</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  On <b>Sync</b>: PIWM state is initialized from GT observation via PIWM encoder.
                </li>
                <li style={S.li}>
                  On <b>Action</b>: PIWM predictor updates its state by one step.
                </li>
                <li style={S.li}>
                  After any PIWM state change: PIWM decoder should redraw the PIWM image.
                </li>
              </ul>

              <div style={S.warn}>
                <p style={S.calloutTitle}>Important: PIWM image ≠ GT renderer</p>
                <p style={S.calloutText}>
                  PIWM images are produced by a learned decoder, not the python renderer. Small differences are expected.
                  The point is how well it tracks the GT scene over action rollouts.
                </p>
              </div>
            </Anchor>

            <Anchor id="sync" title="Sync rules: what sync does (and doesn’t)">
              <h2 style={S.h2}>Sync: exact meaning</h2>
              <p style={S.p}>
                When you click <b>Sync GT → VAE + PIWM</b>, the app should:
              </p>
              <ul style={S.ul}>
                <li style={S.li}>
                  Convert the GT canvas image to a float tensor <span style={S.kbd}>x ∈ [0,1]^1x3x96x96</span>.
                </li>
                <li style={S.li}>
                  Run VAE encoder to produce latent <span style={S.kbd}>z</span> (commonly using <span style={S.kbd}>mu</span> output).
                </li>
                <li style={S.li}>
                  Run PIWM encoder to produce PIWM state (pos, angle).
                </li>
                <li style={S.li}>
                  Reset LSTM hidden state (h/c) so the rollout begins from the synced latent.
                </li>
              </ul>

              <div style={S.callout}>
                <p style={S.calloutTitle}>Sync does NOT</p>
                <p style={S.calloutText}>
                  It does not advance time. It’s not an “action.” It’s simply alignment: “encode this frame.”
                </p>
              </div>

              <div style={S.code}>
                <b>Expected order</b> (conceptual):
                {"\n"}1) Render GT image
                {"\n"}2) Encode GT → latent (VAE)
                {"\n"}3) Encode GT → PIWM state (PIWM encoder)
                {"\n"}4) Decode latent → latent image (VAE decoder)
                {"\n"}5) Decode PIWM state → PIWM image (PIWM decoder)
              </div>
            </Anchor>

            <Anchor id="actions" title="Actions: what happens on a step">
              <h2 style={S.h2}>Action buttons: exact meaning</h2>
              <p style={S.p}>
                Each click of <b>Action: Left</b> or <b>Action: Right</b> should apply exactly one step to each model.
              </p>

              <MiniTable
                rows={[
                  {
                    area: "Ground Truth",
                    rep: "Physics transition",
                    change: "Apply TAU-step with force left/right",
                    affect: "GT image updates to new (x, θ)",
                  },
                  {
                    area: "LSTM Rollout",
                    rep: "Latent transition",
                    change: "Run lstm_latent_step once",
                    affect: "z/h/c update and latent decoded image updates",
                  },
                  {
                    area: "PIWM",
                    rep: "Learned state transition",
                    change: "Predict next PIWM state once",
                    affect: "PIWM state updates then PIWM decoded image updates",
                  },
                  {
                    area: "Sync",
                    rep: "Alignment only",
                    change: "Not part of an action",
                    affect: "No time step is applied",
                  },
                ]}
              />

            </Anchor>

            <Anchor id="interpretation" title="How to interpret results">
              <h2 style={S.h2}>Interpreting what you see (what to look for)</h2>

              <h3 style={S.h3}>1) Initialization alignment</h3>
              <p style={S.p}>
                Immediately after Sync, do the latent-decoded and PIWM-decoded images resemble the GT image?
                This tests encoder/decoder consistency.
              </p>

              <h3 style={S.h3}>2) Short-horizon action fidelity (1–5 steps)</h3>
              <p style={S.p}>
                After a few actions, do the models move the cart/pole in a direction consistent with GT?
                This tests local transition quality.
              </p>

              <h3 style={S.h3}>3) Long-horizon drift (10–50 steps)</h3>
              <p style={S.p}>
                Over many steps, models will drift. The interesting part is the <b>type</b> of drift:
                blurring, mode collapse, delayed response to actions, or incorrect pole/cart geometry.
              </p>

            </Anchor>

            {/* <Anchor id="pitfalls" title="Common pitfalls (what “broken” looks like)"> */}
            {/*   <h2 style={S.h2}>Common pitfalls</h2> */}
            {/*   <ul style={S.ul}> */}
            {/*     <li style={S.li}> */}
            {/*       <b>Sync updates latent numbers but image doesn’t change</b> → decode didn’t run, or you’re not drawing into */}
            {/*       the correct canvas refs. */}
            {/*     </li> */}
            {/*     <li style={S.li}> */}
            {/*       <b>Reset draws correctly but Sync causes ORT errors</b> → overlapping <span style={S.kbd}>session.run()</span> */}
            {/*       calls or StrictMode double-invocation issues. */}
            {/*     </li> */}
            {/*     <li style={S.li}> */}
            {/*       <b>PIWM state changes but image stays black</b> → decoder output name mismatch, or reading tensor via wrong field. */}
            {/*     </li> */}
            {/*     <li style={S.li}> */}
            {/*       <b>GT looks correct but learned images are “huge cart” / wrong geometry</b> → dataset/normalization mismatch, */}
            {/*       or encoder/decoder trained on different renderer settings. */}
            {/*     </li> */}
            {/*   </ul> */}

            {/*   <div style={S.code}> */}
            {/*     <b>Sanity checks</b> */}
            {/*     {"\n"}• Log output keys: Object.keys(out) */}
            {/*     {"\n"}• Always read tensors via: out[name].data */}
            {/*     {"\n"}• Ensure your input tensor is [1,3,96,96] float32 in [0,1] */}
            {/*   </div> */}
            {/* </Anchor> */}

            <Anchor id="faq" title="FAQ">
              <h2 style={S.h2}>FAQ</h2>

              <h3 style={S.h3}>“Why do the learned images not exactly match Ground Truth?”</h3>
              <p style={S.p}>
                GT is a deterministic renderer. Learned decoders approximate the observation distribution and may blur,
                shift, or distort details—especially under distribution shift or long rollouts.
              </p>

              <h3 style={S.h3}>“Why do I need Sync? Can’t I just start rolling out?”</h3>
              <p style={S.p}>
                You can, but then the models’ internal state may not correspond to the GT frame you’re looking at. Sync is what
                aligns them to the same starting observation so comparisons are meaningful.
              </p>

              <h3 style={S.h3}>“What’s the right way to compare LSTM vs PIWM?”</h3>
              <p style={S.p}>
                Sync from a known GT state, then apply the same action sequence. Compare (a) short-horizon fidelity and (b) drift modes.
              </p>

            </Anchor>
            <Anchor id="ort" title="onnxruntime-web stability notes">
              <h2 style={S.h2}>onnxruntime-web stability notes (practical)</h2>
              <p style={S.p}>
                In threaded/proxy WASM builds, ORT can throw <b>“Session already started”</b> if two inferences overlap,
                even across different sessions. It can also throw <b>“Session mismatch”</b> during dev hot refresh when an
                old async run completes after a re-mount.
              </p>

              <h3 style={S.h3}>What users should do (as “operating instructions”)</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  If the page shows an ORT error, click <b>Reset</b> buttons and <b>Sync</b> again. Avoid spamming action buttons.
                </li>
                <li style={S.li}>
                  In development, if errors persist, refresh the page to clear in-flight runs.
                </li>
              </ul>

              <h3 style={S.h3}>What the implementation should do (for robustness)</h3>
              <ul style={S.ul}>
                <li style={S.li}>
                  Serialize all <span style={S.kbd}>session.run()</span> calls through one global queue (not one queue per session).
                </li>
                <li style={S.li}>
                  Guard async completion with a “latest token” so stale runs don’t draw.
                </li>
                <li style={S.li}>
                  Optionally force single-threaded wasm:
                  <span style={{ marginLeft: 6 }}>
                    <span style={S.kbd}>ort.env.wasm.numThreads = 1</span>,{" "}
                    <span style={S.kbd}>ort.env.wasm.proxy = false</span>
                  </span>
                </li>
              </ul>
            </Anchor>

          </main>
        </div>
      </div>
    </div>
  );
}

