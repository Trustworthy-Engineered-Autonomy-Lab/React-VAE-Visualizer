
import React from "react";

export function Dot({ styles, color, "aria-hidden": ariaHidden = true }) {
  return <span style={styles.dot(color)} aria-hidden={ariaHidden} />;
}

export function Pill({ styles, bg, border, dotColor, children }) {
  return (
    <span style={styles.pill(bg, border)}>
      <Dot styles={styles} color={dotColor} />
      {children}
    </span>
  );
}
