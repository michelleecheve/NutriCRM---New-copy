import React, { useState } from 'react';
import { Sun, Leaf, UtensilsCrossed, Moon, MessageSquarePlus } from 'lucide-react';

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
  const [showNote, setShowNote] = useState(!!data.note);

  // Left border color
  const borderLeft =
    data.completed === true  ? '4px solid #2D5A4B' :
    data.completed === false ? '4px solid #EF4444' :
    '4px solid transparent';

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
      {/* ── Meal header ── */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: '#E8F0EC', color: '#2D5A4B' }}
        >
          {getMealIcon(meal.key)}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">{meal.label}</p>
          {meal.title && (
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">{meal.title}</p>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 h-px" style={{ backgroundColor: '#F0F4F1' }} />

      {/* ── ¿CUMPLIDO? ── */}
      <div className="px-4 pt-3 pb-2">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: '#6B7C73', fontSize: '10px' }}
        >
          ¿Cumplido?
        </p>
        <div className="flex gap-3">
          {/* ✓ button */}
          <button
            onClick={() => onUpdate({ completed: data.completed === true ? null : true })}
            disabled={saving}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all font-bold text-lg"
            style={{
              backgroundColor: data.completed === true ? '#2D5A4B' : 'white',
              border: data.completed === true ? '2px solid #2D5A4B' : '2px solid #D1D5DB',
              color: data.completed === true ? 'white' : '#9CA3AF',
              minWidth: '44px',
              minHeight: '44px',
            }}
            aria-label="Sí cumplido"
          >
            ✓
          </button>

          {/* ✗ button */}
          <button
            onClick={() => onUpdate({ completed: data.completed === false ? null : false })}
            disabled={saving}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all font-bold text-lg"
            style={{
              backgroundColor: data.completed === false ? '#EF4444' : 'white',
              border: data.completed === false ? '2px solid #EF4444' : '2px solid #D1D5DB',
              color: data.completed === false ? 'white' : '#9CA3AF',
              minWidth: '44px',
              minHeight: '44px',
            }}
            aria-label="No cumplido"
          >
            ✗
          </button>
        </div>
      </div>

      {/* ── ¿TE GUSTÓ? ── */}
      <div className="px-4 pt-1 pb-3">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: '#6B7C73', fontSize: '10px' }}
        >
          ¿Te gustó?
        </p>
        <div className="flex gap-2">
          {RATINGS.map((emoji) => {
            const active = data.rating === emoji;
            return (
              <button
                key={emoji}
                onClick={() => onUpdate({ rating: active ? null : emoji })}
                disabled={saving}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  backgroundColor: active ? '#E8F0EC' : 'white',
                  border: active ? '2px solid #2D5A4B' : '2px solid #E0E8E3',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
                aria-label={emoji}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Note ── */}
      <div className="px-4 pb-4">
        {!showNote ? (
          <button
            onClick={() => setShowNote(true)}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: '#6B7C73' }}
          >
            <MessageSquarePlus className="w-4 h-4" />
            Añadir nota
          </button>
        ) : (
          <input
            type="text"
            value={data.note}
            onChange={(e) => onUpdate({ note: e.target.value })}
            onBlur={(e) => { if (!e.target.value) setShowNote(false); }}
            placeholder="Añade un comentario..."
            className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent border-b pb-1"
            style={{ borderColor: '#E0E8E3' }}
            autoFocus
          />
        )}
      </div>
    </div>
  );
};
