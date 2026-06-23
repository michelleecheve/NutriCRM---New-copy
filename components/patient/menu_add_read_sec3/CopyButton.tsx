import React, { useState } from 'react';
import { Copy, Check, X, ChevronDown } from 'lucide-react';
import { Patient, VetCalculation } from '../../../types';
import { MenuPlanData } from '../../menus_components/MenuDesignTemplates';
import { EatingOutPageData } from '../../menus_components/menudesigntemplates_components/menuTemplateTypes';
import { MenuReferenceParsertoMenuData } from '../../menus_components/Menu_References_Components/MenuReferenceParsertoMenuData';
import { calcPortionsTotal } from '../../menus_components/Menu_References_Components/MenuReferencesStorage';
import { store } from '../../../services/store';
import { buildBlankMenuPlanData, getNutritionistData, withTemplateTitles } from './helpers';

interface CopyButtonProps {
  selectedReferenceIds: string[];
  selectedRecommendationIds: string[];
  menuPreviewData: MenuPlanData | null;
  patient: Patient;
  vetData: VetCalculation;
  evaluationId: string | null;
  isLocked: boolean;
  onMenuDataChange: (data: MenuPlanData) => void;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  selectedReferenceIds,
  selectedRecommendationIds,
  menuPreviewData,
  patient,
  vetData,
  evaluationId,
  isLocked,
  onMenuDataChange,
  label = 'Copiar de Plantillas',
  className,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCopyRefId, setSelectedCopyRefId] = useState<string | null>(null);
  const [selectedCopyRecId, setSelectedCopyRecId] = useState<string | null>(null);
  const [selectedCopyEatingOutRecId, setSelectedCopyEatingOutRecId] = useState<string | null>(null);

  const availableRefs = store.menuReferences.filter(r => selectedReferenceIds.includes(r.id));
  const availableRecs = store.menuRecommendations.filter(r => selectedRecommendationIds.includes(r.id));
  const availableGeneralRecs = availableRecs.filter(r => !r.type || r.type === 'general');
  const availableEatingOutRecs = availableRecs.filter(r => r.type === 'eating_out');

  const handleOpen = () => {
    if (availableRefs.length === 0 && availableRecs.length === 0) return;
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
    setSelectedCopyEatingOutRecId(null);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selectedCopyRefId && !selectedCopyRecId && !selectedCopyEatingOutRecId) return;

    let plan: MenuPlanData;

    if (selectedCopyRefId) {
      const ref = store.menuReferences.find(x => x.id === selectedCopyRefId);
      if (!ref) return;
      if ((ref.data as any)?.type === 'INTERCAMBIO') {
        const blank = buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
        const slots = (ref.data as any).portions ?? [];
        const totals = calcPortionsTotal(slots);
        const byMeal: Record<string, any> = {};
        slots.forEach((s: any) => { byMeal[s.id] = { ...s.portions, label: s.label }; });
        plan = {
          ...blank,
          menuType: 'intercambio',
          exchangeMenu: (ref.data as any).exchangeMenu,
          kcal: (ref.data as any).kcal || 0,
          portions: { ...totals, byMeal },
        };
      } else {
        plan = MenuReferenceParsertoMenuData(ref.data);
      }
      if (!selectedCopyEatingOutRecId && menuPreviewData?.eatingOutPage) {
        plan = { ...plan, eatingOutPage: menuPreviewData.eatingOutPage };
      }
    } else {
      plan = menuPreviewData
        ? { ...menuPreviewData }
        : buildBlankMenuPlanData(patient, vetData, getNutritionistData(), evaluationId);
    }

    if (selectedCopyRecId) {
      const rec = store.menuRecommendations.find(x => x.id === selectedCopyRecId);
      if (rec) {
        plan = {
          ...plan,
          recommendations: {
            preparacion:   rec.data.preparacion   || [],
            restricciones: rec.data.restricciones || [],
            habitos:       rec.data.habitos       || [],
            organizacion:  rec.data.organizacion  || [],
          },
        };
      }
    }

    if (selectedCopyEatingOutRecId) {
      const eoRec = store.menuRecommendations.find(x => x.id === selectedCopyEatingOutRecId);
      if (eoRec) {
        plan = {
          ...plan,
          eatingOutPage: {
            ...(eoRec.data as unknown as EatingOutPageData),
            visible: true,
          },
        };
      }
    }

    let fat = 0;
    if (evaluationId) {
      const bio = patient.bioimpedancias?.find(b => b.evaluation_id === evaluationId);
      if (bio) {
        fat = bio.body_fat_pct;
      } else {
        const meas = patient.measurements?.find(m => m.linkedEvaluationId === evaluationId);
        if (meas) fat = meas.bodyFat || 0;
      }
    }

    onMenuDataChange(withTemplateTitles({
      ...plan,
      patient: {
        name: `${patient.firstName} ${patient.lastName}`,
        age: vetData.age || patient.clinical?.age || 0,
        weight: vetData.weight || 0,
        height: vetData.height || 0,
        fatPct: fat,
      },
      kcal: vetData.kcalToWork || plan.kcal,
      nutritionist: getNutritionistData(),
    }));

    setShowModal(false);
    setSelectedCopyRefId(null);
    setSelectedCopyRecId(null);
    setSelectedCopyEatingOutRecId(null);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isLocked || (availableRefs.length === 0 && availableRecs.length === 0)}
        title={
          isLocked
            ? 'Desbloquea para usar este botón'
            : availableRefs.length === 0 && availableRecs.length === 0
            ? 'Selecciona referencias o recomendaciones en la sección anterior'
            : 'Copiar estructura y datos de una referencia o recomendaciones'
        }
        className={className ?? `shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${
          isLocked || (availableRefs.length === 0 && availableRecs.length === 0)
            ? 'border-slate-100 text-slate-300 cursor-not-allowed'
            : 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <Copy className="w-4 h-4" />
        {label}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-600" />
                Copiar de Plantillas
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Referencias de menú */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Selecciona qué plantilla de referencia copiar
                </p>
                {availableRefs.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4 text-center">
                    No hay referencias seleccionadas en la sección anterior.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableRefs.map(ref => {
                      const isSelected = selectedCopyRefId === ref.id;
                      return (
                        <button
                          key={ref.id}
                          onClick={() => setSelectedCopyRefId(prev => prev === ref.id ? null : ref.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                              : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {ref.data.kcal} kcal
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {ref.data?.type === 'INTERCAMBIO'
                                ? (ref.data?.portions?.length ?? 0)
                                : (ref.data?.meals?.length ?? 0)} tiempos · {ref.data?.type}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recomendaciones generales */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Selecciona plantilla de recomendaciones generales
                </p>
                {availableGeneralRecs.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4 text-center">
                    No hay plantillas de recomendaciones generales seleccionadas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableGeneralRecs.map(rec => {
                      const isSelected = selectedCopyRecId === rec.id;
                      return (
                        <button
                          key={rec.id}
                          onClick={() => setSelectedCopyRecId(prev => prev === rec.id ? null : rec.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                              : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {rec.name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              Recomendaciones generales · hoja 2
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comer afuera */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Selecciona plantilla de comer afuera
                </p>
                {availableEatingOutRecs.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4 text-center">
                    No hay plantillas de comer afuera seleccionadas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableEatingOutRecs.map(rec => {
                      const isSelected = selectedCopyEatingOutRecId === rec.id;
                      return (
                        <button
                          key={rec.id}
                          onClick={() => setSelectedCopyEatingOutRecId(prev => prev === rec.id ? null : rec.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                              : 'bg-white border-slate-200 hover:border-orange-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                              {rec.name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              Comer afuera · hoja 3 · se activará visible
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedCopyRefId && !selectedCopyRecId && !selectedCopyEatingOutRecId}
                className="bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                Copiar Seleccionado
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
