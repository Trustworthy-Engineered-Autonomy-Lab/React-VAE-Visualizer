import React from "react";
import { useNavigate } from "react-router-dom";

export function MenuCard({ item, styles }) {
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
        ...styles.interactiveCard,
        ...(hover ? styles.interactiveCardHover : null),
        ...(focus ? styles.interactiveCardFocus : null),
        gridColumn: item.span,
      }}
      aria-label={`Go to ${item.title}`}
    >
      <div style={styles.dotBox(item.iconBg, item.iconBorder)} aria-hidden>
        <span style={styles.dotBoxText}>{item.title}</span>
      </div>

      <p style={styles.homeDesc}>{item.desc}</p>
    </div>
  );
}
