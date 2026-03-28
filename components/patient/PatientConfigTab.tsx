import React, { useRef, useState } from 'react';
import { Download, Upload, Settings, AlertCircle, CheckCircle2, Trash2, X, FileDown, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Patient } from '../../types';
import { store } from '../../services/store';
import { getTodayStr } from '../../src/utils/dateUtils';
import { exportClinicalDoc } from '../../services/exportClinicalDoc';
import { exportEvaluationDoc } from '../../services/exportEvaluationDoc';
import { exportMenuPDF } from '../../services/exportMenuPDF';
import { exportPatientZip } from '../../services/exportPatientZip';

interface PatientConfigTabProps {
  patient: Patient;
  onUpdate: (updatedPatient: Patient) => void;
  onPatientDeleted?: () => void;
}

export const PatientConfigTab: React.FC<PatientConfigTabProps> = ({ patient, onUpdate, onPatientDeleted }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showExportProfileModal, setShowExportProfileModal] = useState(false);
  const [showRawDataSection, setShowRawDataSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [exportingEvaluationId, setExportingEvaluationId] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const nameMatches = deleteConfirmName.trim().toLowerCase() === fullName.toLowerCase();

  const handleDeleteConfirmed = async () => {
    if (!nameMatches) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await store.deletePatientCompletely(patient.id);
      onPatientDeleted?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar el paciente.');
      setIsDeleting(false);
    }
  };

  const evaluations = store.getEvaluations(patient.id);

  const handleExportClinical = async () => {
    setIsGeneratingDoc(true);
    try {
      await exportClinicalDoc(patient);
    } finally {
      setIsGeneratingDoc(false);
      setShowExportProfileModal(false);
    }
  };

  const handleExportAll = async () => {
    setIsExportingAll(true);
    try {
      await exportPatientZip(patient);
      setShowExportProfileModal(false);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExport = () => {
    // 1. Obtener las evaluaciones vinculadas (los "links")
    const evaluations = store.getEvaluations(patient.id);

    // 2. Preparar el objeto con el orden deseado
    // El usuario solicitó un orden específico y quitar campos que no se usen
    const exportData = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      registeredAt: patient.registeredAt,
      clinical: {
        status: patient.clinical.status,
        cui: patient.clinical.cui,
        birthdate: patient.clinical.birthdate,
        age: patient.clinical.age,
        sex: patient.clinical.sex,
        email: patient.clinical.email,
        phone: patient.clinical.phone,
        occupation: patient.clinical.occupation,
        study: patient.clinical.study,
        consultmotive: patient.clinical.consultmotive,
        clinicalbackground: patient.clinical.clinicalbackground,
        diagnosis: patient.clinical.diagnosis,
        familyHistory: patient.clinical.familyHistory,
        medications: patient.clinical.medications,
        supplements: patient.clinical.supplements,
        allergies: patient.clinical.allergies,
        regularPeriod: patient.clinical.regularPeriod,
        periodDuration: patient.clinical.periodDuration,
        firstperiodage: patient.clinical.firstperiodage,
        menstrualOthers: patient.clinical.menstrualOthers,
        sportsProfile: patient.sportsProfile
      },
      evaluations: evaluations.map(({ id, patientId, date, title }) => ({
        id,
        patientId,
        date,
        title
      })),
      dietary: {
        preferences: patient.dietary.preferences
      },
      dietaryEvaluations: patient.dietaryEvaluations.map(({ id, linkedEvaluationId, date, mealsPerDay, excludedFoods, notes, recall, foodFrequency, foodFrequencyOthers }) => ({
        id,
        linkedEvaluationId,
        date,
        mealsPerDay,
        excludedFoods,
        notes,
        recall,
        foodFrequency,
        foodFrequencyOthers
      })),
      measurements: patient.measurements.map(({ id, linkedEvaluationId, ...rest }) => ({
        id,
        linkedEvaluationId,
        ...rest
      })),
      somatotypes: patient.somatotypes.map(({ id, linkedEvaluationId, date, x, y }) => ({
        id,
        linkedEvaluationId,
        date,
        x,
        y
      })),
      menus: patient.menus.map((m) => {
        const EXCHANGE_LIST = {
          lec: { name: 'Lácteos Enteros', kcal: 150, cho: 12, chon: 7, fat: 8 },
          lecDesc: { name: 'Lácteos Descremados', kcal: 90, cho: 12, chon: 7, fat: 1 },
          fru: { name: 'Frutas', kcal: 60, cho: 15, chon: 0, fat: 0 },
          veg: { name: 'Vegetales', kcal: 25, cho: 5, chon: 2, fat: 0 },
          cer: { name: 'Cereales', kcal: 80, cho: 15, chon: 6, fat: 0 },
          carMagra: { name: 'Carnes Magras', kcal: 55, cho: 0, chon: 7, fat: 3 },
          carSemi: { name: 'Carnes Semi Grasas', kcal: 75, cho: 0, chon: 7, fat: 5 },
          carAlta: { name: 'Carnes Altas en Grasa', kcal: 100, cho: 0, chon: 7, fat: 8 },
          gra: { name: 'Grasas', kcal: 45, cho: 0, chon: 0, fat: 5 },
          azu: { name: 'Azúcares', kcal: 45, cho: 12, chon: 0, fat: 0 },
        };

        const macros = m.macros ? {
          id: m.macros.id || `macros-${m.id}`,
          ...m.macros
        } : undefined;

        const portions = m.portions ? (() => {
          const rows = Object.entries(EXCHANGE_LIST).map(([key, ref]) => {
            const p = (m.portions as any)[key] || 0;
            return {
              id: `${key}-${m.id}`,
              group: ref.name,
              portions: p,
              kcal: Math.round(p * ref.kcal),
              cho: Math.round(p * ref.cho),
              chon: Math.round(p * ref.chon),
              fat: Math.round(p * ref.fat)
            };
          });

          const totals = rows.reduce((acc, row) => ({
            kcal: acc.kcal + row.kcal,
            cho: acc.cho + row.cho,
            chon: acc.chon + row.chon,
            fat: acc.fat + row.fat
          }), { kcal: 0, cho: 0, chon: 0, fat: 0 });

          return {
            id: m.portions.id || `portions-${m.id}`,
            ...m.portions,
            rows,
            totals
          };
        })() : undefined;

        return {
          id: m.id,
          linkedEvaluationId: m.linkedEvaluationId,
          date: m.date,
          content: m.content,
          vet: m.vet,
          macros,
          portions,
          name: m.name,
          selectedTemplateId: m.selectedTemplateId,
          selectedReferenceIds: m.selectedReferenceIds,
          aiRationale: m.aiRationale,
          menuPreviewData: m.menuPreviewData
        };
      }),
      labs: patient.labs.map(({ id, linkedEvaluationId, name, date, url, type, labInterpretation }) => ({
        id,
        linkedEvaluationId,
        name,
        date,
        url,
        type,
        labInterpretation
      })),
      photos: patient.photos.map(({ id, linkedEvaluationId, name, date, url, type }) => ({
        id,
        linkedEvaluationId,
        name,
        date,
        url,
        type
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const user = store.getUserProfile();
    const exportFileDefaultName = `paciente_${patient.firstName}_${patient.lastName}_${getTodayStr(user.timezone)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Basic validation
        if (!importedData.id || !importedData.firstName || !importedData.lastName) {
          throw new Error('El archivo no tiene un formato de paciente válido.');
        }

        // Mantener el ID del paciente actual para evitar duplicados o errores de consistencia
        const dataToImport = {
          ...importedData,
          id: patient.id
        };

        // Usar el nuevo método del store que maneja también las evaluaciones vinculadas
        store.importPatientData(dataToImport);
        
        setImportStatus('success');
        
        // Notificar al padre para actualizar el estado local
        onUpdate(store.getPatient(patient.id)!);
        
        // Auto-reload after a short delay to show success
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        setImportStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Error al importar el archivo.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="bg-slate-200 p-2 rounded-xl">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Configuración del Paciente</h3>
            <p className="text-sm text-slate-500">Gestiona los datos y la portabilidad de la información clínica.</p>
          </div>
        </div>

        <div className="p-8 space-y-4">
          {/* ── Exportar Perfil Completo ── */}
          <div className="p-6 rounded-2xl border border-teal-100 bg-teal-50/40 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-teal-100 p-2 rounded-lg">
                <FileDown className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Exportar Perfil Completo</h4>
                <p className="text-sm text-slate-500">Descarga un archivo .doc de información clínica del paciente + contenido completo vinculado a cada evaluación por fecha</p>
              </div>
            </div>
            <button
              onClick={() => setShowExportProfileModal(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-teal-600/20"
            >
              <FileDown className="w-4 h-4 hidden sm:block" />
              Exportar Perfil Completo en .doc
            </button>
          </div>

          {/* ── Nota de seguridad ── */}
          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
            <div className="bg-amber-100 p-2 h-fit rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h5 className="font-bold text-amber-900 mb-1">Nota sobre la seguridad de los datos</h5>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                Los archivos exportados contienen información sensible del paciente. Asegúrate de almacenarlos en un lugar seguro y cumplir con las normativas de protección de datos locales.
              </p>
            </div>
          </div>

          {/* ── Exportar/Importar datos crudos (desplegable) ── */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowRawDataSection(v => !v)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-lg">
                  <Download className="w-4 h-4 text-slate-600" />
                </div>
                <span className="font-bold text-slate-800">Exportar/Importar datos crudos</span>
              </div>
              {showRawDataSection
                ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              }
            </button>

            {showRawDataSection && (
              <div className="p-6 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Export Section */}
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Download className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-slate-800">Exportar Datos</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Descarga una copia completa y ordenada de toda la información de este paciente (clínica, evaluaciones, menús, laboratorios, etc.) en formato JSON.
                    </p>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold py-3 rounded-xl transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Descargar JSON
                    </button>
                  </div>

                  {/* Import Section */}
                  <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Upload className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-800">Importar Datos</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Carga un archivo JSON previamente exportado para actualizar toda la información de este paciente.
                      <span className="block mt-1 font-bold text-amber-600">Atención: Esto sobrescribirá los datos actuales.</span>
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />

                    <button
                      onClick={handleImportClick}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <Upload className="w-4 h-4" />
                      Seleccionar Archivo
                    </button>

                    {importStatus === 'success' && (
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold">¡Importación exitosa! Guardando y recargando...</span>
                      </div>
                    )}

                    {importStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">{errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Eliminar Paciente (desplegable) ── */}
          <div className="rounded-2xl border border-red-200 overflow-hidden">
            <button
              onClick={() => setShowDeleteSection(v => !v)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-red-50 hover:bg-red-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-bold text-red-800">Eliminar Paciente</span>
              </div>
              {showDeleteSection
                ? <ChevronDown className="w-5 h-5 text-red-400 shrink-0" />
                : <ChevronRight className="w-5 h-5 text-red-400 shrink-0" />
              }
            </button>

            {showDeleteSection && (
              <div className="p-6 border-t border-red-100 bg-red-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="bg-red-100 p-2 h-fit rounded-lg">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-red-900 mb-1">Eliminar Paciente</h5>
                      <p className="text-sm text-red-700/80 leading-relaxed">
                        Elimina permanentemente este paciente y todos sus registros: evaluaciones, medidas, menús, laboratorios, fotos, citas e invoices. Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowDeleteModal(true); setDeleteConfirmName(''); setDeleteError(''); }}
                    className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-red-600/20 self-start sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Paciente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Exportar Perfil Completo */}
      {showExportProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-xl">
                  <FileDown className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Exportar Perfil</h3>
              </div>
              <button
                onClick={() => setShowExportProfileModal(false)}
                disabled={isGeneratingDoc || isExportingAll}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-5">Elige qué información deseas exportar:</p>

            <div className="space-y-3">
              {/* Exportar Todo */}
              <button
                onClick={handleExportAll}
                disabled={isExportingAll || isGeneratingDoc || exportingEvaluationId !== null}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExportingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    Generando reporte completo... (esto puede tomar unos segundos)
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 shrink-0" />
                    Exportar Todo (.zip)
                  </>
                )}
              </button>

              {/* Solo Información Clínica */}
              <button
                onClick={handleExportClinical}
                disabled={isGeneratingDoc || isExportingAll || exportingEvaluationId !== null}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando Documento...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Solo Información Clínica .doc
                  </>
                )}
              </button>

              {/* Evaluaciones */}
              {evaluations.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Evaluación en .doc + menú en pdf</p>
                  <div className="space-y-2">
                    {evaluations.map((ev) => {
                      const isExporting = exportingEvaluationId === ev.id;
                      return (
                        <button
                          key={ev.id}
                          onClick={async () => {
                            setExportingEvaluationId(ev.id);
                            try {
                              await exportEvaluationDoc(patient, ev);
                              const linkedMenu = patient.menus.find(
                                (m) => m.linkedEvaluationId === ev.id && m.menuData
                              );
                              if (linkedMenu) {
                                const safeName = `${patient.firstName}_${patient.lastName}`.replace(/\s+/g, '_');
                                await exportMenuPDF(linkedMenu, `${safeName}_Menu_${ev.date}`);
                              }
                            } finally {
                              setExportingEvaluationId(null);
                              setShowExportProfileModal(false);
                            }
                          }}
                          disabled={isExporting || isGeneratingDoc || exportingEvaluationId !== null || isExportingAll}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-teal-100 bg-teal-50/40 hover:bg-teal-100 text-teal-700 text-sm font-medium text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isExporting ? (
                            <><Loader2 className="w-4 h-4 animate-spin shrink-0" /><span>Generando evaluación...</span></>
                          ) : (
                            <><FileDown className="w-4 h-4 shrink-0" /><span>Evaluación {ev.date}</span></>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Confirmar eliminación</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-2 leading-relaxed">
              Estás a punto de eliminar permanentemente a <span className="font-bold text-slate-900">{fullName}</span> y todos sus registros vinculados. Esta acción es irreversible.
            </p>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Para confirmar, escribe el nombre completo del paciente:
            </p>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Nombre de referencia
            </p>
            <p className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg mb-3 select-all">
              {fullName}
            </p>

            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={`Escribe "${fullName}"`}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all mb-4"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && nameMatches) handleDeleteConfirmed(); }}
            />

            {deleteError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-4 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={!nameMatches || isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Eliminando...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Eliminar definitivamente</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};