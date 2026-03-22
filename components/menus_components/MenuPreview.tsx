import React, { useState, useRef } from 'react';
import { MenuTemplateV1, MenuTemplateV2, MenuPlanData } from './MenuDesignTemplates';
import { Layout } from 'lucide-react';

interface MenuPreviewProps {
  data: MenuPlanData;
  elementId?: string;
  zoom?: number;
  setZoom?: (z: number) => void;
  selectedTemplate?: string;
  onTemplateChange?: (id: string) => void;
  hideTemplateSelector?: boolean;
}

export const MenuPreview: React.FC<MenuPreviewProps> = ({ 
  data, 
  elementId = "menu-print-area",
  zoom: externalZoom,
  setZoom: setExternalZoom,
  selectedTemplate = "plantilla_v1",
  onTemplateChange,
  hideTemplateSelector = false
}) => {
  const [internalZoom, setInternalZoom] = useState(0.8);
  const [internalTemplate, setInternalTemplate] = useState("plantilla_v1");
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentZoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const currentTemplate = onTemplateChange ? selectedTemplate : internalTemplate;

  const updateZoom = (newZoom: number) => {
    if (setExternalZoom) {
      setExternalZoom(newZoom);
    } else {
      setInternalZoom(newZoom);
    }
  };

  const updateTemplate = (id: string) => {
    if (onTemplateChange) {
      onTemplateChange(id);
    } else {
      setInternalTemplate(id);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vista Previa</h3>
          
          {!hideTemplateSelector && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => updateTemplate('plantilla_v1')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  currentTemplate === 'plantilla_v1' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-3 h-3" />
                Plantilla V1
              </button>
              <button 
                onClick={() => updateTemplate('plantilla_v2')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  currentTemplate === 'plantilla_v2' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layout className="w-3 h-3" />
                Plantilla V2
              </button>
            </div>
          )}
        </div>

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
              transition: 'transform 0.2s ease-out'
            }}
          >
            <div id={elementId} style={{ width: '100%' }}>
              {renderTemplate()}
            </div>
          </div>
        </div>

        {/* Indicador de página */}
        <div className="absolute bottom-4 right-6 bg-slate-800/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
          Página {currentPage} / 2
        </div>
      </div>
    </div>
  );
};
