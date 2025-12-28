
import React from "react";

export function Card({ style, children, ...props }) {
  return (
    <section style={style} {...props}>
      {children}
    </section>
  );
}

export function CardTitleRow({ style, children }) {
  return <div style={style}>{children}</div>;
}
