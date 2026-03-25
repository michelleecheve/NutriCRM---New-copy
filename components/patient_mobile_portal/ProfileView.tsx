import React, { useState, useEffect } from 'react';
import { LogOut, MessageCircle, Globe, Instagram, Pencil, Check, X, Clock } from 'lucide-react';
import { TrackingRow } from '../../types';
import { PortalPatient, PortalNutritionist } from './PortalShell';
import { supabase } from '../../services/supabase';

interface Props {
  token: string;
  patient: PortalPatient;
  nutritionist: PortalNutritionist;
  activeTracking: TrackingRow | null;
}

function sessionKey(token: string): string {
  return `nutriflow_portal_${token}`;
}

function tzKey(token: string): string {
  return `nutriflow_portal_tz_${token}`;
}

// ─── Timezone options ─────────────────────────────────────────────────────────

const TZ_OPTIONS = [
  // ── Américas ──
  { value: 'Pacific/Honolulu',              label: 'Hawái (UTC-10)' },
  { value: 'America/Anchorage',             label: 'Alaska (UTC-9)' },
  { value: 'America/Los_Angeles',           label: 'Pacífico EE.UU. / Tijuana (UTC-8/-7)' },
  { value: 'America/Denver',                label: 'Montañas EE.UU. (UTC-7/-6)' },
  { value: 'America/Chicago',               label: 'Centro EE.UU. (UTC-6/-5)' },
  { value: 'America/Guatemala',             label: 'Guatemala / El Salvador / Honduras (UTC-6)' },
  { value: 'America/Mexico_City',           label: 'México Centro (UTC-6/-5)' },
  { value: 'America/Monterrey',             label: 'México Noreste (UTC-6/-5)' },
  { value: 'America/Cancun',                label: 'Cancún (UTC-5)' },
  { value: 'America/New_York',              label: 'Este EE.UU. / Panamá (UTC-5/-4)' },
  { value: 'America/Bogota',                label: 'Colombia / Perú / Ecuador (UTC-5)' },
  { value: 'America/Lima',                  label: 'Lima (UTC-5)' },
  { value: 'America/Caracas',               label: 'Venezuela (UTC-4)' },
  { value: 'America/La_Paz',                label: 'Bolivia / Venezuela (UTC-4)' },
  { value: 'America/Santiago',              label: 'Chile (UTC-4/-3)' },
  { value: 'America/Paraguay',              label: 'Paraguay (UTC-4/-3)' },
  { value: 'America/Argentina/Buenos_Aires',label: 'Argentina (UTC-3)' },
  { value: 'America/Montevideo',            label: 'Uruguay (UTC-3)' },
  { value: 'America/Sao_Paulo',             label: 'Brasil / São Paulo (UTC-3)' },
  { value: 'America/Halifax',               label: 'Atlántico Canadá (UTC-4/-3)' },
  { value: 'America/St_Johns',              label: 'Terranova (UTC-3:30)' },
  // ── Europa ──
  { value: 'Atlantic/Azores',               label: 'Azores (UTC-1)' },
  { value: 'Europe/London',                 label: 'Londres / Lisboa (UTC+0/+1)' },
  { value: 'Europe/Madrid',                 label: 'España / Francia / Italia (UTC+1/+2)' },
  { value: 'Europe/Berlin',                 label: 'Alemania / Polonia (UTC+1/+2)' },
  { value: 'Europe/Athens',                 label: 'Grecia / Turquía (UTC+2/+3)' },
  { value: 'Europe/Moscow',                 label: 'Moscú (UTC+3)' },
  // ── África / Oriente Medio ──
  { value: 'Africa/Cairo',                  label: 'Egipto / Oriente Medio (UTC+2)' },
  { value: 'Asia/Dubai',                    label: 'Dubai / Emiratos (UTC+4)' },
  // ── Asia / Pacífico ──
  { value: 'Asia/Karachi',                  label: 'Pakistán (UTC+5)' },
  { value: 'Asia/Kolkata',                  label: 'India (UTC+5:30)' },
  { value: 'Asia/Dhaka',                    label: 'Bangladesh (UTC+6)' },
  { value: 'Asia/Bangkok',                  label: 'Tailandia / Indonesia Oeste (UTC+7)' },
  { value: 'Asia/Singapore',                label: 'Singapur / China / Filipinas (UTC+8)' },
  { value: 'Asia/Tokyo',                    label: 'Japón / Corea (UTC+9)' },
  { value: 'Australia/Sydney',              label: 'Australia Este (UTC+10/+11)' },
  { value: 'Pacific/Auckland',              label: 'Nueva Zelanda (UTC+12/+13)' },
];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/Guatemala';
  }
}

