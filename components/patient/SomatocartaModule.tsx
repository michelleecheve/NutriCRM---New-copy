
import React, { useState, useRef } from 'react';
import { Patient, SomatotypeRecord } from '../../types';
import { Calendar, Eye, Edit2, Trash2, X, Crosshair, Plus, Download } from 'lucide-react';
import { GridInput } from './SharedComponents';


const SomatocartaChart = ({ x, y }: { x: number; y: number }) => {
  // Internal coordinate system for viewBox
  const W = 500;
  const H = 500;
  const P = 60; // Padding for labels and illustrations

  // Axis range: X from -10 to 10, Y from -10 to 10
  const X_MIN = -10, X_MAX = 10;
  const Y_MIN = -10, Y_MAX = 10;

  // Map data coords → SVG pixels with padding
  const toSVG = (dx: number, dy: number) => ({
    x: P + ((dx - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * P),
    y: H - P - ((dy - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * P),
  });

  const origin = toSVG(0, 0);
  const MESO = toSVG(0, 10);
  const ENDO = toSVG(-8, -8);
  const ECTO = toSVG(8, -8);
  const pt = toSVG(x, y);

  // Curved boundary path using arcs
  const r = 400;
  const boundaryPath = `
    M ${MESO.x} ${MESO.y}
    A ${r} ${r} 0 0 1 ${ECTO.x} ${ECTO.y}
    A ${r} ${r} 0 0 1 ${ENDO.x} ${ENDO.y}
    A ${r} ${r} 0 0 1 ${MESO.x} ${MESO.y}
  `;

  const xTicks = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
  const yTicks = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        {/* ── Grid ── */}
        {xTicks.map((tx) => {
          const sx = toSVG(tx, 0).x;
          return (
            <line
              key={`gx${tx}`}
              x1={sx} y1={P} x2={sx} y2={H - P}
              stroke="#E2E8F0" strokeWidth="0.5"
            />
          );
        })}
        {yTicks.map((ty) => {
          const sy = toSVG(0, ty).y;
          return (
            <line
              key={`gy${ty}`}
              x1={P} y1={sy} x2={W - P} y2={sy}
              stroke="#E2E8F0" strokeWidth="0.5"
            />
          );
        })}

        {/* ── Main axes ── */}
        <line x1={P} y1={origin.y} x2={W - P} y2={origin.y} stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1={origin.x} y1={P} x2={origin.x} y2={H - P} stroke="#E2E8F0" strokeWidth="1.5" />

        {/* ── Curved boundary ── */}
        <path
          d={boundaryPath}
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeDasharray="6,4"
        />

        {/* ── Lines from origin to vertices ── */}
        <line x1={origin.x} y1={origin.y} x2={MESO.x} y2={MESO.y} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={origin.x} y1={origin.y} x2={ENDO.x} y2={ENDO.y} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={origin.x} y1={origin.y} x2={ECTO.x} y2={ECTO.y} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4,4" />

        {/* ── Illustrations (Minimal Silhouettes) ── */}
        {/* Mesomorph (Top) */}
        <g transform={`translate(${MESO.x}, ${MESO.y - 35}) scale(0.5)`}>
          <path d="M-12,0 L12,0 L18,10 L12,45 L-12,45 L-18,10 Z" fill="#047857" opacity="0.15" />
          <circle cx="0" cy="-12" r="8" fill="#047857" opacity="0.25" />
          <path d="M-15,8 Q0,2 15,8" fill="none" stroke="#047857" strokeWidth="2.5" opacity="0.4" />
        </g>

        {/* Endomorph (Left) */}
        <g transform={`translate(${ENDO.x - 35}, ${ENDO.y + 15}) scale(0.5)`}>
          <ellipse cx="0" cy="22" rx="20" ry="25" fill="#1D4ED8" opacity="0.15" />
          <circle cx="0" cy="-12" r="8" fill="#1D4ED8" opacity="0.25" />
        </g>

        {/* Ectomorph (Right) */}
        <g transform={`translate(${ECTO.x + 35}, ${ECTO.y + 15}) scale(0.5)`}>
          <rect x="-8" y="0" width="16" height="45" rx="6" fill="#B45309" opacity="0.15" />
          <circle cx="0" cy="-12" r="8" fill="#B45309" opacity="0.25" />
        </g>

        {/* ── Labels ── */}
        <text x={MESO.x} y={MESO.y - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="#064E3B" className="font-sans">Mesomorfia</text>
        <text x={ENDO.x - 5} y={ENDO.y + 25} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1E3A8A" className="font-sans">Endomorfia</text>
        <text x={ECTO.x + 5} y={ECTO.y + 25} textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350F" className="font-sans">Ectomorfia</text>

        {/* ── Axis ticks ── */}
        {xTicks.filter(t => t % 4 === 0).map(t => (
          <text key={`tx${t}`} x={toSVG(t, 0).x} y={origin.y + 16} textAnchor="middle" fontSize="10" fill="#94A3B8" fontWeight="600" className="font-mono">{t}</text>
        ))}
        {yTicks.filter(t => t % 4 === 0).map(t => (
          <text key={`ty${t}`} x={origin.x - 10} y={toSVG(0, t).y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="600" className="font-mono">{t}</text>
        ))}

        {/* ── Data Point ── */}
        <circle cx={pt.x} cy={pt.y} r="6" fill="#10B981" stroke="white" strokeWidth="2.5" className="drop-shadow-sm" />
        <text 
          x={pt.x} 
          y={pt.y - 12} 
          textAnchor="middle" 
          fontSize="10" 
          fontWeight="bold" 
          fill="#064E3B" 
          className="font-mono"
        >
          ({x.toFixed(1)}, {y.toFixed(1)})
        </text>
      </svg>
    </div>
  );
};

export const SomatocartaModule: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ date: string, x: string, y: string }>({
    date: new Date().toISOString().split('T')[0],
    x: '',
    y: ''
  });
  const [viewingChart, setViewingChart] = useState<SomatotypeRecord | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const downloadChartAsImage = () => {
    if (!chartContainerRef.current) return;
    const svg = chartContainerRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set canvas size to match SVG viewBox or desired output size
    canvas.width = 1000;
    canvas.height = 1000;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `somatocarta-${viewingChart?.date || 'chart'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  const resetForm = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], x: '', y: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (rec: SomatotypeRecord) => {
    setFormData({
        date: rec.date,
        x: rec.x.toString(),
        y: rec.y.toString()
    });
    setEditingId(rec.id);
    setShowForm(true);
    setTimeout(() => {
        document.getElementById('somatocarta-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSave = () => {
    if (!formData.x || !formData.y || !formData.date) return;
    
    const xVal = parseFloat(formData.x);
    const yVal = parseFloat(formData.y);
    
    let updatedSomatotypes = [...(patient.somatotypes || [])];

    if (editingId) {
        updatedSomatotypes = updatedSomatotypes.map(s => 
            s.id === editingId 
            ? { ...s, date: formData.date, x: xVal, y: yVal }
            : s
        );
    } else {
        const newRecord: SomatotypeRecord = {
            id: Math.random().toString(36).substring(7),
            date: formData.date,
            x: xVal,
            y: yVal
        };
        updatedSomatotypes = [newRecord, ...updatedSomatotypes];
    }
    
    onUpdate({ ...patient, somatotypes: updatedSomatotypes });
    resetForm();
  };

  const handleDelete = (id: string) => {
    if(confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        const updated = patient.somatotypes.filter(s => s.id !== id);
        onUpdate({ ...patient, somatotypes: updated });
        if (editingId === id) resetForm();
    }
  };

  const sortedRecords = [...(patient.somatotypes || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex justify-between items-center p-6 border-b border-slate-100">
         <div className="flex items-center gap-2 text-emerald-800">
            <Crosshair className="w-5 h-5" />
            <h3 className="font-bold text-lg">Historial de Somatocarta</h3>
         </div>
         <button 
           onClick={() => {
             if (showForm) resetForm();
             else setShowForm(true);
           }}
           className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors ${showForm ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'}`}
         >
           {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
           {showForm ? 'Cancelar' : 'Generar Nuevo Somatotipo'}
         </button>
       </div>

       {showForm && (
         <div id="somatocarta-form" className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in slide-in-from-top-2">
            <GridInput label="Fecha" type="date" value={formData.date} onChange={(e: any) => setFormData({...formData, date: e.target.value})} />
            <GridInput label="Coordenada X" type="number" placeholder="-1.5" value={formData.x} onChange={(e: any) => setFormData({...formData, x: e.target.value})} />
            <GridInput label="Coordenada Y" type="number" placeholder="4.2" value={formData.y} onChange={(e: any) => setFormData({...formData, y: e.target.value})} />
            <button onClick={handleSave} className="h-[38px] bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
               {editingId ? 'Actualizar Registro' : 'Guardar Registro'}
            </button>
         </div>
       )}

       <div className="p-6">
          {sortedRecords.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                <Crosshair className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay registros de somatotipo.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRecords.map(rec => (
                   <div key={rec.id} className={`border rounded-xl p-4 hover:shadow-md transition-all bg-white relative group ${editingId === rec.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <span className="font-bold text-slate-700 text-sm">{rec.date}</span>
                         </div>
                         <div className="flex gap-1">
                            <button onClick={() => setViewingChart(rec)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Ver Gráfico"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEditClick(rec)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(rec.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      <div className="flex gap-4 mb-3">
                         <div className="flex-1 bg-slate-50 rounded p-2 text-center">
                            <div className="text-xs text-slate-400 uppercase font-bold">Coord X</div>
                            <div className="font-bold text-slate-800">{rec.x}</div>
                         </div>
                         <div className="flex-1 bg-slate-50 rounded p-2 text-center">
                            <div className="text-xs text-slate-400 uppercase font-bold">Coord Y</div>
                            <div className="font-bold text-slate-800">{rec.y}</div>
                         </div>
                      </div>
                      <div className="h-32 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                         <SomatocartaChart x={rec.x} y={rec.y} />
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

        {viewingChart && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewingChart(null)}>
             <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <div>
                      <h3 className="font-bold text-lg text-slate-900">Somatocarta</h3>
                      <p className="text-sm text-slate-500">Fecha: {viewingChart.date}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={downloadChartAsImage}
                        className="p-2 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors flex items-center gap-2 px-4 font-bold text-sm"
                        title="Descargar Imagen"
                      >
                        <Download className="w-5 h-5" />
                        Descargar PNG
                      </button>
                      <button onClick={() => setViewingChart(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-6 h-6" /></button>
                   </div>
                </div>
                <div ref={chartContainerRef} className="p-8 h-[600px] flex items-center justify-center bg-white">
                   <SomatocartaChart x={viewingChart.x} y={viewingChart.y} />
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
