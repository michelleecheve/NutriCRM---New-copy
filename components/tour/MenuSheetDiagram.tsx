import React from 'react';

interface Band {
  label: string;
  height: number;
  fill: string;
  textColor: string;
}

interface Quadrant {
  label: string;
  fill: string;
  textColor: string;
}

// Proporción A4 (1 : 1.414) — el "página" del diagrama respeta ese ratio para que
// se lea como una hoja real, no como una tira angosta.
const PAGE_W = 127;
const TOTAL_H = 180;
const PAGE_Y = 10;

// Layout apilado (Hoja 1 y Hoja 3): la página va pegada a la izquierda del
// viewBox, las etiquetas salen todas hacia la derecha.
const STACK_PAGE_X = 20;
// Layout en cruz (Hoja 2): la página va centrada, dos etiquetas salen a la
// izquierda y dos a la derecha.
const GRID_PAGE_X = 106;

const VIEWBOX_W = 340;
const VIEWBOX_H = 200;
const LINE_HEIGHT = 10;

const STACK_DIAGRAMS: Record<'hoja1' | 'hoja3', Band[]> = {
  hoja1: [
    { label: 'Encabezado', height: 22, fill: '#a7f3d0', textColor: '#047857' },
    { label: 'Tabla de\nporciones', height: 32, fill: '#bae6fd', textColor: '#0369a1' },
    { label: 'Menú semanal /\nde intercambio', height: 99, fill: '#c7d2fe', textColor: '#4338ca' },
    { label: 'Pie de página', height: 27, fill: '#e2e8f0', textColor: '#475569' },
  ],
  hoja3: [
    { label: 'Título de\nla hoja', height: 20, fill: '#e2e8f0', textColor: '#475569' },
    { label: 'Notas', height: 35, fill: '#a7f3d0', textColor: '#047857' },
    { label: 'Tabla de\nrestaurantes', height: 125, fill: '#fde68a', textColor: '#b45309' },
  ],
};

const GRID_DIAGRAM: [Quadrant, Quadrant, Quadrant, Quadrant] = [
  { label: 'Preparación de\nalimentos', fill: '#a7f3d0', textColor: '#047857' },
  { label: 'Restricciones\nespecíficas', fill: '#bae6fd', textColor: '#0369a1' },
  { label: 'Hábitos\nsaludables', fill: '#c7d2fe', textColor: '#4338ca' },
  { label: 'Organización y\nhorarios', fill: '#fde68a', textColor: '#b45309' },
];

function renderLabel(x: number, y: number, label: string, textColor: string, anchor: 'start' | 'end') {
  const lines = label.split('\n');
  const startDy = -((lines.length - 1) * LINE_HEIGHT) / 2 + 3;
  return (
    <text x={x} y={y} fontSize={9} fontWeight={700} fill={textColor} textAnchor={anchor}>
      {lines.map((line, li) => (
        <tspan key={li} x={x} dy={li === 0 ? startDy : LINE_HEIGHT}>{line}</tspan>
      ))}
    </text>
  );
}

function StackDiagram({ variant }: { variant: 'hoja1' | 'hoja3' }) {
  const bands = STACK_DIAGRAMS[variant];
  let y = PAGE_Y;
  const rows = bands.map(b => {
    const row = { ...b, y, cy: y + b.height / 2 };
    y += b.height;
    return row;
  });

  return (
    <>
      <rect x={STACK_PAGE_X - 2} y={PAGE_Y - 2} width={PAGE_W + 4} height={TOTAL_H + 4} rx={6} fill="white" stroke="#cbd5e1" strokeWidth={1.5} />
      {rows.map((r, i) => (
        <rect key={`band-${i}`} x={STACK_PAGE_X} y={r.y} width={PAGE_W} height={r.height} fill={r.fill} />
      ))}
      <rect x={STACK_PAGE_X} y={PAGE_Y} width={PAGE_W} height={TOTAL_H} rx={4} fill="none" stroke="#94a3b8" strokeWidth={1} />
      {rows.map((r, i) => {
        const edgeX = STACK_PAGE_X + PAGE_W;
        const leaderEndX = edgeX + 14;
        const textX = leaderEndX + 4;
        return (
          <g key={`lbl-${i}`}>
            <line x1={edgeX} y1={r.cy} x2={leaderEndX} y2={r.cy} stroke={r.textColor} strokeWidth={1.2} />
            <circle cx={edgeX} cy={r.cy} r={2} fill={r.textColor} />
            {renderLabel(textX, r.cy, r.label, r.textColor, 'start')}
          </g>
        );
      })}
    </>
  );
}

