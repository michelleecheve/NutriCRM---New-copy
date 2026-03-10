import React, { useState, useEffect, useMemo } from 'react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord, PatientEvaluation } from '../../types';
import { store } from '../../services/store';
import { Calculator, Eye, EyeOff, ArrowLeft, Edit2, Pencil, X, Trash2, AlertTriangle } from 'lucide-react';
import { MenuAddReadSec1 } from './MenuAddReadSec1';
import { MenuAddReadSec2 } from './MenuAddReadSec2';
import { MenuAddReadSec3 } from './MenuAddReadSec3';
import { MenuPlanData } from '../menus_components/MenuDesignTemplates';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCalculationVisible, setIsCalculationVisible] = useState(true);

  // ✅ Evaluaciones del paciente (para vinculación)
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
  const [aiDraftText, setAiDraftText] = useState<string>("");
  const [aiRationale, setAiRationale] = useState<string>("");
  const [menuPreviewData, setMenuPreviewData] = useState<MenuPlanData | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  // ✅ linking states
  const [formEvaluationId, setFormEvaluationId] = useState<string | null>(store.getSelectedEvaluationId(patient.id));
  const [evalSelectorOpen, setEvalSelectorOpen] = useState(false);
  const [basedOnMeasurementDate, setBasedOnMeasurementDate] = useState<string>(
    store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]
  );

  const formEvaluation = useMemo(() => {
    if (!formEvaluationId) return null;
    return store.getEvaluationById(formEvaluationId) ?? null;
  }, [formEvaluationId]);

  // ✅ modales (sin alert/confirm nativos)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  const handleChangeFormEvaluation = (evId: string) => {
    const ev = store.getEvaluationById(evId);
    setFormEvaluationId(evId || null);
    if (ev) {
      setBasedOnMeasurementDate(ev.date);
      store.setSelectedEvaluationId(patient.id, ev.id); // consistencia con otras tabs
    }
    setEvalSelectorOpen(false);
  };

  useEffect(() => {
    const allMenus = [...(patient.menus || []), ...(patient.dietary?.menus || [])];
    const menu = editingMenuId ? allMenus.find(m => m.id === editingMenuId) : null;

    if (menu) {
      setVetData(menu.vet || defaultVet);
      setMacros(menu.macros || defaultMacros);
      setPortions(menu.portions || defaultPortions);
      setMenuName(menu.name || `Menú para ${patient.firstName} ${new Date().toLocaleDateString()}`);
      setSelectedTemplateId(menu.selectedTemplateId || "base_v1");
      setSelectedReferenceIds(menu.selectedReferenceIds || []);
      setAiDraftText(menu.content || "");
      setAiRationale(menu.aiRationale || "");
      setMenuPreviewData(menu.menuPreviewData || null);

      // ✅ precarga vínculo: preferimos linkedEvaluationId si existe; si no, intentamos por basedOnMeasurementDate
      const linkedEvalId = (menu as any).linkedEvaluationId as string | undefined;
      const menuEvalDate = (menu as any).basedOnMeasurementDate as string | undefined;

      if (linkedEvalId && store.getEvaluationById(linkedEvalId)) {
        setFormEvaluationId(linkedEvalId);
        const ev = store.getEvaluationById(linkedEvalId);
        if (ev) setBasedOnMeasurementDate(ev.date);
      } else if (menuEvalDate) {
        setBasedOnMeasurementDate(menuEvalDate);
        const match = patientEvaluations.find(e => e.date === menuEvalDate);
        setFormEvaluationId(match?.id ?? store.getSelectedEvaluationId(patient.id));
      } else {
        setFormEvaluationId(store.getSelectedEvaluationId(patient.id));
        const ev = store.getSelectedEvaluationId(patient.id)
          ? store.getEvaluationById(store.getSelectedEvaluationId(patient.id) as string)
          : null;
        setBasedOnMeasurementDate(ev?.date ?? (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]));
      }
    } else {
      setVetData(defaultVet);
      setMacros(defaultMacros);
      setPortions(defaultPortions);
      setMenuName(`Menú para ${patient.firstName} ${new Date().toLocaleDateString()}`);

      // ✅ default: evaluación seleccionada, si no hay → hoy según UTC del perfil
      const selected = store.getSelectedEvaluationId(patient.id);
      const ev = selected ? store.getEvaluationById(selected) : null;
      setFormEvaluationId(selected ?? null);
      setBasedOnMeasurementDate(ev?.date ?? (store.getTodayStr ? store.getTodayStr() : new Date().toISOString().split('T')[0]));
    }

    setEvalSelectorOpen(false);
  }, [editingMenuId, patient.id]);

  const handleSaveAndClose = () => {
    if (!formEvaluationId) {
      setInfoModal({ title: 'Falta evaluación', message: 'Primero selecciona una evaluación.' });
      return;
    }
    const ev = store.getEvaluationById(formEvaluationId);
    if (!ev) {
      setInfoModal({ title: 'Evaluación no encontrada', message: 'La evaluación seleccionada no existe o fue eliminada.' });
      return;
    }

    // ✅ normalizar SIEMPRE a la fecha de la evaluación
    const normalizedEvalDate = ev.date;

    const rootMenus = patient.menus || [];
    const dietaryMenus = patient.dietary?.menus || [];

    const uniqueMenus = new Map<string, any>();
    [...rootMenus, ...dietaryMenus].forEach(m => {
      if (m && m.id) uniqueMenus.set(m.id, m);
    });

    let updatedMenus = Array.from(uniqueMenus.values());

    if (editingMenuId) {
      updatedMenus = updatedMenus.map(m => m.id === editingMenuId ? {
        ...m,
        vet: vetData,
        macros: macros,
        portions: portions,
        name: menuName || `Menú ${vetData.kcalToWork} kcal`,
        selectedTemplateId,
        selectedReferenceIds,
        content: aiDraftText,
        aiRationale,
        menuPreviewData,
        basedOnMeasurementDate: normalizedEvalDate,
        linkedEvaluationId: formEvaluationId
      } : m);
    } else {
      updatedMenus.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(), // timestamp está bien en ISO
        basedOnMeasurementDate: normalizedEvalDate, // ✅ ahora es YYYY-MM-DD de evaluación
        linkedEvaluationId: formEvaluationId,
        content: aiDraftText,
        vet: vetData,
        macros: macros,
        portions: portions,
        name: menuName || `Menú ${vetData.kcalToWork} kcal`,
        selectedTemplateId,
        selectedReferenceIds,
        aiRationale,
        menuPreviewData
      });
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
    store.updatePatient(updatedPatient);
    onClose();
  };

  const handleDeleteMenuConfirmed = () => {
    if (!editingMenuId) {
      setConfirmDeleteOpen(false);
      return;
    }

    const rootMenus = patient.menus || [];
    const dietaryMenus = patient.dietary?.menus || [];

    const uniqueMenus = new Map<string, any>();
    [...rootMenus, ...dietaryMenus].forEach(m => {
      if (m && m.id) uniqueMenus.set(m.id, m);
    });

    const updatedMenus = Array.from(uniqueMenus.values()).filter(m => m.id !== editingMenuId);

    const updatedPatient = {
      ...patient,
      menus: updatedMenus,
      dietary: {
        ...patient.dietary,
        menus: []
      }
    };

    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);
    setConfirmDeleteOpen(false);
    onClose();
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
            {/* ✅ botón eliminar solo si estamos editando */}
            {editingMenuId && (
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}

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
                      <option value="">Seleccionar...</option>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de evaluación</label>
              <input
                type="date"
                value={basedOnMeasurementDate}
                disabled
                readOnly
                className="mt-1.5 w-full text-sm font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 1: Menu Details */}
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Menú</label>
              <input
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                className="w-full text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 2: Patient Details */}
          <div className="pt-6 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menu para:</label>
              <div className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-block min-w-[300px]">
                {patient.firstName} {patient.lastName}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Cálculo Nutricional</h2>
              <button
                onClick={() => setIsCalculationVisible(!isCalculationVisible)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-emerald-600"
              >
                {isCalculationVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
            />
          )}
        </section>

        <MenuAddReadSec2
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          selectedReferenceIds={selectedReferenceIds}
          setSelectedReferenceIds={setSelectedReferenceIds}
        />

        <MenuAddReadSec3
          patient={patient}
          vetData={vetData}
          macros={macros}
          portions={portions}
          selectedTemplateId={selectedTemplateId}
          selectedReferenceIds={selectedReferenceIds}
          aiDraftText={aiDraftText}
          setAiDraftText={setAiDraftText}
          aiRationale={aiRationale}
          setAiRationale={setAiRationale}
          menuPreviewData={menuPreviewData}
          setMenuPreviewData={setMenuPreviewData}
          zoom={zoom}
          setZoom={setZoom}
        />
      </div>
    </>
  );
};