function tzLabel(value: string): string {
  return TZ_OPTIONS.find(t => t.value === value)?.label ?? value;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfileView: React.FC<Props> = ({ token, patient, nutritionist, activeTracking }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Goal editing ──
  const [goalText, setGoalText] = useState(patient.portalGoal ?? '');
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  // ── Timezone ──
  const [timezone, setTimezone] = useState<string>(() => {
    return localStorage.getItem(tzKey(token)) ?? detectTimezone();
  });
  const [tzSaved, setTzSaved] = useState(false);

  useEffect(() => {
    setGoalText(patient.portalGoal ?? '');
  }, [patient.portalGoal]);

  function handleLogout() {
    localStorage.removeItem(sessionKey(token));
    window.location.reload();
  }

  async function handleSaveGoal() {
    setSavingGoal(true);
    try {
      await supabase.from('patients').update({ portal_goal: goalText || null }).eq('id', patient.id);
      setEditingGoal(false);
    } finally {
      setSavingGoal(false);
    }
  }

  function handleCancelGoal() {
    setGoalText(patient.portalGoal ?? '');
    setEditingGoal(false);
  }

  function handleSaveTz(value: string) {
    setTimezone(value);
    localStorage.setItem(tzKey(token), value);
    setTzSaved(true);
    setTimeout(() => setTzSaved(false), 1800);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F4F1' }}>

      {/* ════════ HERO ════════ */}
      <div style={{ backgroundColor: '#1A2E25', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
        <div style={{ paddingTop: 'max(28px, env(safe-area-inset-top))' }}>
          <div className="px-5 pb-8 flex flex-col items-center text-center">

            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(110,231,183,0.12)', border: '2px solid rgba(110,231,183,0.22)' }}
            >
              <span className="font-black" style={{ color: '#6EE7B7', fontSize: '34px', lineHeight: 1 }}>
                {patient.firstName.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-black text-white" style={{ fontSize: '22px', lineHeight: 1.2 }}>
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px' }}>
              En el camino de una vida más sana
            </p>

            {/* Access code */}
            {patient.accessCode && (
              <div
                className="mt-4 inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', letterSpacing: '0.10em' }}>
                    Código de acceso
                  </span>
                  <span className="font-black tracking-widest mt-0.5" style={{ color: '#6EE7B7', fontSize: '16px', lineHeight: 1 }}>
                    {patient.accessCode}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ════════ CARDS ════════ */}
      <div className="px-4 pt-4 pb-8 space-y-3">

        {/* ── Tu Objetivo ── */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 14px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#2D5A4B' }} />
              <p className="font-bold uppercase" style={{ color: '#4B5E57', fontSize: '10px', letterSpacing: '0.08em' }}>
                Tu Objetivo
              </p>
            </div>
            {!editingGoal && (
              <button
                onClick={() => setEditingGoal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-opacity active:opacity-60"
                style={{ backgroundColor: '#F0F4F1' }}
              >
                <Pencil className="w-3 h-3" style={{ color: '#6B7C73' }} />
                <span style={{ color: '#6B7C73', fontSize: '11px', fontWeight: 600 }}>Editar</span>
              </button>
            )}
          </div>

          {editingGoal ? (
            <div>
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={4}
                autoFocus
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                style={{
                  backgroundColor: '#F9FAFB',
                  border: '1.5px solid #2D5A4B',
                  color: '#1A2E25',
                  lineHeight: 1.5,
                }}
                placeholder="¿Cuál es tu meta? Ej: Bajar 5 kg, mejorar mi energía..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveGoal}
                  disabled={savingGoal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#2D5A4B' }}
                >
                  <Check className="w-3.5 h-3.5" />
                  {savingGoal ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelGoal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity"
                  style={{ backgroundColor: '#F0F4F1', color: '#4B5E57' }}
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: goalText ? '#374151' : '#9CA3AF', fontStyle: goalText ? 'normal' : 'italic' }}>
              {goalText || 'Sin objetivo definido aún. Toca Editar para agregar el tuyo.'}
            </p>
          )}
        </div>

        {/* ── Tu Nutricionista ── */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 14px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#6366F1' }} />
            <p className="font-bold uppercase" style={{ color: '#4B5E57', fontSize: '10px', letterSpacing: '0.08em' }}>
              Tu Nutricionista
            </p>
          </div>

          {/* Nutri row */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#E8F0EC' }}
            >
              {nutritionist.avatar ? (
                <img src={nutritionist.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-extrabold text-xl" style={{ color: '#2D5A4B' }}>
                  {nutritionist.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight" style={{ color: '#1A2E25', fontSize: '15px' }}>
                {nutritionist.professionalTitle
                  ? `${nutritionist.professionalTitle} ${nutritionist.name}`
                  : nutritionist.name}
              </p>
              {nutritionist.specialty && (
                <p className="truncate mt-0.5" style={{ color: '#6B7C73', fontSize: '12px' }}>
                  {nutritionist.specialty}
                </p>
              )}
            </div>
          </div>

          {/* Contact buttons */}
          {(nutritionist.personalPhone || nutritionist.website || nutritionist.instagram) && (
            <div className="flex gap-2">
              {nutritionist.personalPhone && (
                <a
                  href={`https://wa.me/${nutritionist.personalPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-opacity active:opacity-70"
                  style={{ backgroundColor: '#F0FDF4' }}
                >
                  <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
                  <span className="font-semibold" style={{ color: '#25D366', fontSize: '11px' }}>WhatsApp</span>
                </a>
              )}
              {nutritionist.website && (
                <a
                  href={nutritionist.website.startsWith('http') ? nutritionist.website : `https://${nutritionist.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-opacity active:opacity-70"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Globe className="w-5 h-5" style={{ color: '#4F46E5' }} />
                  <span className="font-semibold" style={{ color: '#4F46E5', fontSize: '11px' }}>Sitio web</span>
                </a>
              )}
              {nutritionist.instagram && (
                <a
                  href={`https://instagram.com/${nutritionist.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-opacity active:opacity-70"
                  style={{ backgroundColor: '#FFF0F6' }}
                >
                  <Instagram className="w-5 h-5" style={{ color: '#E1306C' }} />
                  <span className="font-semibold" style={{ color: '#E1306C', fontSize: '11px' }}>Instagram</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Configuración ── */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 14px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#0EA5E9' }} />
            <p className="font-bold uppercase" style={{ color: '#4B5E57', fontSize: '10px', letterSpacing: '0.08em' }}>
              Configuración
            </p>
          </div>

          {/* Timezone */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0EA5E9' }} />
              <span className="font-semibold" style={{ color: '#1A2E25', fontSize: '13px' }}>Zona horaria</span>
              {tzSaved && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#ECFDF5', color: '#065F46', fontSize: '10px', fontWeight: 700 }}
                >
                  <Check className="w-3 h-3" /> Guardado
                </span>
              )}
            </div>
            <p className="mb-2" style={{ color: '#9CA3AF', fontSize: '11px' }}>
              Asegúrate de que coincida con tu ubicación para que los días del plan se calculen correctamente.
            </p>
            <select
              value={timezone}
              onChange={(e) => handleSaveTz(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none"
              style={{
                backgroundColor: '#F9FAFB',
                border: '1.5px solid #E0E8E3',
                color: '#1A2E25',
              }}
            >
              {/* Auto-detected option if not in list */}
              {!TZ_OPTIONS.find(t => t.value === timezone) && (
                <option value={timezone}>{timezone} (detectado)</option>
              )}
              {TZ_OPTIONS.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Logout ── */}
        <div className="pt-1">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm transition-opacity active:opacity-70"
              style={{
                backgroundColor: '#FFF5F5',
                border: '1.5px solid #FECACA',
                color: '#DC2626',
                minHeight: '52px',
              }}
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          ) : (
            <div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 14px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)' }}
            >
              <p className="text-sm font-bold text-center mb-1" style={{ color: '#1A2E25' }}>
                ¿Cerrar sesión?
              </p>
              <p className="text-xs text-center mb-4" style={{ color: '#9CA3AF' }}>
                Necesitarás tu PIN de 4 dígitos para volver a entrar.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: '#F0F4F1', color: '#4B5E57' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  Sí, salir
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
