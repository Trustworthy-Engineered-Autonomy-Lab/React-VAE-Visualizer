
import React from "react";

export function PageHeader({
  styles,
  title,
  subtitle,
  right,
  callout,
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={styles.h1}>{title}</h1>
          {subtitle ? <p style={styles.lead}>{subtitle}</p> : null}
        </div>

        {right ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{right}</div> : null}
      </div>

      {callout ? <div style={styles.callout}>{callout}</div> : null}
    </div>
  );
}
