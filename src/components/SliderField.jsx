import React from "react";

export function SliderField({
  styles,
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
  width,
  unused = false,
  inputStyle,
}) {
  return (
    <div style={{ opacity: unused ? 0.55 : 1 }}>
      <div style={styles.sliderLabel}>
        <span style={{ color: unused ? "#64748b" : undefined }}>{label}</span>
        <span style={{ color: unused ? "#64748b" : undefined }}>{displayValue ?? value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        style={{
          ...styles.slider,
          ...(width ? { width } : {}),
          // Force accentColor when unused (matches your original behavior)
          accentColor: unused ? "#94a3b8" : styles.slider?.accentColor,
          ...(inputStyle ?? {}),
        }}
      />
    </div>
  );
}

