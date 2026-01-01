"use client";

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none textured-surface">
      {/* Statischer Hintergrund: Schwarz im Darkmode, #E2D7CE im Lightmode */}
      <div className="absolute inset-0 bg-background transition-colors duration-500" />
    </div>
  );
}