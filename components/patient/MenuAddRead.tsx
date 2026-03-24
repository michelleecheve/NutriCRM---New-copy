import React, { useState, useEffect, useMemo } from 'react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, PatientEvaluation, GeneratedMenu } from '../../types';
import { store } from '../../services/store';
import { Calculator, Eye, EyeOff, ArrowLeft, Edit2, Pencil, X, Trash2, AlertTriangle, Save, Check } from 'lucide-react';
import { MenuAddReadSec1 } from './MenuAddReadSec1';
import { MenuAddReadSec2 } from './MenuAddReadSec2';
import { MenuAddReadSec3 } from './MenuAddReadSec3';
import { MenuPlanData } from '../menus_components/MenuDesignTemplates';

const calcDecimalAge = (birthdate: string, refDate: string): number => {
  const birth = new Date(birthdate);
  const ref = refDate ? new Date(refDate) : new Date();
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  return parseFloat((years + months / 12).toFixed(2));
};

interface MenuAddReadProps {
  patient: Patient;
  onUpdate: (p: Patient) => void;
  editingMenuId: string | null;
  onClose: () => void;
}

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmText = 'Sí, eliminar', cancelText = 'Cancelar', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const InfoModal: React.FC<{
  title: string;
  message: string;
  onClose: () => void;
}> = ({ title, message, onClose }) => (
  <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const MenuAddRead: React.FC<MenuAddReadProps> = ({ patient, onUpdate, editingMenuId, onClose }) => {
  const [menuName, setMenuName] = useState('');
  const [currentMenuId, setCurrentMenuId] = useState<string | null>(editingMenuId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCalculationVisible, setIsCalculationVisible] = useState(false);
  const [section1Success, setSection1Success] = useState(false);

  const patientEvaluations: PatientEvaluation[] = useMemo(
    () => store.getEvaluations(patient.id),
    [patient.id]
  );

  const defaultVet: VetCalculation = {
    age: patient.clinical?.age || 0,
    weight: parseFloat(patient.clinical?.initialWeight || '0') || 0,
    height: parseFloat(patient.clinical?.initialHeight || '0') || 0,
    sex: (patient.clinical?.sex === 'Femenino' || patient.clinical?.sex === 'Masculino') ? patient.clinical.sex : 'Femenino',
    activityLevel: 'Moderado',
    activityFactor: 0,
    kcal: 0,
    kcalReal: 0,
    kcalToWork: 0
  };

  const defaultMacros: MacrosRecord = {
    cho: { pct: 50, kcal: 0, g: 0, notes: '' },
    chon: { pct: 20, kcal: 0, g: 0, notes: '' },
    fat: { pct: 30, kcal: 0, g: 0, notes: '' },
    totalKcal: 0
  };

  const defaultPortions: PortionsRecord = {
    lec: 0, lecDesc: 0, fru: 0, veg: 0, cer: 0, carMagra: 0, carSemi: 0, carAlta: 0, gra: 0, azu: 0
  };

  const [vetData, setVetData] = useState<VetCalculation>(defaultVet);
  const [macros, setMacros] = useState<MacrosRecord>(defaultMacros);
  const [portions, setPortions] = useState<PortionsRecord>(defaultPortions);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("base_v1");
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [selectedRecommendationIds, setSelectedRecommendationIds] = useState<string[]>([]);
  const [aiDraftText, setAiDraftText] = useState<string>("");
  const [aiRationale, setAiRationale] = useState<string>("");
  const [menuPreviewData, setMenuPreviewData] = useState<MenuPlanData | null>(null);
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string>('plantilla_v1');
  const [zoom, setZoom] = useState<number>(1);

  // ✅ Estados de vinculación
  const [formEvaluationId, setFormEvaluationId] = useState<string | null>(() =>
    store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id)
  );
  const [evalSelectorOpen, setEvalSelectorOpen] = useState(false);
  const [menuDate, setMenuDate] = useState<string>(() => {
    const evalId = store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id);
    const ev = evalId ? store.getEvaluationById(evalId) : null;
    return ev?.date ?? '';
  });

  const formEvaluation = useMemo(() => {
    if (!formEvaluationId) return null;
    return store.getEvaluationById(formEvaluationId) ?? null;
  }, [formEvaluationId]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  const handleChangeFormEvaluation = (evId: string) => {
    const ev = store.getEvaluationById(evId);
    setFormEvaluationId(evId || null);
    if (ev) {
      setMenuDate(ev.date); // La fecha del menú es la de la evaluación
      store.setSelectedEvaluationId(patient.id, ev.id);
    }
    setEvalSelectorOpen(false);
  };

  useEffect(() => {
    const allMenus = patient.menus || [];
    const menu = currentMenuId ? allMenus.find(m => m.id === currentMenuId) : null;

    if (menu) {
      const loadedVet: VetCalculation = {
        age: menu.age ?? defaultVet.age,
        weight: menu.weightKg ?? defaultVet.weight,
        height: menu.heightCm ?? defaultVet.height,
        sex: (menu.gender === 'Femenino' || menu.gender === 'Masculino') ? menu.gender : defaultVet.sex,
        activityLevel: (menu.vetDetails?.activityLevel as any) ?? defaultVet.activityLevel,
        activityFactor: menu.vetDetails?.activityFactor ?? defaultVet.activityFactor,
        kcal: menu.vetDetails?.tmbKcal ?? defaultVet.kcal,
        kcalReal: menu.vetDetails?.getKcalReal ?? defaultVet.kcalReal,
        kcalToWork: menu.kcalToWork ?? defaultVet.kcalToWork
      };

      setVetData(loadedVet);
      setMacros(menu.macros || defaultMacros);
      setPortions(menu.portions || defaultPortions);
      setMenuName(menu.name || `Menú para ${patient.firstName} ${new Date().toLocaleDateString()}`);
      
      if (menu.templatesReferences) {
        try {
          const parsed = JSON.parse(menu.templatesReferences);
          setSelectedTemplateId(parsed.templateId || "base_v1");
          // ✅ Filter reference IDs to only include those that still exist in the store
          const allRefIds = store.menuReferences.map(r => r.id);
          const validRefIds = (parsed.referenceIds || []).filter((id: string) => allRefIds.includes(id));
          setSelectedReferenceIds(validRefIds);

          // ✅ Filter recommendation IDs to only include those that still exist in the store
          const allRecIds = store.menuRecommendations.map(r => r.id);
          const validRecIds = (parsed.recommendationIds || []).filter((id: string) => allRecIds.includes(id));
          setSelectedRecommendationIds(validRecIds);
        } catch (e) {
          setSelectedTemplateId("base_v1");
          setSelectedReferenceIds([]);
          setSelectedRecommendationIds([]);
        }
      } else {
        setSelectedTemplateId("base_v1");
        setSelectedReferenceIds([]);
        setSelectedRecommendationIds([]);
      }

      setAiDraftText(menu.content || "");
      setAiRationale(menu.aiRationale || "");
      setMenuPreviewData(menu.menuData || null);
      setSelectedPreviewTemplate(menu.templateId || 'plantilla_v1');

      // ✅ Precarga de vinculación: prioridad a linkedEvaluationId, luego date
      const linkedEvalId = (menu as any).linkedEvaluationId as string | undefined;
      const menuDateValue = (menu as any).date as string | undefined;

      if (linkedEvalId && store.getEvaluationById(linkedEvalId)) {
        setFormEvaluationId(linkedEvalId);
        const ev = store.getEvaluationById(linkedEvalId);
        if (ev) setMenuDate(ev.date);
      } else if (menuDateValue) {
        setMenuDate(menuDateValue);
        const match = patientEvaluations.find(e => e.date === menuDateValue);
        setFormEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id));
      } else {
        const fallbackId = store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id);
        const ev = fallbackId ? store.getEvaluationById(fallbackId) : null;
        setFormEvaluationId(fallbackId ?? null);
        setMenuDate(ev?.date ?? '');
      }
    } else {
      setVetData(defaultVet);
      setMacros(defaultMacros);
      setPortions(defaultPortions);
      setMenuName(`Menú para ${patient.firstName} ${new Date().toLocaleDateString()}`);
      setSelectedTemplateId("base_v1");
      setSelectedReferenceIds([]);

      const selected = store.getSelectedEvaluationId(patient.id) ?? store.getLatestEvaluationId(patient.id);
      const ev = selected ? store.getEvaluationById(selected) : null;
      setFormEvaluationId(selected ?? null);
      setMenuDate(ev?.date ?? '');
    }

    setEvalSelectorOpen(false);
  }, [currentMenuId, patient.id]);

  // Auto-fill age from birthdate when evaluation date changes (new menus only)
  useEffect(() => {
    if (!currentMenuId && patient.clinical?.birthdate && formEvaluation?.date) {
      setVetData(prev => ({ ...prev, age: calcDecimalAge(patient.clinical!.birthdate!, formEvaluation!.date) }));
    }
  }, [formEvaluation?.date, currentMenuId]);

  const handleSaveAndClose = async () => {
    if (!formEvaluationId) {
      setInfoModal({ title: 'Falta evaluación', message: 'Primero selecciona una evaluación.' });
      return;
    }
    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) {
      setInfoModal({ title: 'Evaluación no encontrada', message: 'La evaluación seleccionada no existe o fue eliminada.' });
      return;
    }

    // ✅ La fecha del menú es la fecha de la evaluación
    const normalizedDate = ev.date;
    const menuId = currentMenuId || crypto.randomUUID();

    const menuToSave: GeneratedMenu = {
      id: menuId,
      date: normalizedDate,
      linkedEvaluationId: formEvaluationId,
      patientId: patient.id,
      age: vetData.age,
      weightKg: vetData.weight,
      heightCm: vetData.height,
      gender: vetData.sex,
      vetDetails: {
        activityLevel: vetData.activityLevel,
        activityFactor: vetData.activityFactor,
        tmbKcal: vetData.kcal,
        getKcalReal: vetData.kcalReal
      },
      kcalToWork: vetData.kcalToWork,
      macros: macros,
      portions: portions,
      templatesReferences: JSON.stringify({
        templateId: selectedTemplateId,
        referenceIds: selectedReferenceIds,
        recommendationIds: selectedRecommendationIds
      }),
      templateId: selectedPreviewTemplate,
      menuData: menuPreviewData,
      name: menuName || `Menú ${vetData.kcalToWork} kcal`,
      content: aiDraftText,
      aiRationale: aiRationale
    };

    const updatedMenus = [...(patient.menus || [])];

    if (currentMenuId) {
      const idx = updatedMenus.findIndex(m => m.id === currentMenuId);
      if (idx !== -1) {
        updatedMenus[idx] = menuToSave;
      }
    } else {
      updatedMenus.push(menuToSave);
    }

    const updatedPatient = {
      ...patient,
      menus: updatedMenus,
      dietary: {
        ...patient.dietary,
        menus: []
      }
    };
    onUpdate(updatedPatient);
    try {
      await store.saveMenu(formEvaluationId, menuToSave);
      setCurrentMenuId(menuId);
      onClose();
    } catch (error) {
      console.error('Error saving menu:', error);
    }
  };

  const handleSaveOnly = async () => {
    if (!formEvaluationId) {
      setInfoModal({ title: 'Falta evaluación', message: 'Primero selecciona una evaluación.' });
      return;
    }
    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) {
      setInfoModal({ title: 'Evaluación no encontrada', message: 'La evaluación seleccionada no existe o fue eliminada.' });
      return;
    }

    const normalizedDate = ev.date;
    const menuId = currentMenuId || crypto.randomUUID();

    const menuToSave: GeneratedMenu = {
      id: menuId,
      date: normalizedDate,
      linkedEvaluationId: formEvaluationId,
      patientId: patient.id,
      age: vetData.age,
      weightKg: vetData.weight,
      heightCm: vetData.height,
      gender: vetData.sex,
      vetDetails: {
        activityLevel: vetData.activityLevel,
        activityFactor: vetData.activityFactor,
        tmbKcal: vetData.kcal,
        getKcalReal: vetData.kcalReal
      },
      kcalToWork: vetData.kcalToWork,
      macros: macros,
      portions: portions,
      templatesReferences: JSON.stringify({
        templateId: selectedTemplateId,
        referenceIds: selectedReferenceIds,
        recommendationIds: selectedRecommendationIds
      }),
      templateId: selectedPreviewTemplate,
      menuData: menuPreviewData,
      name: menuName || `Menú ${vetData.kcalToWork} kcal`,
      content: aiDraftText,
      aiRationale: aiRationale
    };

    const updatedMenus = [...(patient.menus || [])];

    if (currentMenuId) {
      const idx = updatedMenus.findIndex(m => m.id === currentMenuId);
      if (idx !== -1) {
        updatedMenus[idx] = menuToSave;
      }
    } else {
      updatedMenus.push(menuToSave);
    }

    const updatedPatient = {
      ...patient,
      menus: updatedMenus,
      dietary: {
        ...patient.dietary,
        menus: []
      }
    };
    onUpdate(updatedPatient);
    try {
      await store.saveMenu(formEvaluationId, menuToSave);
      setCurrentMenuId(menuId);
      return true;
    } catch (error) {
      console.error('Error saving menu:', error);
      return false;
    }
  };

  const handleDeleteMenuConfirmed = async () => {
    if (!currentMenuId) {
      setConfirmDeleteOpen(false);
      return;
    }

    const updatedMenus = (patient.menus || []).filter(m => m.id !== currentMenuId);

    const updatedPatient = {
      ...patient,
      menus: updatedMenus,
      dietary: {
        ...patient.dietary,
        menus: []
      }
    };

    onUpdate(updatedPatient);
    try {
      await store.deleteMenu(currentMenuId);
      setConfirmDeleteOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting menu:', error);
    }
  };

  return (
    <>
      {infoModal && (
        <InfoModal
          title={infoModal.title}
          message={infoModal.message}
          onClose={() => setInfoModal(null)}
        />
      )}

      {confirmDeleteOpen && (
        <ConfirmModal
          title="Eliminar menú"
          message="¿Seguro que deseas eliminar este menú? Esta acción no se puede deshacer."
          onCancel={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDeleteMenuConfirmed}
        />
      )}

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        {/* Top Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
              {isEditingName ? (
                <input
                  autoFocus
                  type="text"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="text-lg font-bold text-slate-800 bg-slate-50 border-b-2 border-emerald-500 outline-none px-2 py-1"
                />
              ) : (
                <>
                  <h1 className="text-lg font-bold text-slate-800">{menuName}</h1>
                  <Edit2 className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Regresar
            </button>

            <button
              onClick={handleSaveAndClose}
              className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>

        {/* Info Section */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          {/* ✅ Vinculación con Evaluación */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluación asignada</p>

            {!evalSelectorOpen ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">
                  {formEvaluation ? `${formEvaluation.title ?? formEvaluation.date} — ${formEvaluation.date}` : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => setEvalSelectorOpen(true)}
                  className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Cambiar evaluación asignada"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={formEvaluationId ?? ''}
                  onChange={(e) => handleChangeFormEvaluation(e.target.value)}
                  className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
                  autoFocus
                  disabled={patientEvaluations.length === 0}
                >
                  {patientEvaluations.length === 0 ? (
                    <option value="">Crea una evaluación primero</option>
                  ) : (
                    <>
                      {patientEvaluations.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title ?? ev.date} — {ev.date}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setEvalSelectorOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="pt-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha del menú</label>
              <input
                type="date"
                value={menuDate}
                disabled
                readOnly
                className="mt-1.5 w-full text-sm font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 cursor-not-allowed"
              />
            </div>

            {patientEvaluations.length === 0 && (
              <p className="mt-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                Este paciente no tiene evaluaciones registradas. Crea una evaluación antes de guardar.
              </p>
            )}
          </div>
          
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            onClick={() => setIsCalculationVisible(!isCalculationVisible)}
            className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Cálculo Nutricional</h2>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-emerald-600"
                >
                  {isCalculationVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await handleSaveOnly();
                    if (ok) {
                      setSection1Success(true);
                      setTimeout(() => setSection1Success(false), 3000);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  title="Guardar cambios"
                >
                  {section1Success ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">Guardado con éxito</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span className="text-xs font-bold">Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {isCalculationVisible && (
            <MenuAddReadSec1
              vetData={vetData}
              setVetData={setVetData}
              macros={macros}
              setMacros={setMacros}
              portions={portions}
              setPortions={setPortions}
              birthdate={patient.clinical?.birthdate}
              evaluationDate={formEvaluation?.date ?? ''}
            />
          )}
        </section>

        <MenuAddReadSec2
          selectedReferenceIds={selectedReferenceIds}
          setSelectedReferenceIds={setSelectedReferenceIds}
          selectedRecommendationIds={selectedRecommendationIds}
          setSelectedRecommendationIds={setSelectedRecommendationIds}
          onSave={handleSaveOnly}
        />

        <MenuAddReadSec3
          patient={patient}
          vetData={vetData}
          macros={macros}
          portions={portions}
          evaluationId={formEvaluationId}
          selectedTemplateId={selectedTemplateId}
          selectedReferenceIds={selectedReferenceIds}
          selectedRecommendationIds={selectedRecommendationIds}
          aiDraftText={aiDraftText}
          setAiDraftText={setAiDraftText}
          aiRationale={aiRationale}
          setAiRationale={setAiRationale}
          menuPreviewData={menuPreviewData}
          setMenuPreviewData={setMenuPreviewData}
          zoom={zoom}
          setZoom={setZoom}
          selectedPreviewTemplate={selectedPreviewTemplate}
          setSelectedPreviewTemplate={setSelectedPreviewTemplate}
          onSave={handleSaveOnly}
        />

        {/* Bottom action bar */}
        <div className="flex items-center justify-between pt-4">
          {editingMenuId ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar menú
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleSaveAndClose}
            className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            Guardar y Cerrar
          </button>
        </div>


      </div>
    </>
  );
};