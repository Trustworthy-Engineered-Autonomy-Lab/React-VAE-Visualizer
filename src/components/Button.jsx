
import React from "react";

export function Button({ variant = "default", styles, disabled, style, children, ...props }) {
  const base = styles.btnVariants[variant] || styles.btnVariants.default;
  const merged = { ...base, ...(disabled ? styles.btnDisabled : {}), ...style };

  return (
    <button disabled={disabled} style={merged} type="button" {...props}>
      {children}
    </button>
  );
}
