import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, AlertCircle, FlaskConical } from 'lucide-react';
import { Patient, LabResult } from '../../types';
import { MenuPlanData } from './MenuDesignTemplates';
import { extractLabKeyFindings } from '../../services/geminiService';

interface PatientChip {
  label: string;
  value: string;
  color: string;
  isLab?: boolean;
  fullValue?: string;
}

function buildPatientChips(patient: Patient, evaluationId?: string | null): PatientChip[] {
  const chips: PatientChip[] = [];
  if (patient.clinical?.allergies)
    chips.push({ label: 'Alergias', value: patient.clinical.allergies, color: 'bg-red-50 border-red-200 text-red-700' });
  if (patient.clinical?.diagnosis)
    chips.push({ label: 'Diagnóstico', value: patient.clinical.diagnosis, color: 'bg-orange-50 border-orange-200 text-orange-700' });
  if (patient.clinical?.consultmotive)
    chips.push({ label: 'Meta', value: patient.clinical.consultmotive, color: 'bg-blue-50 border-blue-200 text-blue-700' });
  if (patient.clinical?.medications)
    chips.push({ label: 'Medicamentos', value: patient.clinical.medications, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' });
  const de = patient.dietaryEvaluations?.[0];
  if (de?.excludedFoods)
    chips.push({ label: 'Evita', value: de.excludedFoods, color: 'bg-purple-50 border-purple-200 text-purple-700' });
  if (patient.dietary?.preferences)
    chips.push({ label: 'Preferencias', value: patient.dietary.preferences, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' });
  if ((patient.sportsProfile || []).length > 0) {
    const sports = patient.sportsProfile!.map(s => `${s.sport} ${s.daysPerWeek}d/sem`).join(', ');
    chips.push({ label: 'Deporte', value: sports, color: 'bg-green-50 border-green-200 text-green-700' });
  }

  const labs = evaluationId
    ? (patient.labs || []).filter(
        (l: LabResult) => l.linkedEvaluationId === evaluationId && l.labInterpretation?.trim()
      )
    : [];

  labs.forEach((lab: LabResult) => {
    const keyFindings = extractLabKeyFindings(lab.labInterpretation!, 200);
    if (keyFindings) {
      chips.push({
        label: `Labs: ${lab.name}`,
        value: keyFindings,
        fullValue: lab.labInterpretation,
        color: 'bg-teal-50 border-teal-200 text-teal-700',
        isLab: true,
      });
    }
  });

  return chips;
}

const DAY_LABELS: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb',
};
const DAY_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

interface MenuAIActionsPanelProps {
  patient: Patient;
  menuPreviewData: MenuPlanData;
  aiRationale: string;
  isLocked: boolean;
  evaluationId?: string | null;
  onRegenerateDay: (dayKey: string) => Promise<void>;
  onRegenerateMealSlot: (slotId: string, label: string) => Promise<void>;
}

export const MenuAIActionsPanel: React.FC<MenuAIActionsPanelProps> = ({
  patient,
  menuPreviewData,
  aiRationale,
  isLocked,
  evaluationId,
  onRegenerateDay,
  onRegenerateMealSlot,
}) => {
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [expandedLabId, setExpandedLabId] = useState<number | null>(null);
  const [loadingDay, setLoadingDay] = useState<string | null>(null);
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chips = buildPatientChips(patient, evaluationId);

  const mealSlots: { id: string; label: string }[] = (() => {
    const lunes = (menuPreviewData.weeklyMenu as any)?.lunes;
    const order: string[] = lunes?.mealsOrder || ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
    return order.map(id => ({
      id,
      label: lunes?.[id]?.label || id,
    }));
  })();

  const handleDay = async (dayKey: string) => {
    if (isLocked || loadingDay || loadingSlot) return;
    setError(null);
    setLoadingDay(dayKey);
    try {
      await onRegenerateDay(dayKey);
    } catch (e: any) {
      setError(e.message || 'Error al regenerar el día.');
    } finally {
      setLoadingDay(null);
    }
  };

  const handleSlot = async (slotId: string, label: string) => {
    if (isLocked || loadingDay || loadingSlot) return;
    setError(null);
    setLoadingSlot(slotId);
    try {
      await onRegenerateMealSlot(slotId, label);
    } catch (e: any) {
      setError(e.message || 'Error al cambiar el tiempo de comida.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const isBusy = !!(loadingDay || loadingSlot);

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setShowAiDetails(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-slate-700 font-bold text-sm hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Detalles que la IA tomó en cuenta</span>
        </div>
        {showAiDetails
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>

      {showAiDetails && (
        <div className="border-t border-slate-200 px-4 pb-4 space-y-4 animate-in fade-in duration-200">
          {/* Chips del paciente */}
          {chips.length > 0 && (
            <div className="pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del paciente considerados</p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, i) => (
                  <div key={i} className="flex flex-col max-w-xs">
                    <div
                      className={`flex items-start gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${chip.color} ${chip.isLab ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                      title={chip.isLab ? 'Clic para ver análisis completo' : chip.value}
                      onClick={() => chip.isLab && setExpandedLabId(expandedLabId === i ? null : i)}
                    >
                      {chip.isLab && <FlaskConical className="w-3 h-3 shrink-0 mt-0.5" />}
                      <span className="font-bold shrink-0">{chip.label}:</span>
                      <span className="truncate">{chip.value.length > 50 ? chip.value.slice(0, 50) + '…' : chip.value}</span>
                      {chip.isLab && (
                        <span className="shrink-0 ml-1 opacity-60">
                          {expandedLabId === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                      )}
                    </div>
                    {chip.isLab && expandedLabId === i && chip.fullValue && (
                      <div className={`mt-1 p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-line ${chip.color} opacity-90`}>
                        {chip.fullValue}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rationale */}
          {aiRationale && (
            <div className="space-y-2">
              <div className="border-t border-slate-200" />
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider pt-1">¿Qué hizo la IA y por qué?</p>
              <p className="text-sm text-indigo-600/80 font-medium leading-relaxed whitespace-pre-line">
                {aiRationale}
              </p>
            </div>
          )}

          {/* Ajustes con IA */}
          <div className="space-y-4">
            <div className="border-t border-slate-200" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ajustes con IA</p>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Por día */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Regenerar un día</p>
              <div className="flex flex-wrap gap-2">
                {DAY_KEYS.map(day => {
                  const isLoading = loadingDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => handleDay(day)}
                      disabled={isLocked || isBusy}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isLocked || (isBusy && !isLoading)
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                          : isLoading
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Por tiempo de comida */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Cambiar un tiempo de comida (toda la semana)</p>
              <div className="flex flex-wrap gap-2">
                {mealSlots.map(slot => {
                  const isLoading = loadingSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => handleSlot(slot.id, slot.label)}
                      disabled={isLocked || isBusy}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isLocked || (isBusy && !isLoading)
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                          : isLoading
                            ? 'border-violet-300 bg-violet-50 text-violet-600'
                            : 'border-slate-200 text-slate-600 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
