import React, { useState, useRef } from 'react';
import {
  Eye, EyeOff,
  X,
  Lock, Unlock, Palette, Pin,
  FileText, Pencil
} from 'lucide-react';
import { prefsService } from '../../services/prefsService';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, MenuDesignConfig } from '../../types';
import { MenuDesignPanel } from '../menus_components/MenuDesignPanel';
import { MenuPlanData } from '../menus_components/MenuDesignTemplates';
import { MenuExportPDF } from '../menus_components/MenuExportPDF';
import { MenuEditorToolbar, MenuEditorToolbarHandle } from '../menus_components/MenuEditorToolbar';
import { MenuPreview } from '../menus_components/MenuPreview';
import { MenuEditSec3 } from '../menus_components/menu_edit_sec3/MenuEditSec3';
import { store } from '../../services/store';
import { CopyButton } from './menu_add_read_sec3/CopyButton';
import { SaveAsTemplateButton } from './menu_add_read_sec3/SaveAsTemplateButton';
import { ActionButtons } from './menu_add_read_sec3/ActionButtons';
import { buildBlankMenuPlanData, getNutritionistData, withTemplateTitles } from './menu_add_read_sec3/helpers';

interface MenuAddReadSec3Props {
  patient: Patient;
  vetData: VetCalculation;
  macros: MacrosRecord;
  portions: PortionsRecord;
  evaluationId: string | null;
  selectedTemplateId: string;
  selectedReferenceIds: string[];
  selectedRecommendationIds: string[];
  menuPreviewData: MenuPlanData | null;
  setMenuPreviewData: (data: MenuPlanData | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  selectedPreviewTemplate: string;
  setSelectedPreviewTemplate: (id: string) => void;
  localDesignConfig: MenuDesignConfig;
  setLocalDesignConfig: (cfg: MenuDesignConfig) => void;
  onDirty?: () => void;
}

export const MenuAddReadSec3: React.FC<MenuAddReadSec3Props> = ({
  patient,
  vetData,
  macros,
  portions,
  selectedTemplateId,
  selectedReferenceIds,
  selectedRecommendationIds,
  menuPreviewData,
  setMenuPreviewData,
  zoom,
  setZoom,
  selectedPreviewTemplate,
  setSelectedPreviewTemplate,
  localDesignConfig,
  setLocalDesignConfig,
  evaluationId,
  onDirty
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [editMode, setEditMode] = useState<'tabla' | 'preview'>('tabla');
  const [editTablaKey, setEditTablaKey] = useState(0);
  const [isLocked, setIsLocked] = useState<boolean>(() => prefsService.get('menus.locked', false));
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [isBannerPinned, setIsBannerPinned] = useState(() => prefsService.get('menus.bannerPinned', true));

  const toolbarRef = useRef<MenuEditorToolbarHandle>(null);

  const handleSetMenuPreviewData = (data: MenuPlanData | null) => {
    setMenuPreviewData(data);
    onDirty?.();
  };

  const handleSetMenuPreviewDataFromToolbar = (data: MenuPlanData | null) => {
    setMenuPreviewData(data);
    setEditTablaKey(k => k + 1);
    onDirty?.();
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedPreviewTemplate(templateId);
    setLocalDesignConfig({ ...localDesignConfig, templateDesign: templateId as MenuDesignConfig['templateDesign'] });
  };

  const handleDesignChange = (updates: Partial<MenuDesignConfig>) => {
    const next = { ...localDesignConfig, ...updates };
    setLocalDesignConfig(next);
    if (updates.templateDesign) {
      setSelectedPreviewTemplate(updates.templateDesign);
    }
  };

  const handleDomingoModeChange = (mode: 'libre' | 'completo') => {
    if (!menuPreviewData) return;
    handleSetMenuPreviewData({
      ...menuPreviewData,
      weeklyMenu: { ...menuPreviewData.weeklyMenu, domingoMode: mode },
    });
    setEditTablaKey(k => k + 1);
  };

  const handleStartBlank = () => {
    const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
    const defaultDomingoMode: 'libre' | 'completo' = localDesignConfig.templateDesign.startsWith('plantilla_v2') ? 'completo' : 'libre';
    const withDefaultDomingoMode = {
      ...blank,
      weeklyMenu: { ...blank.weeklyMenu, domingoMode: defaultDomingoMode },
    };
    handleSetMenuPreviewData(withTemplateTitles(withDefaultDomingoMode));
    setEditTablaKey(k => k + 1);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div
        onClick={() => setIsVisible(!isVisible)}
        className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors rounded-t-3xl overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <Pencil className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Edición y Preview</h2>
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const next = !isLocked;
            setIsLocked(next);
            prefsService.set('menus.locked', next);
          }}
          title={isLocked ? 'Desbloquear botones de generación' : 'Bloquear botones de generación para evitar cambios accidentales'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isLocked
              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isLocked ? 'Bloqueado' : 'Bloquear'}</span>
        </button>
      </div>

      <div className={isVisible ? 'p-8 space-y-8' : 'hidden'}>

        {/* Design Config Modal */}
        {designModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-violet-600" />
                  Configurar diseño para este menú
                </h3>
                <button onClick={() => setDesignModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <MenuDesignPanel
                  templateDesign={localDesignConfig.templateDesign}
                  pageLayout={localDesignConfig.pageLayout}
                  visualTheme={localDesignConfig.visualTheme}
                  onChange={handleDesignChange}
                  domingoMode={menuPreviewData?.weeklyMenu?.domingoMode ?? 'libre'}
                  onDomingoModeChange={handleDomingoModeChange}
                />
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex-shrink-0">
                <button
                  onClick={() => setDesignModalOpen(false)}
                  className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {!menuPreviewData ? (
          <div className="flex gap-3">
            <button
              onClick={handleStartBlank}
              disabled={isLocked}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all border-2 text-sm ${
                isLocked
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              Iniciar Menú en Blanco
            </button>
            <CopyButton
              selectedReferenceIds={selectedReferenceIds}
              selectedRecommendationIds={selectedRecommendationIds}
              menuPreviewData={menuPreviewData}
              patient={patient}
              vetData={vetData}
              evaluationId={evaluationId}
              isLocked={isLocked}
              onMenuDataChange={(data) => {
                handleSetMenuPreviewData(data);
                setEditTablaKey(k => k + 1);
              }}
              label="Iniciar copiando de plantillas cargadas"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all border-2 text-sm border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:border-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <ActionButtons
              patient={patient}
              vetData={vetData}
              evaluationId={evaluationId}
              menuPreviewData={menuPreviewData}
              onMenuDataChange={handleSetMenuPreviewData}
              onRemountTable={() => setEditTablaKey(k => k + 1)}
            />
            <CopyButton
              selectedReferenceIds={selectedReferenceIds}
              selectedRecommendationIds={selectedRecommendationIds}
              menuPreviewData={menuPreviewData}
              patient={patient}
              vetData={vetData}
              evaluationId={evaluationId}
              isLocked={isLocked}
              onMenuDataChange={(data) => {
                handleSetMenuPreviewData(data);
                setEditTablaKey(k => k + 1);
              }}
            />
            <SaveAsTemplateButton menuPreviewData={menuPreviewData} />
            <MenuExportPDF
              elementId="menu-print-area"
              filename={`Menu_${patient.firstName}_${new Date().toISOString().split('T')[0]}`}
              disabled={!menuPreviewData}
              className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 text-sm border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            />
          </div>
        )}

        {/* Área de edición y preview */}
        {menuPreviewData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Barra sticky de modo edición */}
            <div className={`${isBannerPinned ? 'sticky top-0 z-20' : ''} bg-white/95 backdrop-blur-sm -mx-8 px-8 py-2.5 border-b border-slate-100 shadow-sm flex items-center gap-2 flex-wrap`}>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-fit">
                  <button
                    onClick={() => setEditMode('tabla')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      editMode === 'tabla'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    ✏️ Editar en Tabla
                  </button>
                  <button
                    onClick={() => setEditMode('preview')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      editMode === 'preview'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    👁 Vista Previa
                  </button>
                </div>
                <button
                  onClick={() => {
                    const next = !isBannerPinned;
                    setIsBannerPinned(next);
                    prefsService.set('menus.bannerPinned', next);
                  }}
                  title={isBannerPinned ? 'Desanclar barra (scroll normal)' : 'Anclar barra (sticky)'}
                  className={`p-1.5 rounded-lg transition-all ${
                    isBannerPinned
                      ? 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
                      : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
              {editMode === 'preview' && (
                <button
                  onClick={() => setDesignModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 text-violet-600 hover:bg-violet-100 hover:text-violet-700"
                >
                  <Palette className="w-3.5 h-3.5" />
                  Configurar diseño
                </button>
              )}
            </div>

            {/* Editor en tabla */}
            <div style={{ display: editMode === 'tabla' ? '' : 'none' }}>
              <MenuEditSec3
                key={`tabla-${editTablaKey}-${menuPreviewData.kcal}-${menuPreviewData.patient.name}`}
                menuPreviewData={menuPreviewData}
                setMenuPreviewData={handleSetMenuPreviewData}
                portions={portions}
                visible={editMode === 'tabla'}
              />
            </div>

            {/* Vista previa */}
            {editMode === 'preview' && (
              <>
                <MenuPreview
                  data={menuPreviewData}
                  zoom={zoom}
                  setZoom={setZoom}
                  elementId="menu-print-area"
                  selectedTemplate={selectedPreviewTemplate}
                  onTemplateChange={handleTemplateChange}
                  visualTheme={localDesignConfig.visualTheme}
                  pageLayout={localDesignConfig.pageLayout}
                  onEditPatientInfo={() => toolbarRef.current?.openPatientInfo()}
                  onEditPortions={() => toolbarRef.current?.openPortions()}
                  onEditDay={(day) => toolbarRef.current?.openDay(day)}
                  onEditTemplateNote={() => toolbarRef.current?.openTemplateNote()}
                  onEditHydration={() => toolbarRef.current?.openHydration()}
                  onEditRecSection={(section) => toolbarRef.current?.openRecSection(section)}
                  onEditDomingoLibre={() => toolbarRef.current?.openDomingoLibre()}
                  onEditDomingoCompleto={() => toolbarRef.current?.openDomingoCompleto()}
                  onEditPlanTitle={() => toolbarRef.current?.openPlanTitle()}
                  onEditPage2Title={() => toolbarRef.current?.openPage2Title()}
                />
                <MenuEditorToolbar
                  ref={toolbarRef}
                  menuPreviewData={menuPreviewData}
                  setMenuPreviewData={handleSetMenuPreviewDataFromToolbar}
                  patient={patient}
                  vetData={vetData}
                  portions={portions}
                  evaluationId={evaluationId}
                />
              </>
            )}

            {/* Preview oculto para que el PDF siempre encuentre menu-print-area */}
            {editMode === 'tabla' && (
              <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
                <MenuPreview
                  data={menuPreviewData}
                  elementId="menu-print-area"
                  selectedTemplate={selectedPreviewTemplate}
                  hideTemplateSelector
                  visualTheme={localDesignConfig.visualTheme}
                  pageLayout={localDesignConfig.pageLayout}
                />
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  );
};
