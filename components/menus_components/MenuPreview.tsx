import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MenuTemplateV1, MenuTemplateV2, MenuPlanData } from './MenuDesignTemplates';
import { Layout, Pencil } from 'lucide-react';
import { store } from '../../services/store';

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
  onEditPlanTitle?: () => void;
  onEditPage2Title?: () => void;
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
    onEditPlanTitle?: () => void;
    onEditPage2Title?: () => void;
  }
): EditZone[] {
  const z: EditZone[] = [];

  if (cbs.onEditPlanTitle)
    z.push({ id: 'planTitle', top: 20, right: 180, onClick: cbs.onEditPlanTitle, title: 'Editar título del plan' });

  if (cbs.onEditPage2Title)
    z.push({ id: 'page2Title', top: 1257, right: 234, onClick: cbs.onEditPage2Title, title: 'Editar título página 2' });

  if (cbs.onEditPatientInfo)
    z.push({ id: 'patient', top: 58, left: 386, onClick: cbs.onEditPatientInfo, title: 'Editar info paciente' });

  if (cbs.onEditPortions)
    z.push({ id: 'portions', top: 115, right: 386, onClick: cbs.onEditPortions, title: 'Editar tabla de porciones' });

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
  onEditPlanTitle,
  onEditPage2Title,
}) => {
  const [internalZoom, setInternalZoom] = useState(0.8);
  const [internalTemplate, setInternalTemplate] = useState("plantilla_v1");
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(defaultEditMode);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ initialDist: number; initialZoom: number } | null>(null);

  const currentZoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const currentTemplate = onTemplateChange ? selectedTemplate : internalTemplate;

  const hasEditCallbacks = !!(
    onEditPatientInfo || onEditPortions || onEditDay ||
    onEditTemplateNote || onEditHydration || onEditRecSection ||
    onEditDomingoLibre || onEditDomingoCompleto || onEditPlanTitle || onEditPage2Title
  );

  const updateZoom = (newZoom: number) => {
    if (setExternalZoom) setExternalZoom(newZoom);
    else setInternalZoom(newZoom);
  };

  const updateTemplate = (id: string) => {
    if (onTemplateChange) onTemplateChange(id);
    else setInternalTemplate(id);
  };

  const getPinchDist = (touches: TouchList) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );

  // Keep a ref to updateZoom so the non-passive listener always sees latest value
  const updateZoomRef = useRef(updateZoom);
  updateZoomRef.current = updateZoom;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { initialDist: getPinchDist(e.nativeEvent.touches), initialZoom: currentZoom };
    }
  }, [currentZoom]);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  // Non-passive touchmove listener so preventDefault() actually works for pinch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const newDist = getPinchDist(e.touches);
        const ratio = newDist / pinchRef.current.initialDist;
        const newZoom = Math.min(2, Math.max(0.3, pinchRef.current.initialZoom * ratio));
        updateZoomRef.current(newZoom);
      }
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) return;
    const ratio = el.scrollTop / scrollable;
    setCurrentPage(ratio > 0.5 ? 2 : 1);
  };

  const renderTemplate = () => {
    const is4col = currentTemplate.endsWith('_4col');
    const gridLayout = is4col ? '4col' : '3col';
    const pageLayout = (store.getMenuTemplate()?.pageLayout) || 'layout1';
    if (currentTemplate.startsWith('plantilla_v2')) {
      return <MenuTemplateV2 data={data} gridLayout={gridLayout} pageLayout={pageLayout} />;
    }
    return <MenuTemplateV1 data={data} gridLayout={gridLayout} pageLayout={pageLayout} />;
  };

  const editZones = editMode
    ? buildEditZones(currentTemplate, {
        onEditPatientInfo, onEditPortions, onEditDay,
        onEditTemplateNote, onEditHydration, onEditRecSection,
        onEditDomingoLibre, onEditDomingoCompleto, onEditPlanTitle, onEditPage2Title,
      })
    : [];

  return (
    <div className="space-y-6">
      {/* ── Header bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-4">
        {/* Row 1 (mobile) / Left (desktop): title + templates + edit */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vista Previa</h3>

          {!hideTemplateSelector && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => updateTemplate(currentTemplate.endsWith('_4col') ? 'plantilla_v1_4col' : 'plantilla_v1')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  currentTemplate.startsWith('plantilla_v1')
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-3 h-3" />
                Plantilla V1
              </button>
              <button
                onClick={() => updateTemplate(currentTemplate.endsWith('_4col') ? 'plantilla_v2_4col' : 'plantilla_v2')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  currentTemplate.startsWith('plantilla_v2')
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-3 h-3" />
                Plantilla V2
              </button>
            </div>
          )}

          {/* Edit mode toggle — desktop only */}
          {hasEditCallbacks && (
            <button
              onClick={() => setEditMode(prev => !prev)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
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

        {/* Row 2 (mobile) / Right (desktop): edit + zoom */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Edit mode toggle — mobile only */}
          {hasEditCallbacks && (
            <button
              onClick={() => setEditMode(prev => !prev)}
              className={`flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                editMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
          )}

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
      </div>

      {/* ── Preview area ── */}
      <div className="relative">

        {/* Side edit panel — posicionado sobre la zona gris, mitad de página 1 */}
        {editMode && currentPage === 1 && (onEditDay || onEditDomingoLibre || onEditDomingoCompleto || onEditHydration || onEditTemplateNote) && (
          <div
            data-html2canvas-ignore="true"
            className="absolute left-2 z-20 flex flex-col gap-1"
            style={{ top: '30%' }}
          >
            {(['lunes','martes','miercoles','jueves','viernes','sabado'] as const).map((day, i) => {
              const labels = ['lun','mar','mier','jue','vie','sáb'];
              return onEditDay ? (
                <button
                  key={day}
                  onClick={() => onEditDay(day)}
                  title={`Editar ${day}`}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/50 hover:bg-indigo-600 text-white transition-all shadow-sm whitespace-nowrap"
                >
                  {labels[i]}
                </button>
              ) : null;
            })}

            {currentTemplate === 'plantilla_v1' && onEditDomingoLibre && (
              <button
                onClick={onEditDomingoLibre}
                title="Editar domingo (día libre)"
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/50 hover:bg-indigo-600 text-white transition-all shadow-sm whitespace-nowrap"
              >
                dom
              </button>
            )}
            {currentTemplate === 'plantilla_v2' && onEditDomingoCompleto && (
              <button
                onClick={onEditDomingoCompleto}
                title="Editar domingo (menú completo)"
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/50 hover:bg-indigo-600 text-white transition-all shadow-sm whitespace-nowrap"
              >
                dom
              </button>
            )}

            {currentTemplate === 'plantilla_v2' && onEditTemplateNote && (
              <button
                onClick={onEditTemplateNote}
                title="Editar notas"
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-500/50 hover:bg-slate-600 text-white transition-all shadow-sm whitespace-nowrap"
              >
                notas
              </button>
            )}

            {onEditHydration && (
              <button
                onClick={onEditHydration}
                title="Editar meta de hidratación"
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-500/50 hover:bg-slate-600 text-white transition-all shadow-sm whitespace-nowrap"
              >
                hidrat.
              </button>
            )}
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-slate-200 rounded-3xl overflow-auto border border-slate-300 shadow-inner h-[850px]"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {/* Inner centering wrapper: min-width: 100% keeps it centered on wide screens;
              fit-content lets it grow wider than the container on mobile so overflow-x scrolls */}
          <div style={{ display: 'flex', justifyContent: 'center', minWidth: '100%', width: 'fit-content', padding: '16px 32px' }}>
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
        </div>

        {/* Page indicator */}
        <div className="absolute bottom-4 right-6 bg-slate-800/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
          Página {currentPage} / 2
        </div>
      </div>
    </div>
  );
};
