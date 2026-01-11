import React, { useEffect, useMemo, useState } from "react";
import { useUiTheme } from "../components/theme";

const BREAKPOINT = 1200; // when stacked, TOC becomes non-sticky

function useIsNarrow(breakpoint = BREAKPOINT) {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isNarrow;
}

function Anchor({ id, title, styles, children }) {
  return (
    <section id={id} style={styles.guideCard}>
      <div style={styles.guideCardTitle}>{title}</div>
      {children}
    </section>
  );
}

function Step({ n, title, styles, children }) {
  return (
    <div style={styles.guideStep}>
      <div style={styles.guideStepNum}>{n}</div>
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

function MiniTable({ rows, styles }) {
  return (
    <table style={styles.guideTable}>
      <thead>
        <tr>
          <th style={styles.guideTh}>Area</th>
          <th style={styles.guideTh}>What it represents</th>
          <th style={styles.guideTh}>What can change it</th>
          <th style={styles.guideTh}>What it should affect</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td style={styles.guideTd}>
              <b style={{ color: "#0f172a" }}>{r.area}</b>
            </td>
            <td style={styles.guideTd}>{r.rep}</td>
            <td style={styles.guideTd}>{r.change}</td>
            <td style={styles.guideTd}>{r.affect}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Guide() {
  const styles = useUiTheme();

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
      { id: "faq", label: "FAQ" },
      { id: "ort", label: "onnxruntime-web stability notes" },
    ],
    []
  );

  const isNarrow = useIsNarrow(BREAKPOINT);

  // Sticky only when side-by-side; non-sticky when stacked
  const navStyle = useMemo(
    () => ({
      ...styles.guideNavBase,
      position: isNarrow ? "relative" : "sticky",
      top: isNarrow ? 0 : 16,
    }),
    [isNarrow, styles]
  );

  return (
    <div style={styles.guidePage}>
      <div style={styles.guideContainer}>
        {/* Hero */}
        <div style={styles.guideHero}>
          <h1 style={styles.guideH1}>How to Use the Visualizers</h1>
          <p style={styles.guideHeroP}>
            This page explains <b>what each panel means</b>, <b>what each button actually does</b>, and{" "}
            <b>how to run a clean comparison</b> between: the physics-based ground truth renderer, a VAE latent
            space, an LSTM latent transition model, and PIWM’s learned state/image modules.
          </p>

          <div style={styles.guideCallout}>
            <p style={styles.guideCalloutTitle}>Key Notes</p>
            <p style={styles.guideCalloutText}>
              Treat <b>Sync</b> as “align all representations to the same starting observation.” Only interpret
              rollouts after Sync. If something drifts or looks off, <b>Sync again from a clean GT state</b>.
            </p>
            <p style={styles.guideCalloutText}>
              If the message <b>"Loading ONNX Models"</b> appears, wait for it to disappear — weights are still
              being loaded.
            </p>
          </div>
        </div>

        {/* Layout */}
        <div style={styles.guideLayout}>
          {/* Nav */}
          <aside style={navStyle}>
            <div style={styles.guideNavTitle}>On this page</div>
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} style={styles.guideNavLink}>
                <span style={styles.guideNavLinkMuted}>{n.label}</span>
              </a>
            ))}
          </aside>

          {/* Main */}
          <main style={styles.guideMain}>
            <Anchor id="overview" title="Overview" styles={styles}>
              <h2 style={styles.guideH2}>What the system is doing</h2>
              <p style={styles.guidePText}>
                This system visualizes OpenAI’s CartPole environment to evaluate world model performance.
                It lets you generate and interact with an interpretable world model, then compare its predictions against ground-truth physics and
                other learned world-model generators under the same action sequence.
                For convenience, users can adjust ground truth state and sync to all models to
                analyze predictive capability in a variety of starting states.
              </p>

              <p style={styles.guidePText}>You have multiple “representations” of the same environment state:</p>

              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>
                  <b>Ground Truth (GT)</b>: physics state → rendered 96×96 observation.
                </li>
                <li style={styles.guideLi}>
                  <b>LSTM Rollout</b>: transitions from actions in latent space via VAE:{" "}
                  <span style={styles.kbd}>zₜ, aₜ → zₜ₊₁</span>, then decode to visualize.
                </li>
                <li style={styles.guideLi}>
                  <b>PIWM</b>: a learned dynamics model that predicts the next state from current state + action and uses a
                  custom decoder to convert to image.
                </li>
                <li style={styles.guideLi}>
                  <b>VAE Latent</b>: an image is encoded into a 16-D latent vector <span style={styles.kbd}>z</span>, and
                  decoded back into an image.
                </li>
              </ul>

              <MiniTable
                styles={styles}
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

              <div style={styles.guideCallout}>
                <p style={styles.guideCalloutTitle}>Glossary</p>
                <p style={styles.guideCalloutText}>
                  <b>Sync</b> = encode GT observation into other representations (latent/state). <br />
                  <b>Step / Action</b> = apply exactly one control input to each model’s transition function. <br />
                  <b>Decode</b> = convert latent or PIWM state back into an image for visualization.
                </p>
              </div>
            </Anchor>

            <Anchor id="quickstart" title="Quickstart (recommended demo flow)" styles={styles}>
              <h2 style={styles.guideH2}>Recommended demo flow (clean and reproducible)</h2>
              <p style={styles.guidePText}>
                If you’re showing this to someone (advisor, teammate, paper demo), do this exact flow. It produces a
                consistent “apples-to-apples” comparison.
              </p>

              <Step n="1" title="Start from a clean Ground Truth state" styles={styles}>
                Use the GT <b>Position</b> and <b>Angle</b> sliders to set a simple, interpretable state (e.g., near
                centered position, small angle). Avoid extreme angles at first.
              </Step>

              <Step n="2" title="Sync GT into both VAE and PIWM" styles={styles}>
                Press <b>Sync GT → VAE + PIWM</b>. This aligns the latent <span style={styles.kbd}>z</span> and PIWM state
                to the <i>same</i> GT observation image.
              </Step>

              <Step n="3" title="Validate the initialization visually" styles={styles}>
                After Sync, check: the <b>latent decoded image</b> and the <b>PIWM decoded image</b> should roughly
                resemble the GT observation. It won’t be perfect, but it should be “the same scene.”
              </Step>

              <Step n="4" title="Run a rollout with actions" styles={styles}>
                Click <b>Action: Left</b> or <b>Action: Right</b> repeatedly (5–20 steps). Watch how each model drifts.
              </Step>

              <Step n="5" title="Reset & repeat with a different starting condition" styles={styles}>
                Reset hidden/latent, reset PIWM, set a new GT state, Sync again, and rerun the exact same action sequence.
              </Step>

              <div style={styles.guideCallout}>
                <p style={styles.guideCalloutTitle}>Why this flow matters</p>
                <p style={styles.guideCalloutText}>
                  Without Sync, the LSTM and PIWM are not guaranteed to represent what GT is showing. You’ll be comparing
                  different “starting points,” which makes qualitative conclusions unreliable.
                </p>
              </div>
            </Anchor>

            <Anchor id="gt" title="Visualizer: Ground Truth" styles={styles}>
              <h2 style={styles.guideH2}>Ground Truth panel</h2>
              <p style={styles.guidePText}>
                Ground Truth is your reference: physics + renderer. It’s the only view that directly corresponds to the
                actual CartPole equations + your observation renderer.
              </p>

              <h3 style={styles.guideH3}>Controls</h3>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>
                  <b>Position slider</b>: edits <span style={styles.kbd}>x</span> (cart position).
                </li>
                <li style={styles.guideLi}>
                  <b>Angle slider</b>: edits <span style={styles.kbd}>θ</span> (pole angle in radians).
                </li>
                <li style={styles.guideLi}>
                  <b>Reset GT</b>: sets state to zeros.
                </li>
              </ul>

              <h3 style={styles.guideH3}>Important behavior rules</h3>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>Changing GT sliders updates <b>only GT</b> until you press Sync.</li>
                <li style={styles.guideLi}>Pressing action buttons should update GT by exactly one transition step.</li>
              </ul>

              <div style={styles.guideCallout}>
                <p style={styles.guideCalloutTitle}>Interpretation tip</p>
                <p style={styles.guideCalloutText}>
                  GT is what you “trust.” Other panels are models approximating GT behavior, either through latent dynamics
                  or learned state transitions.
                </p>
              </div>
            </Anchor>

            <Anchor id="vae" title="Visualizer: VAE Latent" styles={styles}>
              <h2 style={styles.guideH2}>VAE Latent panel (encoder/decoder)</h2>
              <p style={styles.guidePText}>
                The VAE provides a compact representation <span style={styles.kbd}>z ∈ ℝ¹⁶</span>. You can (a) initialize{" "}
                <span style={styles.kbd}>z</span> from GT via Sync, (b) manually edit latent sliders, and (c) decode{" "}
                <span style={styles.kbd}>z</span> into an image.
              </p>

              <h3 style={styles.guideH3}>How to use it</h3>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>
                  Use <b>Sync</b> to set latent <span style={styles.kbd}>z</span> from the GT image.
                </li>
                <li style={styles.guideLi}>
                  Move latent sliders to explore what the decoder does.
                </li>
              </ul>

              <div style={styles.guideWarn}>
                <p style={styles.guideCalloutTitle}>Common confusion</p>
                <p style={styles.guideCalloutText}>
                  Editing latent sliders is <b>not</b> guaranteed to correspond to a valid GT physics state. It’s a learned
                  representation; it may produce images that don’t map cleanly to GT.
                </p>
              </div>
            </Anchor>

            <Anchor id="lstm" title="Visualizer: LSTM Rollout" styles={styles}>
              <h2 style={styles.guideH2}>LSTM Rollout panel</h2>
              <p style={styles.guidePText}>
                The LSTM rollout updates latent state using actions:{" "}
                <span style={styles.kbd}>zₜ, aₜ, (hₜ,cₜ) → zₜ₊₁, (hₜ₊₁,cₜ₊₁)</span>. The visualization is the decoded image
                of <span style={styles.kbd}>z</span>.
              </p>

              <h3 style={styles.guideH3}>What should change on an action</h3>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>Latent values update.</li>
                <li style={styles.guideLi}>Hidden state updates (h/c).</li>
                <li style={styles.guideLi}>Decoded latent image updates.</li>
              </ul>

              <div style={styles.guideCallout}>
                <p style={styles.guideCalloutTitle}>Reset button meaning</p>
                <p style={styles.guideCalloutText}>
                  Reset latent & hidden clears the rollout memory. Use it when switching scenarios, or if the LSTM drifted
                  into garbage.
                </p>
              </div>
            </Anchor>

            <Anchor id="piwm" title="Visualizer: PIWM" styles={styles}>
              <h2 style={styles.guideH2}>PIWM panel (state ↔ image + learned dynamics)</h2>
              <p style={styles.guidePText}>PIWM consists of three conceptual parts:</p>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}><b>PIWM encoder</b>: observation image → PIWM state.</li>
                <li style={styles.guideLi}><b>PIWM decoder</b>: PIWM state → reconstructed observation image.</li>
                <li style={styles.guideLi}><b>PIWM predictor</b>: PIWM state + action → next PIWM state.</li>
              </ul>

              <div style={styles.guideWarn}>
                <p style={styles.guideCalloutTitle}>Important: PIWM image ≠ GT renderer</p>
                <p style={styles.guideCalloutText}>
                  PIWM images are produced by a learned decoder, not the python renderer. Small differences are expected.
                </p>
              </div>
            </Anchor>

            <Anchor id="sync" title="Sync rules: what sync does (and doesn’t)" styles={styles}>
              <h2 style={styles.guideH2}>Sync: exact meaning</h2>
              <p style={styles.guidePText}>
                When you click <b>Sync GT → VAE + PIWM</b>, the app should align representations by encoding the GT frame.
              </p>

              <div style={styles.guideCode}>
                <b>Expected order</b> (conceptual):
                {"\n"}1) Render GT image
                {"\n"}2) Encode GT → latent (VAE)
                {"\n"}3) Encode GT → PIWM state (PIWM encoder)
                {"\n"}4) Decode latent → latent image (VAE decoder)
                {"\n"}5) Decode PIWM state → PIWM image (PIWM decoder)
              </div>
            </Anchor>

            <Anchor id="actions" title="Actions: what happens on a step" styles={styles}>
              <h2 style={styles.guideH2}>Action buttons: exact meaning</h2>
              <p style={styles.guidePText}>
                Each click of <b>Action: Left</b> or <b>Action: Right</b> should apply exactly one step to each model.
              </p>

              <MiniTable
                styles={styles}
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

            <Anchor id="interpretation" title="How to interpret results" styles={styles}>
              <h2 style={styles.guideH2}>Interpreting what you see</h2>

              <h3 style={styles.guideH3}>1) Initialization alignment</h3>
              <p style={styles.guidePText}>
                Immediately after Sync, do the latent-decoded and PIWM-decoded images resemble the GT image?
              </p>

              <h3 style={styles.guideH3}>2) Short-horizon action fidelity (1–5 steps)</h3>
              <p style={styles.guidePText}>
                After a few actions, do the models move the cart/pole in a direction consistent with GT?
              </p>

              <h3 style={styles.guideH3}>3) Long-horizon drift (10–50 steps)</h3>
              <p style={styles.guidePText}>
                Over many steps, models will drift. The interesting part is the <b>type</b> of drift: blurring, mode
                collapse, delayed response, or incorrect geometry.
              </p>
            </Anchor>

            <Anchor id="faq" title="FAQ" styles={styles}>
              <h2 style={styles.guideH2}>FAQ</h2>

              <h3 style={styles.guideH3}>“Why do the learned images not exactly match Ground Truth?”</h3>
              <p style={styles.guidePText}>
                GT is a deterministic renderer. Learned decoders approximate the observation distribution and may blur,
                shift, or distort details—especially under distribution shift or long rollouts.
              </p>

              <h3 style={styles.guideH3}>“Why do I need Sync? Can’t I just start rolling out?”</h3>
              <p style={styles.guidePText}>
                You can, but then the models’ internal state may not correspond to the GT frame you’re looking at. Sync is
                what aligns them to the same starting observation so comparisons are meaningful.
              </p>

              <h3 style={styles.guideH3}>“What’s the right way to compare LSTM vs PIWM?”</h3>
              <p style={styles.guidePText}>
                Sync from a known GT state, then apply the same action sequence. Compare short-horizon fidelity and drift modes.
              </p>
            </Anchor>

            <Anchor id="ort" title="onnxruntime-web stability notes" styles={styles}>
              <h2 style={styles.guideH2}>onnxruntime-web stability notes (practical)</h2>
              <p style={styles.guidePText}>
                ORT can throw <b>“Session already started”</b> if two inferences overlap, and <b>“Session mismatch”</b> during
                dev hot refresh if stale async work finishes after a re-mount.
              </p>

              <h3 style={styles.guideH3}>What users should do</h3>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>
                  If the page shows an ORT error, click <b>Reset</b> buttons and <b>Sync</b> again. Avoid spamming action buttons.
                </li>
                <li style={styles.guideLi}>
                  In development, if errors persist, refresh the page to clear in-flight runs.
                </li>
              </ul>

              <h3 style={styles.guideH3}>What the implementation should do</h3>
              <ul style={styles.guideUl}>
                <li style={styles.guideLi}>
                  Serialize all <span style={styles.kbd}>session.run()</span> calls through one global queue (not one queue per session).
                </li>
                <li style={styles.guideLi}>
                  Guard async completion with a “latest token” so stale runs don’t draw.
                </li>
                <li style={styles.guideLi}>
                  Optionally force single-threaded wasm:{" "}
                  <span style={styles.kbd}>ort.env.wasm.numThreads = 1</span>,{" "}
                  <span style={styles.kbd}>ort.env.wasm.proxy = false</span>
                </li>
              </ul>
            </Anchor>
          </main>
        </div>
      </div>
    </div>
  );
}

