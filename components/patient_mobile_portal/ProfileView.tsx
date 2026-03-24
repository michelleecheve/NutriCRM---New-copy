import React, { useState } from 'react';
import { LogOut, Calendar, Star, MessageCircle, Instagram, Mail } from 'lucide-react';
import { TrackingRow } from '../../types';
import { PortalPatient, PortalNutritionist } from './PortalShell';

interface Props {
  token: string;
  patient: PortalPatient;
  nutritionist: PortalNutritionist;
  activeTracking: TrackingRow | null;
}

function sessionKey(token: string): string {
  return `nutriflow_portal_${token}`;
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// ─── Contact button ───────────────────────────────────────────────────────────

const ContactBtn: React.FC<{
  Icon: React.FC<{ className?: string }>;
  label: string;
  href: string;
  color: string;
  bg: string;
}> = ({ Icon, label, href, color, bg }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-opacity active:opacity-70"
    style={{ backgroundColor: bg }}
  >
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <Icon className="w-4 h-4 text-white" />
    </div>
    <span className="text-xs font-semibold" style={{ color }}>{label}</span>
  </a>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfileView: React.FC<Props> = ({ token, patient, nutritionist, activeTracking }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  function handleLogout() {
    localStorage.removeItem(sessionKey(token));
    window.location.reload();
  }

  const hasContact = !!(nutritionist.phone || nutritionist.instagram || nutritionist.email);

  return (
    <div
      className="min-h-screen bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* ── Card 1: Welcome (dark green) ── */}
      <div
        className="mx-4 mt-5 p-5 rounded-3xl"
        style={{ backgroundColor: '#2D5A4B' }}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Text */}
          <div className="flex-1">
            <p className="text-white font-extrabold text-lg leading-snug">
              Hola {patient.firstName} {patient.lastName},
            </p>
            <p className="text-white text-sm mt-1 leading-relaxed opacity-90">
              estás en el camino de una vida más sana.
            </p>
          </div>
          {/* Avatar initials */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-extrabold"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
          </div>
        </div>
        {/* Decorative line */}
        <div className="mt-4 h-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
      </div>

      {/* ── Card 2: Tu Objetivo ── */}
      <div
        className="mx-4 mt-3 p-5 rounded-3xl"
        style={{ backgroundColor: 'white', border: '1.5px solid #E0E8E3' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#E8F0EC' }}
          >
            <Calendar className="w-5 h-5" style={{ color: '#2D5A4B' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Tu Objetivo</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {patient.consultmotive
                ? patient.consultmotive
                : 'Completar tu plan nutricional y mejorar tu salud y bienestar.'}
            </p>
            {activeTracking?.menuEndDate && (
              <p className="text-xs mt-2 font-semibold" style={{ color: '#2D5A4B' }}>
                Fecha fin del plan: {formatDate(activeTracking.menuEndDate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Card 3: Tracking de Progreso ── */}
      <div
        className="mx-4 mt-3 p-5 rounded-3xl"
        style={{ backgroundColor: 'white', border: '1.5px solid #E0E8E3' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#E8F0EC' }}
          >
            <Star className="w-5 h-5" style={{ color: '#2D5A4B' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Tracking de Progreso</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Suma puntos y gana insignias marcando tus comidas diarias como cumplidas.
              ¡Mantén tu racha para obtener premios!
            </p>
            {/* Medal badge */}
            <div
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
              style={{ backgroundColor: '#E8F0EC' }}
            >
              <span className="text-base">🏅</span>
              <span className="text-xs font-semibold" style={{ color: '#2D5A4B' }}>
                Marca tus comidas diarias para ganar insignias
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 4: Tu Nutricionista ── */}
      <div
        className="mx-4 mt-3 p-5 rounded-3xl"
        style={{ backgroundColor: 'white', border: '1.5px solid #E0E8E3' }}
      >
        {/* Nutri info row */}
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
          <div>
            <p className="font-bold text-gray-900">{nutritionist.name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7C73' }}>{nutritionist.specialty}</p>
          </div>
        </div>

        {/* Contact buttons */}
        {hasContact && (
          <div className="flex gap-2">
            {nutritionist.phone && (
              <ContactBtn
                Icon={MessageCircle}
                label="WhatsApp"
                href={`https://wa.me/${nutritionist.phone.replace(/\D/g, '')}`}
                color="#25D366"
                bg="#F0FDF4"
              />
            )}
            {nutritionist.instagram && (
              <ContactBtn
                Icon={Instagram}
                label="Instagram"
                href={`https://instagram.com/${nutritionist.instagram.replace(/^@/, '')}`}
                color="#E1306C"
                bg="#FFF0F6"
              />
            )}
            {nutritionist.email && (
              <ContactBtn
                Icon={Mail}
                label="Email"
                href={`mailto:${nutritionist.email}`}
                color="#4F46E5"
                bg="#EEF2FF"
              />
            )}
          </div>
        )}
      </div>

      {/* ── Logout ── */}
      <div className="mx-4 mt-5 mb-4">
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
            style={{ backgroundColor: '#FFF5F5', border: '1.5px solid #FECACA' }}
          >
            <p className="text-sm font-bold text-center text-gray-900 mb-1">¿Cerrar sesión?</p>
            <p className="text-xs text-center text-gray-500 mb-4">
              Necesitarás tu PIN de 4 dígitos para volver a entrar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
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
  );
};
