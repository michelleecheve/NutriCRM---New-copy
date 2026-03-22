
import React, { useState, useRef, useLayoutEffect } from 'react';
import { Patient, Measurement } from '../../types';
import { store } from '../../services/store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Activity, Download, Plus, Save, Star } from 'lucide-react';
import { GridInput } from './SharedComponents';

const DIAGNOSTIC_OPTIONS = [
  "% de grasa adecuado, buen desarrollo muscular, EN normal según IMC",
  "% de grasa adecuado, bajo desarrollo muscular, EN normal según IMC",
  "% de grasa elevado, buen desarrollo muscular, EN normal según IMC",
  "% de grasa bajo, buen desarrollo muscular, EN normal según IMC",
  "% de grasa adecuado, desarrollo muscular elevado, EN sobrepeso según IMC",
  "Deshidratado",
  "Bien hidratado",
  "Hidratado",
  "Peso corporal total adecuado para etapa",
  "Peso corporal total alto para etapa",
  "Peso corporal total bajo para etapa",
  "Sobrepeso según IMC, % de grasa elevado y desarrollo muscular adecuado",
  "Obesidad según IMC, % de grasa elevado y desarrollo muscular adecuado",
  "Obesidad según IMC, % de grasa y desarrollo muscular elevado.",
  "Bajo peso para estatura según percentiles OMS",
  "Peso normal para estatura según percentiles OMS",
  "Sobrepeso para estatura según percentiles OMS",
  "% de grasa bajo, bajo desarrollo muscular, EN bajo peso según IMC",
  "% de grasa elevado, desarrollo muscular elevado, EN obesidad según IMC",
  "% de grasa adecuado, bajo desarrollo muscular, EN bajo peso según IMC"
];

const MEASUREMENT_SECTIONS = [
  {
    title: 'DATOS GENERALES',
    rows: [
      { key: 'gender', label: 'Género (M/F)', isSelect: true, options: ['M', 'F'] },
      { key: 'age', label: 'Edad' },
      { key: 'weight', label: 'Peso (kg)' },
      { key: 'height', label: 'Talla (cm)' },
    ]
  },
  {
    title: 'PLIEGUES CUTÁNEOS (MM)',
    rows: [
      { key: 'biceps', label: 'Bíceps' },
      { key: 'triceps', label: 'Tríceps' },
      { key: 'subscapular', label: 'Subescapular' },
      { key: 'supraspinal', label: 'Supraespinal' },
      { key: 'abdomen', label: 'Abdomen' },
      { key: 'thigh', label: 'Muslo' },
      { key: 'calf', label: 'Pantorrilla' },
      { key: 'iliacCrest', label: 'Cresta Ilíaca' },
      { key: 'skinfoldSum', label: 'SUM. PLIEGUES', isBold: true },
    ]
  },
  {
    title: 'DIÁMETROS ÓSEOS (CM)',
    rows: [
      { key: 'wrist', label: 'Muñeca' },
      { key: 'humerus', label: 'Húmero' },
      { key: 'femur', label: 'Fémur' },
    ]
  },
  {
    title: 'PERÍMETROS CORPORALES (CM)',
    rows: [
      { key: 'armRelaxed', label: 'Brazo' },
      { key: 'armContracted', label: 'Brazo cont.' },
      { key: 'calfGirth', label: 'Pantorrilla' },
      { key: 'waist', label: 'Cintura' },
      { key: 'umbilical', label: 'Umbilical' },
      { key: 'hip', label: 'Cadera' },
      { key: 'abdominalLow', label: '3 cm abajo umb.' },
      { key: 'thighRight', label: 'Muslo der.' },
      { key: 'thighLeft', label: 'Muslo izq.' },
    ]
  },
  {
    title: 'COMPOSICIÓN CORPORAL',
    rows: [
      { key: 'imc', label: 'IMC', isCalculated: true },
      { key: 'bodyFat', label: '% Grasa', isCalculated: true },
      { key: 'fatKg', label: 'Peso Grasa (kg)', isCalculated: true },
      { key: 'leanMassKg', label: 'Peso Libre de Grasa (kg)', isCalculated: true },
      { key: 'leanMassPct', label: '% Peso Libre de Grasa', isCalculated: true },
      { key: 'aks', label: 'AKS', isCalculated: true },
      { key: 'boneMass', label: 'Masa Ósea (kg)', isCalculated: true },
      { key: 'residualMass', label: 'PesRES (kg)', isCalculated: true },
      { key: 'muscleKg', label: 'Peso Músculo (kg)', isCalculated: true },
    ]
  },
  {
    title: 'SOMATOTIPO',
    rows: [
      { key: 'endomorfo', label: 'Endomorfo', isCalculated: true },
      { key: 'mesomorfo', label: 'Mesomorfo', isCalculated: true },
      { key: 'ectomorfo', label: 'Ectomorfo', isCalculated: true },
      { key: 'x', label: 'X', isCalculated: true },
      { key: 'y', label: 'Y', isCalculated: true },
    ]
  },
  {
    title: 'DIAGNÓSTICO NUTRICIONAL',
    rows: [
      { key: 'diagnosticN', label: 'Diagnóstico N' },
      { key: 'subjectiveValuation', label: 'Valoración Subjetiva' },
    ]
  }
];

