import React from 'react';
import { BioimpedanciaRecord } from '../../types';
import { Calendar, Activity, TrendingUp, Star } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, unit, colorClass }: any) => (
  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-slate-700">
        {value} <span className="text-[10px] text-slate-400 font-medium">{unit}</span>
      </p>
    </div>
  </div>
);

interface BioimpedanciaCardProps {
  record: BioimpedanciaRecord;
  onEdit?: (id: string) => void;
}

export const BioimpedanciaCard: React.FC<BioimpedanciaCardProps> = ({ record, onEdit }) => {
  return (
    <div 
      onClick={() => onEdit?.(record.id)}
      className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Header of the card */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-slate-700">
            {new Date(record.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
          Bioimpedancia
        </div>
      </div>

      {/* Content of the card */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={Activity}
          label="Peso"
          value={record.weight}
          unit="kg"
          colorClass="bg-blue-50 text-blue-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="IMC"
          value={record.imc}
          unit=""
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <MetricCard 
          icon={Activity} 
          label="% Grasa" 
          value={record.body_fat_pct} 
          unit="%" 
          colorClass="bg-orange-50 text-orange-600" 
        />
        
        {/* Meta / Estrella */}
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className={`p-2 rounded-lg ${record.meta_complied === 'true' ? 'bg-yellow-50 text-yellow-500' : 'bg-slate-50 text-slate-300'}`}>
            <Star className={`w-4 h-4 ${record.meta_complied === 'true' ? 'fill-yellow-500' : ''}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Meta</p>
            <p className="text-sm font-bold text-slate-700">
              {record.meta_complied === 'true' ? 'Cumplida' : 'Pendiente'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
