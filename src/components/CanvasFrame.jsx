
import React from "react";

export function CanvasFrame({ canvasRef, width, height, style }) {
  return <canvas ref={canvasRef} width={width} height={height} style={style} />;
}
