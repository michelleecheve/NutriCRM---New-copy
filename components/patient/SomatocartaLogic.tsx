// Esta es la logica del somatocarta chart.

// Esta es la logica del somatocarta chart.

import React from 'react';

export const SomatocartaLogic: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  // Internal coordinate system for viewBox
  const W = 500;
  const H = 500;
  const P = 60; // Padding for labels and illustrations

  // Axis range
  const X_MIN = -10, X_MAX = 10;
  const Y_MIN = -10, Y_MAX = 10;

  // Map data coords → SVG pixels with padding
  const toSVG = (dx: number, dy: number) => ({
    x: P + ((dx - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * P),
    y: H - P - ((dy - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * P),
  });

  const origin = toSVG(0, 0);
  const MESO = toSVG(0, 10);
  const ENDO = toSVG(-8, -8);
  const ECTO = toSVG(8, -8);
  const pt = toSVG(x, y);

  // Curved boundary path using arcs
  const r = 400;
  const boundaryPath = `
    M ${MESO.x} ${MESO.y}
    A ${r} ${r} 0 0 1 ${ECTO.x} ${ECTO.y}
    A ${r} ${r} 0 0 1 ${ENDO.x} ${ENDO.y}
    A ${r} ${r} 0 0 1 ${MESO.x} ${MESO.y}
  `;

  const xTicks = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
  const yTicks = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        {/* Grid */}
        {xTicks.map((tx) => {
          const sx = toSVG(tx, 0).x;
          return <line key={`gx${tx}`} x1={sx} y1={P} x2={sx} y2={H - P} stroke="#E2E8F0" strokeWidth="0.5" />;
        })}
        {yTicks.map((ty) => {
          const sy = toSVG(0, ty).y;
          return <line key={`gy${ty}`} x1={P} y1={sy} x2={W - P} y2={sy} stroke="#E2E8F0" strokeWidth="0.5" />;
        })}

        {/* Main axes */}
        <line x1={P} y1={origin.y} x2={W - P} y2={origin.y} stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1={origin.x} y1={P} x2={origin.x} y2={H - P} stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Curved boundary */}
        <path d={boundaryPath} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6,4" />

        {/* Lines from origin to vertices */}
        <line x1={origin.x} y1={origin.y} x2={MESO.x} y2={MESO.y} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={origin.x} y1={origin.y} x2={ENDO.x} y2={ENDO.y} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={origin.x} y1={origin.y} x2={ECTO.x} y2={ECTO.y} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4,4" />

        {/* Minimal silhouettes */}
        <g transform={`translate(${MESO.x}, ${MESO.y - 35}) scale(0.5)`}>
          <path d="M-12,0 L12,0 L18,10 L12,45 L-12,45 L-18,10 Z" fill="#047857" opacity="0.15" />
          <circle cx="0" cy="-12" r="8" fill="#047857" opacity="0.25" />
          <path d="M-15,8 Q0,2 15,8" fill="none" stroke="#047857" strokeWidth="2.5" opacity="0.4" />
        </g>

        <g transform={`translate(${ENDO.x - 35}, ${ENDO.y + 15}) scale(0.5)`}>
          <ellipse cx="0" cy="22" rx="20" ry="25" fill="#1D4ED8" opacity="0.15" />
          <circle cx="0" cy="-12" r="8" fill="#1D4ED8" opacity="0.25" />
        </g>

        <g transform={`translate(${ECTO.x + 35}, ${ECTO.y + 15}) scale(0.5)`}>
          <rect x="-8" y="0" width="16" height="45" rx="6" fill="#B45309" opacity="0.15" />
          <circle cx="0" cy="-12" r="8" fill="#B45309" opacity="0.25" />
        </g>

        {/* Labels */}
        <text x={MESO.x} y={MESO.y - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="#064E3B" className="font-sans">Mesomorfia</text>
        <text x={ENDO.x - 5} y={ENDO.y + 25} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1E3A8A" className="font-sans">Endomorfia</text>
        <text x={ECTO.x + 5} y={ECTO.y + 25} textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350F" className="font-sans">Ectomorfia</text>

        {/* Axis ticks */}
        {xTicks.filter(t => t % 4 === 0).map(t => (
          <text key={`tx${t}`} x={toSVG(t, 0).x} y={origin.y + 16} textAnchor="middle" fontSize="10" fill="#94A3B8" fontWeight="600" className="font-mono">{t}</text>
        ))}
        {yTicks.filter(t => t % 4 === 0).map(t => (
          <text key={`ty${t}`} x={origin.x - 10} y={toSVG(0, t).y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" className="font-mono">{t}</text>
        ))}

        {/* Data point */}
        <circle cx={pt.x} cy={pt.y} r="6" fill="#10B981" stroke="white" strokeWidth="2.5" className="drop-shadow-sm" />
        <text x={pt.x} y={pt.y - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#064E3B" className="font-mono">
          ({x.toFixed(1)}, {y.toFixed(1)})
        </text>
      </svg>
    </div>
  );
};