import React from 'react';
import { Save, CheckCircle, Loader2 } from 'lucide-react';
import { useSave } from '../hooks/useSave';

interface SaveButtonProps {
  /** Función async que ejecuta el guardado (store.save..., supabaseService..., etc.) */
  onSave: () => Promise<void>;
  /** Texto del botón. Default: "Guardar" */
  label?: string;
  /** sm para botones secundarios, md es el default */
  size?: 'sm' | 'md';
  /** Color del botón. Default: 'emerald' */
  variant?: 'emerald' | 'red';
  /** Clases extra de Tailwind (ej. "w-full") */
  className?: string;
}

/**
 * Botón de guardado estándar del sistema.
 *
 * Uso simple:
 *   <SaveButton onSave={() => store.saveMedicion(evaluationId, data)} />
 *
 * Con label y tamaño:
 *   <SaveButton onSave={handleSave} label="Guardar evaluación" size="sm" />
 *
 * El botón maneja internamente: doble-click, loading, feedback de éxito y error.
 * No necesitas isSaving ni savedOk en el componente padre.
 *
 * Si el padre TAMBIÉN necesita saber si está guardando (para deshabilitar campos),
 * usa el hook directamente:
 *   const { save, isSaving } = useSave()
 *   <input disabled={isSaving} />
 *   <SaveButton onSave={() => save(() => store.save(data))} />
 *   ← en este caso onSave recibe la llamada ya wrapeada en save()
 */
export const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  label = 'Guardar',
  size = 'md',
  variant = 'emerald',
  className = '',
}) => {
  const { save, isSaving, savedOk, error } = useSave();

  const sizeClass = size === 'sm' ? 'px-4 py-1.5 text-xs' : 'px-6 py-2 text-sm';
  const colorClass = variant === 'red'
    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => save(onSave)}
        disabled={isSaving}
        className={`flex items-center justify-center gap-2 font-bold text-white rounded-lg shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed
          ${savedOk
            ? 'bg-emerald-500 shadow-emerald-500/20'
            : colorClass
          }
          ${sizeClass} ${className}`}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : savedOk ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isSaving ? 'Guardando...' : savedOk ? '¡Guardado!' : label}
      </button>

      {error && (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      )}
    </div>
  );
};
