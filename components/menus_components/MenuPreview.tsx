import React, { useState, useRef } from 'react';
import { MenuTemplateV1, MenuTemplateV2, MenuPlanData } from './MenuDesignTemplates';
import { Layout, Pencil } from 'lucide-react';

type RecSection = 'preparacion' | 'restricciones' | 'habitos' | 'organizacion';

interface MenuPreviewProps {
  data: MenuPlanData;
  elementId?: string;
  zoom?: number;
  setZoom?: (z: number) => void;
  selectedTemplate?: string;
  onTemplateChange?: (id: string) => void;
  hideTemplateSelector?: boolean;
  defaultEditMode?: boolean;
  onEditPatientInfo?: () => void;
  onEditPortions?: () => void;
  onEditDay?: (day: string) => void;
  onEditTemplateNote?: () => void;
  onEditHydration?: () => void;
  onEditRecSection?: (section: RecSection) => void;
  onEditDomingoLibre?: () => void;
  onEditDomingoCompleto?: () => void;
}

interface EditZone {
  id: string;
  top: number;
  left?: number;
  right?: number;
  onClick: () => void;
  title: string;
}

// ─── Edit zone coordinate reference ──────────────────────────────────────────
// Template natural width: 210mm ≈ 794px. Content padding: 20px left/right → 754px usable.
//
// 3-col flex row (gap 6px): card width ≈ 247px
//   col right edges: 267, 520, 773 → icon left (center on edge): 255, 508, 761
//
// 4-col flex row (gap 6px): card width ≈ 184px
//   col right edges: 204, 394, 584, 774 → icon left: 192, 382, 572, 762
//
// 2-col grid (gap 15px): card width ≈ 370px
//   col right edges: 390, 775 → icon left: 378, 763
//
// Row Y positions (approximate px from template top, icons placed at row top + 2px):
//   PatientBar start  :  84   (14px padding + ~60px Header + 12px margin → ~86, -2)
//   PortionsTable top : 130   (PatientBar ~32px + 12px margin)
//   Menu row 1 top    : 356   (PortionsTable ~188px + 12px margin + "MENÚ" label ~26px)
//   Menu row 2 top    : 526   (row1 164px + 6px gap)
//   Domingo/NOTAS row : 704   (row2 164px + 8px gap)
//   Page 2 grid row 1 :1308   (1139px page2 start + 14px pad + ~155px headers)
//   Page 2 grid row 2 :1735   (row1 + ~412px card height + 15px gap)
// ─────────────────────────────────────────────────────────────────────────────

const COL3_LEFT = [255, 508, 761] as const;
const COL4_LEFT = [192, 382, 572, 762] as const;
const COL2_LEFT = [378, 763] as const;

function buildEditZones(
  template: string,
  cbs: {
    onEditPatientInfo?: () => void;
    onEditPortions?: () => void;
    onEditDay?: (day: string) => void;
    onEditTemplateNote?: () => void;
    onEditHydration?: () => void;
    onEditRecSection?: (s: RecSection) => void;
    onEditDomingoLibre?: () => void;
    onEditDomingoCompleto?: () => void;
  }
): EditZone[] {
  const z: EditZone[] = [];

  if (cbs.onEditPatientInfo)
    z.push({ id: 'patient', top: 84, left: 386, onClick: cbs.onEditPatientInfo, title: 'Editar info paciente' });

  if (cbs.onEditPortions)
    z.push({ id: 'portions', top: 130, right: 24, onClick: cbs.onEditPortions, title: 'Editar tabla de porciones' });

  // Row 1: Lunes, Martes, Miércoles — same in both templates
  (['lunes', 'martes', 'miercoles'] as const).forEach((day, i) => {
    if (cbs.onEditDay)
      z.push({ id: day, top: 356, left: COL3_LEFT[i], onClick: () => cbs.onEditDay!(day), title: `Editar ${day}` });
  });

  if (template === 'plantilla_v1') {
    // Row 2: 3 cols (Jueves, Viernes, Sábado)
    (['jueves', 'viernes', 'sabado'] as const).forEach((day, i) => {
      if (cbs.onEditDay)
        z.push({ id: day, top: 526, left: COL3_LEFT[i], onClick: () => cbs.onEditDay!(day), title: `Editar ${day}` });
    });
    // DomingoRow V1: abre popup de Día Libre (nota únicamente)
    const domingoLibreCb = cbs.onEditDomingoLibre ?? (cbs.onEditDay ? () => cbs.onEditDay!('domingo') : undefined);
    if (domingoLibreCb)
      z.push({ id: 'domingo', top: 704, left: 420, onClick: domingoLibreCb, title: 'Editar domingo (día libre)' });
    if (cbs.onEditHydration)
      z.push({ id: 'hydration', top: 704, right: 24, onClick: cbs.onEditHydration, title: 'Editar meta de hidratación' });
  } else {
    // Row 2: 4 cols (Jueves, Viernes, Sábado, Domingo completo)
    (['jueves', 'viernes', 'sabado'] as const).forEach((day, i) => {
      if (cbs.onEditDay)
        z.push({ id: day, top: 526, left: COL4_LEFT[i], onClick: () => cbs.onEditDay!(day), title: `Editar ${day}` });
    });
    // DayCard Domingo V2: abre popup de Menú Completo
    const domingoCompletoCb = cbs.onEditDomingoCompleto ?? (cbs.onEditDay ? () => cbs.onEditDay!('domingo') : undefined);
    if (domingoCompletoCb)
      z.push({ id: 'domingo', top: 526, left: COL4_LEFT[3], onClick: domingoCompletoCb, title: 'Editar domingo (menú completo)' });
    // NOTAS row: note (center) + hydration (right)
    if (cbs.onEditTemplateNote)
      z.push({ id: 'note', top: 704, left: 420, onClick: cbs.onEditTemplateNote, title: 'Editar notas' });
    if (cbs.onEditHydration)
      z.push({ id: 'hydration', top: 704, right: 24, onClick: cbs.onEditHydration, title: 'Editar meta de hidratación' });
  }

  // Page 2: 4 recommendation cards (2×2 grid)
  (['preparacion', 'restricciones', 'habitos', 'organizacion'] as const).forEach((section, i) => {
    if (cbs.onEditRecSection)
      z.push({
        id: section,
        top: i < 2 ? 1308 : 1735,
        left: COL2_LEFT[i % 2],
        onClick: () => cbs.onEditRecSection!(section),
        title: `Editar ${section}`,
      });
  });

  return z;
}

