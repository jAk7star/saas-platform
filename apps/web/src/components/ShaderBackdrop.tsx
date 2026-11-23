"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

export function ShaderBackdrop() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    media.addEventListener("change", onChange);

    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }

    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 20% 20%, #1c2541 0%, #0b132b 55%, #070a14 100%)",
      }}
    >
      {webglSupported ? (
        <MeshGradient
          colors={["#0b132b", "#1c2541", "#3a506b", "#1f2937"]}
          speed={reducedMotion ? 0 : 0.25}
          style={{ width: "100%", height: "100%", opacity: 0.85 }}
        />
      ) : null}
    </div>
  );
}
