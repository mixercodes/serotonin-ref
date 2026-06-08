"use client";

/**
 * Serotonin brand mark — a bold "S" monogram, white on the blue→cyan gradient
 * rounded square. Generic, brandable, crisp from 14px up.
 */
export default function BrandMark({ size = 28, radius }: { size?: number; radius?: number }) {
  const r = radius ?? Math.round(size * 0.3);
  return (
    <span
      className="relative flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
        boxShadow: "0 2px 8px var(--accent-glow)",
      }}
    >
      <span
        className="absolute inset-0 opacity-45"
        style={{ background: "radial-gradient(circle at 30% 22%, white, transparent 62%)" }}
      />
      <span
        className="relative font-sans text-white select-none"
        style={{
          fontSize: Math.round(size * 0.56),
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          textShadow: "0 1px 1px rgba(0,0,0,0.18)",
        }}
      >
        S
      </span>
    </span>
  );
}