export const AnthropometryTable: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const sortedMeasurements = [...patient.measurements].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Set standard font to avoid encoding issues
    doc.setFont('helvetica');
    
    doc.setFontSize(16);
    doc.text(`Medidas Antropométricas: ${patient.firstName} ${patient.lastName}`, 14, 15);
    doc.setFontSize(10);
    // Use Spanish Date Format
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 22);

    const dates = sortedMeasurements.map(m => m.date);
    const tableHead = [['Parámetro', ...dates]];
    
    const tableBody: any[] = [];

    const metaCells = [
        { content: 'Meta Cumplida', styles: { fontStyle: 'bold', textColor: [50, 50, 50] } }
    ];
    sortedMeasurements.forEach(m => {
       metaCells.push({ 
           content: m.metaComplied ? 'SI' : '-', 
           styles: { 
               fontStyle: 'bold', 
               textColor: m.metaComplied ? [234, 179, 8] : [200, 200, 200],
               halign: 'center'
           } 
       } as any);
    });
    tableBody.push(metaCells);

    MEASUREMENT_SECTIONS.forEach(section => {
      tableBody.push([{ content: section.title, colSpan: dates.length + 1, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', halign: 'left', textColor: [100, 116, 139] } }]);
      
      section.rows.forEach(row => {
        const isDiagnostic = row.key === 'diagnosticN';
        const rowData: any[] = [];
        
        // Parameter name cell
        rowData.push(isDiagnostic 
          ? { content: row.label, styles: { fontSize: 7, fontStyle: 'bold' } } 
          : row.label
        );

        sortedMeasurements.forEach(m => {
          const val = (m as any)[row.key];
          const content = val !== undefined && val !== null ? val.toString() : '-';
          rowData.push(isDiagnostic 
            ? { content: content, styles: { fontSize: 5, halign: 'center' } } 
            : content
          );
        });
        tableBody.push(rowData);
      });
    });

    const columnStyles: any = {
      0: { cellWidth: 50, fontStyle: 'bold' }
    };
    for (let i = 1; i <= dates.length; i++) {
      columnStyles[i] = { cellWidth: 30, halign: 'center' };
    }

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 25,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        font: 'helvetica',
        overflow: 'linebreak', // Force wrap for long text like Diagnostic N
      },
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: columnStyles,
      horizontalPageBreak: true,
      horizontalPageBreakRepeat: 0, // Repeat the "Parámetro" column on every horizontal page
    });

    doc.save(`medidas_${patient.firstName}_${patient.lastName}.pdf`);
  };

  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  const syncScroll = (source: React.RefObject<HTMLDivElement>, target: React.RefObject<HTMLDivElement>) => {
    if (source.current && target.current) {
      target.current.scrollLeft = source.current.scrollLeft;
    }
  };

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setTableScrollWidth(tableRef.current.scrollWidth);
      }
    };
    
    // Initial update
    updateWidth();
    
    // Update after a short delay to ensure layout is stable
    const timer = setTimeout(updateWidth, 100);
    
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, [sortedMeasurements.length, patient.measurements]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex justify-between items-center p-6 border-b border-slate-100">
         <div className="flex items-center gap-2 text-emerald-800">
            <Activity className="w-5 h-5" />
            <h3 className="font-bold text-lg">Seguimiento de Medidas Antropométricas</h3>
         </div>
         <div className="flex gap-3">
           <button 
             onClick={handleExportPDF}
             className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
           >
             <Download className="w-4 h-4" /> Exportar PDF
           </button>
         </div>
       </div>

       {/* Top Scrollbar */}
       <div 
         ref={topScrollRef}
         onScroll={() => syncScroll(topScrollRef, bottomScrollRef)}
         className="border-b border-slate-200 bg-slate-100 block"
         style={{ height: '18px', overflowX: 'scroll', overflowY: 'hidden' }}
       >
         <div style={{ width: `${tableScrollWidth}px`, height: '18px' }} />
       </div>

       <div 
         ref={bottomScrollRef}
         onScroll={() => syncScroll(bottomScrollRef, topScrollRef)}
         className="overflow-x-auto pb-4"
       >
         <table 
           ref={tableRef}
           className="text-sm text-left border-collapse"
         >
           <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 font-bold text-emerald-800 text-xs uppercase tracking-wider w-52 border-b border-r border-slate-100 sticky left-0 bg-slate-50 z-20">
                   PARÁMETRO
                </th>
                {sortedMeasurements.map((m) => (
                  <th key={m.id || m.date} className="p-2 border-b border-slate-100 min-w-[110px] text-center">
                     <div className="flex flex-col items-center">
                       <span className="text-[10px] font-bold text-emerald-600 uppercase mb-1">FECHA EVALUACIÓN</span>
                       <div className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 text-center w-32">
                         {new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                     </div>
                  </th>
                ))}
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50">
                 <td className="p-4 font-bold text-slate-500 text-xs border-r border-slate-100 sticky left-0 bg-white z-10 flex items-center gap-2 w-52">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> META CUMPLIDA
                 </td>
                 {sortedMeasurements.map((m) => (
                   <td key={m.id || m.date} className="p-2 text-center border-r border-slate-50">
                      <div className="flex justify-center">
                        {m.metaComplied ? (
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <Star className="w-5 h-5 text-slate-200" />
                        )}
                      </div>
                   </td>
                 ))}
              </tr>

              {MEASUREMENT_SECTIONS.map((section, sIdx) => (
                <React.Fragment key={sIdx}>
                  <tr className="bg-slate-50/80">
                     <td className="p-3 font-bold text-slate-400 text-xs uppercase tracking-widest pl-4 border-y border-slate-100 sticky left-0 z-10 w-52 bg-slate-50">
                        {section.title}
                     </td>
                     {sortedMeasurements.map((m) => (
                       <td key={m.id || m.date} className="border-y border-slate-100 bg-slate-50/50"></td>
                     ))}
                  </tr>
                  {section.rows.map((row: any) => (
                    <tr key={row.key} className="hover:bg-slate-50 transition-colors group">
                      <td className={`p-4 border-r border-slate-100 sticky left-0 bg-white z-10 text-slate-700 w-52 ${row.isBold ? 'font-bold' : 'font-medium'}`}>
                         {row.label}
                      </td>
                      {sortedMeasurements.map((m) => {
                         const rawValue = (m as any)[row.key];
                         let displayValue = rawValue;
                         if (row.isCalculated) {
                             if (displayValue === undefined || displayValue === null || isNaN(displayValue)) displayValue = '-';
                             else displayValue = displayValue.toFixed(3);
                         } else if (rawValue === undefined || rawValue === null || rawValue === '') {
                             displayValue = '-';
                         }

                         return (
                            <td key={`${m.id || m.date}-${row.key}`} className={`p-3 border-r border-slate-50 text-center ${row.isCalculated ? 'bg-emerald-50/30 text-emerald-700 font-bold' : 'text-slate-600 font-medium'}`}>
                               <div className={row.key === 'diagnosticN' ? 'text-[10px] leading-tight max-w-[150px] mx-auto' : ''}>
                                 {displayValue}
                               </div>
                            </td>
                         );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
           </tbody>
         </table>
       </div>
    </div>
  );
};
