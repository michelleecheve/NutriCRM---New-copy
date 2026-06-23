import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MenuTemplateV1, MenuTemplateV2, MenuTemplateExchange, MenuPlanData } from './MenuDesignTemplates';
import { store } from '../../services/store';
import { MenuDesignOverrideContext } from './MenuDesignContext';
import type { VisualThemeConfig, PageLayoutOption } from '../../types';

type RecSection = 'preparacion' | 'restricciones' | 'habitos' | 'organizacion';

interface MenuPreviewProps {
  data: MenuPlanData;
  elementId?: string;
  zoom?: number;
  setZoom?: (z: number) => void;
  selectedTemplate?: string;
  onTemplateChange?: (id: string) => void;
  hideTemplateSelector?: boolean;
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
  visualTheme?: VisualThemeConfig;
  pageLayout?: PageLayoutOption;
}



export const MenuPreview: React.FC<MenuPreviewProps> = ({
  data,
  elementId = "menu-print-area",
  zoom: externalZoom,
  setZoom: setExternalZoom,
  selectedTemplate = "plantilla_v1",
  onTemplateChange,
  hideTemplateSelector = false,
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
  visualTheme,
  pageLayout: pageLayoutProp,
}) => {
  const [internalZoom, setInternalZoom] = useState(0.8);
  const [internalTemplate, setInternalTemplate] = useState("plantilla_v1");
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ initialDist: number; initialZoom: number } | null>(null);

  const currentZoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const currentTemplate = onTemplateChange ? selectedTemplate : internalTemplate;


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
    const pageLayout = pageLayoutProp ?? (store.getMenuTemplate()?.pageLayout) ?? 'layout1';

    let template: React.ReactElement;
    if (data.menuType === 'intercambio') {
      template = <MenuTemplateExchange data={data} pageLayout={pageLayout} />;
    } else if (data.weeklyMenu?.domingoMode === 'completo') {
      // Auto-determine V2 from domingoMode — no manual selector needed
      template = <MenuTemplateV2 data={data} gridLayout={gridLayout} pageLayout={pageLayout} />;
    } else {
      template = <MenuTemplateV1 data={data} gridLayout={gridLayout} pageLayout={pageLayout} />;
    }

    return (
      <MenuDesignOverrideContext.Provider value={visualTheme ? { visualTheme } : null}>
        {template}
      </MenuDesignOverrideContext.Provider>
    );
  };


  return (
    <div className="space-y-6">
      {/* ── Header bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-4">
        {/* Row 1 (mobile) / Left (desktop): title + templates + edit */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vista Previa</h3>

          {/* V1/V2 selector removed — auto-determined from domingoMode in the editor */}

        </div>

        {/* Row 2 (mobile) / Right (desktop): edit + zoom */}
        <div className="flex items-center justify-between sm:justify-end gap-3">

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
