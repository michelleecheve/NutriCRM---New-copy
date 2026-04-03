import React from 'react';
import { Sun, Cookie, UtensilsCrossed, Moon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MealKey = string;

export interface MealData {
  completed: boolean | null;
  rating: '😊' | '😐' | '😔' | null;
  note: string;
}

export interface MealCardInfo {
  key: MealKey;
  label: string;
  title: string;
}

export interface MealUpdate extends Partial<MealData> {}

interface Props {
  meal: MealCardInfo;
  data: MealData;
  onUpdate: (update: MealUpdate) => void;
  saving?: boolean;
  readOnly?: boolean;
}

// ─── Meal color themes ────────────────────────────────────────────────────────

function getMealStyle(key: string): { iconBg: string; iconColor: string; accentColor: string } {
  const k = key.toLowerCase();
  if (k.includes('desayuno'))
    return { iconBg: '#FEF3C7', iconColor: '#D97706', accentColor: '#FBBF24' };
  if (k.includes('almuerzo'))
    return { iconBg: '#DBEAFE', iconColor: '#2563EB', accentColor: '#60A5FA' };
  if (k.includes('cena'))
    return { iconBg: '#EDE9FE', iconColor: '#7C3AED', accentColor: '#A78BFA' };
  if (k.includes('refaccion') || k.includes('snack') || k.includes('merienda'))
    return { iconBg: '#FFF7ED', iconColor: '#EA580C', accentColor: '#FB923C' };
  return { iconBg: '#E8F0EC', iconColor: '#2D5A4B', accentColor: '#6EE7B7' };
}

// ─── Icon selector ────────────────────────────────────────────────────────────

function getMealIcon(key: MealKey): React.ReactNode {
  const k = key.toLowerCase();
  if (k.includes('desayuno'))                                          return <Sun className="w-5 h-5" />;
  if (k.includes('refaccion') || k.includes('snack') || k.includes('merienda'))
                                                                       return <Cookie className="w-5 h-5" />;
  if (k.includes('almuerzo'))                                          return <UtensilsCrossed className="w-5 h-5" />;
  if (k.includes('cena'))                                              return <Moon className="w-5 h-5" />;
  return <UtensilsCrossed className="w-5 h-5" />;
}

const RATINGS: ('😊' | '😐' | '😔')[] = ['😊', '😐', '😔'];

// ─── Component ────────────────────────────────────────────────────────────────

export const MealCard: React.FC<Props> = ({ meal, data, onUpdate, saving, readOnly }) => {
  const mealStyle = getMealStyle(meal.key);

  // Subtle border color
  const borderColor =
    data.completed === true  ? '#BBF7D0' :
    data.completed === false ? '#FECACA' :
    '#E5E7EB';

  // Soft glow shadow based on completion state
  const glowShadow =
    data.completed === true  ? '0 2px 8px rgba(22,163,74,0.38)' :
    data.completed === false ? '0 2px 8px rgba(239,68,68,0.38)' :
    '0 2px 8px rgba(0,0,0,0.05)';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: `1px solid ${borderColor}`,
        boxShadow: glowShadow,
        opacity: saving ? 0.65 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div className="flex gap-3 p-4">

        {/* ── Left col: icon + label + dish title ── */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: mealStyle.iconBg, color: mealStyle.iconColor }}
            >
              {getMealIcon(meal.key)}
            </div>
            <p className="font-bold text-sm leading-tight" style={{ color: '#1F2937' }}>
              {meal.label}
            </p>
          </div>
          {meal.title && (
            <div className="text-sm leading-snug mt-0.5" style={{ color: '#6B7280' }}>
              {meal.title.split('\n').map((line, i) => (
                <p key={i} style={{ margin: 0 }}>{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* ── Vertical separator ── */}
        <div className="w-px self-stretch mx-0.5" style={{ backgroundColor: borderColor }} />

        {/* ── Right col: cumplido + te gustó ── */}
        <div className="flex flex-col gap-3 flex-shrink-0 justify-center">

          {/* ¿Cumplido? */}
          <div>
            <p
              className="text-center mb-1.5"
              style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              ¿Cumplido?
            </p>
            <div className="flex gap-1.5 justify-center">
              <button
                onClick={() => onUpdate({ completed: data.completed === true ? null : true })}
                disabled={saving || readOnly}
                className="flex items-center justify-center font-bold text-base transition-all active:scale-90"
                style={{
                  width: 38, height: 38, borderRadius: '10px',
                  backgroundColor: data.completed === true  ? '#16A34A' : 'white',
                  border:          data.completed === true  ? '2px solid #16A34A' : '2px solid #D1D5DB',
                  color:           data.completed === true  ? 'white' : '#D1D5DB',
                  boxShadow:       data.completed === true  ? '0 2px 8px rgba(22,163,74,0.28)' : 'none',
                  cursor:          readOnly ? 'not-allowed' : 'pointer',
                  opacity:         readOnly ? 0.6 : 1,
                }}
                aria-label="Sí cumplido"
              >✓</button>
              <button
                onClick={() => onUpdate({ completed: data.completed === false ? null : false })}
                disabled={saving || readOnly}
                className="flex items-center justify-center font-bold text-base transition-all active:scale-90"
                style={{
                  width: 38, height: 38, borderRadius: '10px',
                  backgroundColor: data.completed === false ? '#EF4444' : 'white',
                  border:          data.completed === false ? '2px solid #EF4444' : '2px solid #D1D5DB',
                  color:           data.completed === false ? 'white' : '#D1D5DB',
                  boxShadow:       data.completed === false ? '0 2px 8px rgba(239,68,68,0.28)' : 'none',
                  cursor:          readOnly ? 'not-allowed' : 'pointer',
                  opacity:         readOnly ? 0.6 : 1,
                }}
                aria-label="No cumplido"
              >✗</button>
            </div>
          </div>

          {/* ¿Te gustó? */}
          <div>
            <p
              className="text-center mb-1.5"
              style={{ color: '#9CA3AF', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              ¿Te gustó?
            </p>
            <div className="flex gap-1.5">
              {RATINGS.map((emoji) => {
                const active = data.rating === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => onUpdate({ rating: active ? null : emoji })}
                    disabled={saving || readOnly}
                    className="flex items-center justify-center text-lg transition-all active:scale-90"
                    style={{
                      width: 38, height: 38, borderRadius: '10px',
                      backgroundColor: active ? '#ECFDF5' : 'white',
                      border:          active ? '2px solid #86EFAC' : '2px solid #E5E7EB',
                      transform:       active ? 'scale(1.1)' : 'scale(1)',
                      cursor:          readOnly ? 'not-allowed' : 'pointer',
                      opacity:         readOnly ? 0.6 : 1,
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
