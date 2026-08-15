import React from 'react';
import { Sparkles, LifeBuoy, MessageCircle } from 'lucide-react';
import { TourProfileSection } from '../components/tour/TourProfileSection';

export const Ayuda: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-bold">¡Nos alegra tenerte aquí!</h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <TourProfileSection />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <LifeBuoy className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Soporte</h3>
        </div>
        <p className="text-sm text-slate-600">
          ¿Tienes dudas o quieres reportar un problema? Contáctanos a{' '}
          <a href="mailto:nutrifollow.app@outlook.com" className="font-bold text-emerald-700 hover:text-emerald-800">
            nutrifollow.app@outlook.com
          </a>
          {' '}o por medio de whatsapp (
          <a href={`https://wa.me/50252720714?text=${encodeURIComponent('Hola quisiera ayuda de NutriFollow')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            click aquí
          </a>
          ) y con gusto te ayudamos.
        </p>
        <a
          href={`https://wa.me/50252720714?text=${encodeURIComponent('Hola quisiera ayuda de NutriFollow')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl px-4 py-3 transition-colors shadow-sm shadow-emerald-600/20"
        >
          <MessageCircle className="w-4 h-4" />
          Recibir ayuda por WhatsApp
        </a>
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">Tips para un funcionamiento rápido del sistema:</p>
          <p><span className="font-bold text-slate-900">1.</span> Recarga la página si algo no carga bien.</p>
          <p><span className="font-bold text-slate-900">2.</span> Verifica que tengas buena conexión a internet.</p>
          <p><span className="font-bold text-slate-900">3.</span> Borra la caché de tu navegador de vez en cuando.</p>
          <p><span className="font-bold text-slate-900">4.</span> Si el problema sigue, repórtalo y lo resolvemos.</p>
        </div>
      </div>
    </div>
  );
};
