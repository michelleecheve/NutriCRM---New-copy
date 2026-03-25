import React from 'react';
import { Sun, Leaf, UtensilsCrossed, Moon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MealKey = string; // 'desayuno' | 'refaccion1' | 'almuerzo' | 'refaccion2' | 'cena' | etc.

export interface MealData {
  completed: boolean | null;
  rating: '😊' | '😐' | '😔' | null;
  note: string;
}

export interface MealCardInfo {
  key: MealKey;
  label: string;   // e.g. "Desayuno", "Refacción"
  title: string;   // dish name
}

export interface MealUpdate extends Partial<MealData> {}

interface Props {
  meal: MealCardInfo;
  data: MealData;
  onUpdate: (update: MealUpdate) => void;
  saving?: boolean;
}

// ─── Icon selector ────────────────────────────────────────────────────────────

function getMealIcon(key: MealKey): React.ReactNode {
  const k = key.toLowerCase();
  if (k.includes('desayuno'))          return <Sun className="w-5 h-5" />;
  if (k.includes('refaccion') || k.includes('snack') || k.includes('merienda'))
                                       return <Leaf className="w-5 h-5" />;
  if (k.includes('almuerzo'))          return <UtensilsCrossed className="w-5 h-5" />;
  if (k.includes('cena'))              return <Moon className="w-5 h-5" />;
  return <UtensilsCrossed className="w-5 h-5" />;
}

const RATINGS: ('😊' | '😐' | '😔')[] = ['😊', '😐', '😔'];

// ─── Component ────────────────────────────────────────────────────────────────

export const MealCard: React.FC<Props> = ({ meal, data, onUpdate, saving }) => {

  // Left border color
  const borderLeft =
    data.completed === true  ? '4px solid #2D5A4B' :
    data.completed === false ? '4px solid #EF4444' :
    '4px solid #D1D5DB';

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #E0E8E3',
        borderLeft,
        opacity: saving ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <div className="flex gap-3 p-4">

        {/* ── Columna izquierda: icono + nombre + plato ── */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#E8F0EC', color: '#2D5A4B' }}
            >
              {getMealIcon(meal.key)}
            </div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{meal.label}</p>
          </div>
          {meal.title && (
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">{meal.title}</p>
          )}
        </div>

        {/* ── Separador vertical ── */}
        <div className="w-px self-stretch" style={{ backgroundColor: '#F0F4F1' }} />

        {/* ── Columna derecha: cumplido + te gustó ── */}
        <div className="flex flex-col gap-3 flex-shrink-0 justify-center">

          {/* ¿Cumplido? */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-center"
              style={{ color: '#6B7C73', fontSize: '10px' }}>
              ¿Cumplido?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => onUpdate({ completed: data.completed === true ? null : true })}
                disabled={saving}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold text-base"
                style={{
                  backgroundColor: data.completed === true ? '#2D5A4B' : 'white',
                  border: data.completed === true ? '2px solid #2D5A4B' : '2px solid #D1D5DB',
                  color: data.completed === true ? 'white' : '#9CA3AF',
                  minWidth: '40px', minHeight: '40px',
                }}
                aria-label="Sí cumplido"
              >✓</button>
              <button
                onClick={() => onUpdate({ completed: data.completed === false ? null : false })}
                disabled={saving}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold text-base"
                style={{
                  backgroundColor: data.completed === false ? '#EF4444' : 'white',
                  border: data.completed === false ? '2px solid #EF4444' : '2px solid #D1D5DB',
                  color: data.completed === false ? 'white' : '#9CA3AF',
                  minWidth: '40px', minHeight: '40px',
                }}
                aria-label="No cumplido"
              >✗</button>
            </div>
          </div>

          {/* ¿Te gustó? */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-center"
              style={{ color: '#6B7C73', fontSize: '10px' }}>
              ¿Te gustó?
            </p>
            <div className="flex gap-1.5">
              {RATINGS.map((emoji) => {
                const active = data.rating === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => onUpdate({ rating: active ? null : emoji })}
                    disabled={saving}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all"
                    style={{
                      backgroundColor: active ? '#E8F0EC' : 'white',
                      border: active ? '2px solid #2D5A4B' : '2px solid #E0E8E3',
                      minWidth: '40px', minHeight: '40px',
                    }}
                    aria-label={emoji}
                  >{emoji}</button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
