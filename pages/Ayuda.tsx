import React from 'react';
import { Sparkles, LifeBuoy } from 'lucide-react';
import { TourProfileSection } from '../components/tour/TourProfileSection';

export const Ayuda: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-2xl font-bold">¡Nos alegra tenerte aquí!</h2>
        </div>
        <p className="text-emerald-50">
          Esta es tu página de ayuda. Aquí encuentras cómo aprovechar las guías de cada página, el recorrido guiado paso a paso, y cómo contactarnos si algo no sale como esperas.
        </p>
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
          {' '}y con gusto te ayudamos.
        </p>
        <p className="text-sm text-slate-400">
          Tip: estamos trabajando de forma continua para hacer de NutriFlow una plataforma cada vez más rápida y fácil de usar. Si en algún momento notas información o alguna función que no carga correctamente, te recomendamos recargar la página, ya que en la mayoría de los casos esto resuelve el inconveniente. Asegúrate también de contar con una buena conexión a internet, y si sientes la plataforma lenta, borrar la caché de tu navegador suele ayudar. Si el problema persiste, no dudes en reportarlo para que podamos solucionarlo lo antes posible.
        </p>
      </div>
    </div>
  );
};
