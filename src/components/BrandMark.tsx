"use client";

/**
 * Serotonin brand mark — a brain (the real serotonin.win logo motif) rendered
 * in our blue→purple theme. White hemispheres with accent-tinted folds on a
 * gradient rounded square. Reads cleanly from 14px up.
 */
export default function BrandMark({ size = 28, radius }: { size?: number; radius?: number }) {
  const inner = Math.round(size * 0.66);
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
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" className="relative">
        {/* hemispheres, filled */}
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" fill="white" fillOpacity="0.97" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" fill="white" fillOpacity="0.97" />
        {/* central fissure + gyri, knocked out in accent */}
        <path d="M12 5.4V17.6" stroke="var(--accent)" strokeOpacity="0.38" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" stroke="var(--accent)" strokeOpacity="0.42" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
