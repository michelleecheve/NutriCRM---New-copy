import React, { useState } from 'react';
import { Bookmark, Check, FileText, Layout, X, ChevronDown } from 'lucide-react';
import { MenuRecommendationData } from '../../../types';
import { MenuPlanData } from '../../menus_components/MenuDesignTemplates';
import { store } from '../../../services/store';
import { menuPlanDataToReferenceData } from './helpers';

interface SaveAsTemplateButtonProps {
  menuPreviewData: MenuPlanData | null;
}

export const SaveAsTemplateButton: React.FC<SaveAsTemplateButtonProps> = ({ menuPreviewData }) => {
  const [showModal, setShowModal] = useState(false);
  const [saveTemplateType, setSaveTemplateType] = useState<'ref' | 'rec' | 'eating_out' | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveEatingOutName, setSaveEatingOutName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveTemplateSuccess, setSaveTemplateSuccess] = useState<'ref' | 'rec' | 'eating_out' | null>(null);

  const handleOpen = () => {
    setSaveTemplateType(null);
    setSaveTemplateName('');
    setSaveEatingOutName('');
    setSaveTemplateSuccess(null);
    setShowModal(true);
  };

  const handleSaveAsRef = async () => {
    if (!menuPreviewData) return;
    setIsSavingTemplate(true);
    try {
      const refData = menuPlanDataToReferenceData(menuPreviewData);
      await store.saveMenuReference({ data: refData });
      setSaveTemplateSuccess('ref');
      setTimeout(() => { setShowModal(false); setSaveTemplateSuccess(null); }, 2000);
    } catch (err) {
      console.error('Error saving reference:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSaveAsEatingOut = async () => {
    if (!menuPreviewData?.eatingOutPage || !saveEatingOutName.trim()) return;
    setIsSavingTemplate(true);
    try {
      await store.saveMenuRecommendation({
        name: saveEatingOutName.trim(),
        data: menuPreviewData.eatingOutPage as unknown as MenuRecommendationData,
        type: 'eating_out',
      });
      setSaveTemplateSuccess('eating_out');
      setSaveEatingOutName('');
      setTimeout(() => { setShowModal(false); setSaveTemplateSuccess(null); }, 2000);
    } catch (err) {
      console.error('Error saving eating out recommendation:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSaveAsRec = async () => {
    if (!menuPreviewData || !saveTemplateName.trim()) return;
    setIsSavingTemplate(true);
    try {
      const recData: MenuRecommendationData = {
        preparacion:   menuPreviewData.recommendations?.preparacion   || [],
        restricciones: menuPreviewData.recommendations?.restricciones || [],
        habitos:       menuPreviewData.recommendations?.habitos       || [],
        organizacion:  menuPreviewData.recommendations?.organizacion  || [],
        sectionTitles: menuPreviewData.sectionTitles || undefined,
      };
      await store.saveMenuRecommendation({ name: saveTemplateName.trim(), data: recData });
      setSaveTemplateSuccess('rec');
      setSaveTemplateName('');
      setTimeout(() => { setShowModal(false); setSaveTemplateSuccess(null); }, 2000);
    } catch (err) {
      console.error('Error saving recommendation:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const refData = menuPreviewData ? menuPlanDataToReferenceData(menuPreviewData) : null;
  const totalRecs = menuPreviewData?.recommendations
    ? (menuPreviewData.recommendations.preparacion?.length || 0)
      + (menuPreviewData.recommendations.restricciones?.length || 0)
      + (menuPreviewData.recommendations.habitos?.length || 0)
      + (menuPreviewData.recommendations.organizacion?.length || 0)
    : 0;
  const hasRecs = totalRecs > 0;
  const hasEatingOut = !!(menuPreviewData?.eatingOutPage);
  const isIntercambio = menuPreviewData?.menuType === 'intercambio';

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm border-2 border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
      >
        <Bookmark className="w-4 h-4" />
        Guardar como plantilla
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-emerald-600" />
                Opciones para guardar como plantilla
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {saveTemplateSuccess === 'ref' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-emerald-700">Referencia guardada correctamente</span>
                </div>
              )}
              {saveTemplateSuccess === 'rec' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-emerald-700">Recomendaciones generales guardadas correctamente</span>
                </div>
              )}
              {saveTemplateSuccess === 'eating_out' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-emerald-700">Plantilla de comer afuera guardada correctamente</span>
                </div>
              )}

              {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'ref') && (
                <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-xl flex-shrink-0">
                      <Layout className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800">
                        {isIntercambio ? 'Referencia de porciones y menú intercambio' : 'Referencia de porciones y menú semanal'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {refData
                          ? `${refData.kcal} kcal · ${refData.meals.length} tiempos de comida`
                          : 'Tabla de porciones y estructura del menú'}
                      </div>
                    </div>
                  </div>
                  {saveTemplateType === 'ref' ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSaveTemplateType(null)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        ← Volver
                      </button>
                      <button
                        onClick={handleSaveAsRef}
                        disabled={isSavingTemplate}
                        className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingTemplate ? 'Guardando...' : <><Bookmark className="w-4 h-4" />Guardar Referencia</>}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSaveTemplateType('ref')}
                      className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-blue-200"
                    >
                      Guardar como Referencia →
                    </button>
                  )}
                </div>
              )}

              {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'rec') && (
                <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl flex-shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800">Recomendaciones generales</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {hasRecs
                          ? `${totalRecs} elementos · preparación, restricciones y hábitos`
                          : 'Este menú no tiene recomendaciones generales'}
                      </div>
                    </div>
                  </div>
                  {saveTemplateType === 'rec' ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre de la plantilla..."
                        value={saveTemplateName}
                        onChange={e => setSaveTemplateName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSaveTemplateType(null)}
                          className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          ← Volver
                        </button>
                        <button
                          onClick={handleSaveAsRec}
                          disabled={isSavingTemplate || !saveTemplateName.trim()}
                          className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSavingTemplate ? 'Guardando...' : <><Bookmark className="w-4 h-4" />Guardar Recomendación</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSaveTemplateType('rec')}
                      disabled={!hasRecs}
                      className="w-full py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!hasRecs ? 'Este menú no tiene recomendaciones generales' : ''}
                    >
                      Guardar como Recomendación →
                    </button>
                  )}
                </div>
              )}

              {!saveTemplateSuccess && (saveTemplateType === null || saveTemplateType === 'eating_out') && (
                <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-50 p-2 rounded-xl flex-shrink-0">
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800">Comer afuera</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {hasEatingOut
                          ? 'Guía de opciones para comer fuera de casa'
                          : 'Este menú no tiene sección de comer afuera'}
                      </div>
                    </div>
                  </div>
                  {saveTemplateType === 'eating_out' ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre de la plantilla..."
                        value={saveEatingOutName}
                        onChange={e => setSaveEatingOutName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSaveTemplateType(null)}
                          className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                        >
                          ← Volver
                        </button>
                        <button
                          onClick={handleSaveAsEatingOut}
                          disabled={isSavingTemplate || !saveEatingOutName.trim()}
                          className="bg-orange-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSavingTemplate ? 'Guardando...' : <><Bookmark className="w-4 h-4" />Guardar Comer Afuera</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSaveTemplateType('eating_out')}
                      disabled={!hasEatingOut}
                      className="w-full py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-orange-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={!hasEatingOut ? 'Este menú no tiene sección de comer afuera' : ''}
                    >
                      Guardar como Comer Afuera →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