export const MenuPreview: React.FC<MenuPreviewProps> = ({
  data,
  elementId = "menu-print-area",
  zoom: externalZoom,
  setZoom: setExternalZoom,
  selectedTemplate = "plantilla_v1",
  onTemplateChange,
  hideTemplateSelector = false,
  defaultEditMode = false,
  onEditPatientInfo,
  onEditPortions,
  onEditDay,
  onEditTemplateNote,
  onEditHydration,
  onEditRecSection,
  onEditDomingoLibre,
  onEditDomingoCompleto,
}) => {
  const [internalZoom, setInternalZoom] = useState(0.8);
  const [internalTemplate, setInternalTemplate] = useState("plantilla_v1");
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(defaultEditMode);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentZoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const currentTemplate = onTemplateChange ? selectedTemplate : internalTemplate;

  const hasEditCallbacks = !!(
    onEditPatientInfo || onEditPortions || onEditDay ||
    onEditTemplateNote || onEditHydration || onEditRecSection ||
    onEditDomingoLibre || onEditDomingoCompleto
  );

  const updateZoom = (newZoom: number) => {
    if (setExternalZoom) setExternalZoom(newZoom);
    else setInternalZoom(newZoom);
  };

  const updateTemplate = (id: string) => {
    if (onTemplateChange) onTemplateChange(id);
    else setInternalTemplate(id);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) return;
    const ratio = el.scrollTop / scrollable;
    setCurrentPage(ratio > 0.5 ? 2 : 1);
  };

  const renderTemplate = () => {
    switch (currentTemplate) {
      case 'plantilla_v2':
        return <MenuTemplateV2 data={data} />;
      case 'plantilla_v1':
      default:
        return <MenuTemplateV1 data={data} />;
    }
  };

  const editZones = editMode
    ? buildEditZones(currentTemplate, {
        onEditPatientInfo, onEditPortions, onEditDay,
        onEditTemplateNote, onEditHydration, onEditRecSection,
        onEditDomingoLibre, onEditDomingoCompleto,
      })
    : [];

  return (
    <div className="space-y-6">
      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vista Previa</h3>

          {!hideTemplateSelector && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => updateTemplate('plantilla_v1')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  currentTemplate === 'plantilla_v1'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-3 h-3" />
                Plantilla V1
              </button>
              <button
                onClick={() => updateTemplate('plantilla_v2')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  currentTemplate === 'plantilla_v2'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-3 h-3" />
                Plantilla V2
              </button>
            </div>
          )}

          {/* Edit mode toggle — only visible when edit callbacks are provided */}
          {hasEditCallbacks && (
            <button
              onClick={() => setEditMode(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                editMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => updateZoom(Math.max(0.4, currentZoom - 0.1))}
            className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500 font-bold w-8"
          >
            -
          </button>
          <span className="text-[10px] font-bold text-slate-600 w-12 text-center">
            {Math.round(currentZoom * 100)}%
          </span>
          <button
            onClick={() => updateZoom(Math.min(1.5, currentZoom + 0.1))}
            className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500 font-bold w-8"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Preview area ── */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="bg-slate-200 p-4 md:p-8 rounded-3xl overflow-y-auto flex justify-center border border-slate-300 shadow-inner h-[850px]"
        >
          <div
            style={{
              transform: `scale(${currentZoom})`,
              transformOrigin: 'top center',
              width: '210mm',
              height: 'auto',
              backgroundColor: 'transparent',
              transition: 'transform 0.2s ease-out',
              position: 'relative',
            }}
          >
            {/* Template — untouched, used by PDF export */}
            <div id={elementId} style={{ width: '100%' }}>
              {renderTemplate()}
            </div>

            {/* Edit overlay — sibling to template, inherits scale transform */}
            {editMode && editZones.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                {editZones.map(zone => (
                  <button
                    key={zone.id}
                    onClick={zone.onClick}
                    title={zone.title}
                    style={{
                      position: 'absolute',
                      top: zone.top,
                      ...(zone.left  !== undefined ? { left:  zone.left  } : {}),
                      ...(zone.right !== undefined ? { right: zone.right } : {}),
                      pointerEvents: 'auto',
                    }}
                    className="w-[22px] h-[22px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:scale-110 transition-all"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Page indicator */}
        <div className="absolute bottom-4 right-6 bg-slate-800/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
          Página {currentPage} / 2
        </div>
      </div>
    </div>
  );
};