function GridDiagram() {
  const qW = PAGE_W / 2;
  const qH = TOTAL_H / 2;
  const positions: { x: number; y: number; side: 'left' | 'right' }[] = [
    { x: GRID_PAGE_X, y: PAGE_Y, side: 'left' },            // Preparación (arriba-izq.)
    { x: GRID_PAGE_X + qW, y: PAGE_Y, side: 'right' },      // Restricciones (arriba-der.)
    { x: GRID_PAGE_X, y: PAGE_Y + qH, side: 'left' },       // Hábitos (abajo-izq.)
    { x: GRID_PAGE_X + qW, y: PAGE_Y + qH, side: 'right' }, // Organización (abajo-der.)
  ];

  return (
    <>
      <rect x={GRID_PAGE_X - 2} y={PAGE_Y - 2} width={PAGE_W + 4} height={TOTAL_H + 4} rx={6} fill="white" stroke="#cbd5e1" strokeWidth={1.5} />
      {GRID_DIAGRAM.map((q, i) => (
        <rect key={`q-${i}`} x={positions[i].x} y={positions[i].y} width={qW} height={qH} fill={q.fill} />
      ))}
      {/* división en cruz */}
      <line x1={GRID_PAGE_X + qW} y1={PAGE_Y} x2={GRID_PAGE_X + qW} y2={PAGE_Y + TOTAL_H} stroke="white" strokeWidth={2.5} />
      <line x1={GRID_PAGE_X} y1={PAGE_Y + qH} x2={GRID_PAGE_X + PAGE_W} y2={PAGE_Y + qH} stroke="white" strokeWidth={2.5} />
      <rect x={GRID_PAGE_X} y={PAGE_Y} width={PAGE_W} height={TOTAL_H} rx={4} fill="none" stroke="#94a3b8" strokeWidth={1} />
      {GRID_DIAGRAM.map((q, i) => {
        const pos = positions[i];
        const cy = pos.y + qH / 2;
        const isLeft = pos.side === 'left';
        const edgeX = isLeft ? GRID_PAGE_X : GRID_PAGE_X + PAGE_W;
        const leaderEndX = isLeft ? edgeX - 14 : edgeX + 14;
        const textX = isLeft ? leaderEndX - 4 : leaderEndX + 4;
        return (
          <g key={`lbl-${i}`}>
            <line x1={edgeX} y1={cy} x2={leaderEndX} y2={cy} stroke={q.textColor} strokeWidth={1.2} />
            <circle cx={edgeX} cy={cy} r={2} fill={q.textColor} />
            {renderLabel(textX, cy, q.label, q.textColor, isLeft ? 'end' : 'start')}
          </g>
        );
      })}
    </>
  );
}

// Diagrama esquemático de una hoja del menú, con proporción A4 real y líneas guía
// que apuntan a una etiqueta por cada división. Hoja 1 y Hoja 3 se dibujan apiladas
// de arriba a abajo; Hoja 2 se dibuja en cruz (2 columnas x 2 filas), reflejando el
// diseño real de esa página. Puramente decorativo — no depende del estado del
// formulario, solo se usa en los pasos introductorios ilustrados del tour.
export const MenuSheetDiagram: React.FC<{ variant: 'hoja1' | 'hoja2' | 'hoja3' }> = ({ variant }) => (
  <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} width={220} height={130} className="shrink-0">
    {variant === 'hoja2' ? <GridDiagram /> : <StackDiagram variant={variant} />}
  </svg>
);
