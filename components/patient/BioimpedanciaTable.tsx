import React, { useState, useRef, useLayoutEffect } from 'react';
import { Patient, BioimpedanciaRecord } from '../../types';
import { Table, Download, Star } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BIO_SECTIONS = [
  {
    title: 'DATOS GENERALES',
    rows: [
      { key: 'weight', label: 'Peso corporal (kg)' },
      { key: 'height', label: 'Talla (cm)' },
      { key: 'imc', label: 'IMC', isBold: true },
    ]
  },
  {
    title: 'COMPOSICIÓN CORPORAL',
    rows: [
      { key: 'body_fat_pct', label: '% Grasa corporal' },
      { key: 'water_pct', label: '% Agua corporal total' },
      { key: 'muscle_mass', label: 'Masa muscular' },
      { key: 'physique_rating', label: 'Physique Rating' },
      { key: 'visceral_fat', label: 'Grasa visceral' },
      { key: 'bone_mass', label: 'Masa ósea estimada' },
    ]
  },
  {
    title: 'METABOLISMO',
    rows: [
      { key: 'bmr', label: 'Metabolismo basal (kcal)' },
      { key: 'metabolic_age', label: 'Edad metabólica' },
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
  }
];

export const BioimpedanciaTable: React.FC<{ patient: Patient }> = ({ patient }) => {
  const sortedRecords = [...(patient.bioimpedancias || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, [sortedRecords.length]);

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Paciente';

    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('REPORTE DE BIOIMPEDANCIA', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Paciente: ${patientName}`, 14, 25);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, pageWidth - 14, 25, { align: 'right' });

    const tableData: any[][] = [];
    const headers = ['PARÁMETRO', ...sortedRecords.map(r => new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }))];

    tableData.push([
      'META CUMPLIDA',
      ...sortedRecords.map(r => r.meta_complied === 'true' || r.meta_complied === true ? 'SI' : 'NO')
    ]);

    BIO_SECTIONS.forEach(section => {
      tableData.push([{ content: section.title, colSpan: headers.length, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [71, 85, 105] } }]);

      section.rows.forEach(row => {
        tableData.push([
          row.label,
          ...sortedRecords.map(r => {
            const val = (r as any)[row.key];
            return val !== undefined && val !== null && val !== '' ? val : '-';
          })
        ]);
      });
    });

    const columnStyles: any = {
      0: { cellWidth: 50, fontStyle: 'bold' },
    };
    for (let i = 1; i <= sortedRecords.length; i++) {
      columnStyles[i] = { cellWidth: 30, halign: 'center' };
    }

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
      columnStyles,
      styles: { fontSize: 8, cellPadding: 2 },
      horizontalPageBreak: true,
      horizontalPageBreakRepeat: 0,
    });

    doc.save(`Bioimpedancia_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (sortedRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <Table className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400 italic">No hay datos de bioimpedancia para comparar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-blue-800">
          <Table className="w-5 h-5" />
          <h3 className="font-bold text-lg">Comparativa de Bioimpedancia</h3>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {/* Top Scrollbar */}
      <div
        ref={topScrollRef}
        onScroll={() => syncScroll(topScrollRef, bottomScrollRef)}
        className="border-b border-slate-200 bg-slate-50 block"
        style={{ height: '12px', overflowX: 'scroll', overflowY: 'hidden' }}
      >
        <div style={{ width: `${tableScrollWidth}px`, height: '12px' }} />
      </div>

      <div
        ref={bottomScrollRef}
        onScroll={() => syncScroll(bottomScrollRef, topScrollRef)}
        className="overflow-x-auto pb-4"
      >
        <table ref={tableRef} className="text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-4 font-bold text-blue-800 text-xs uppercase tracking-wider w-52 border-b border-r border-slate-100 sticky left-0 bg-slate-50 z-20">
                PARÁMETRO
              </th>
              {sortedRecords.map((r) => (
                <th key={r.id} className="p-2 border-b border-slate-100 min-w-[110px] text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-1">FECHA EVALUACIÓN</span>
                    <div className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 text-center w-28">
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Meta Cumplida Row */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-4 font-bold text-slate-500 text-xs border-r border-slate-100 sticky left-0 bg-white z-10 flex items-center gap-2 w-52">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> META CUMPLIDA
              </td>
              {sortedRecords.map((r) => {
                const isComplied = r.meta_complied === 'true' || r.meta_complied === true;
                return (
                  <td key={`${r.id}-meta`} className="p-2 text-center border-r border-slate-50">
                    <div className="flex justify-center">
                      {isComplied ? (
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Star className="w-5 h-5 text-slate-200" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {BIO_SECTIONS.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                <tr className="bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-400 text-xs uppercase tracking-widest pl-4 border-y border-slate-100 sticky left-0 z-10 w-52 bg-slate-50">
                    {section.title}
                  </td>
                  {sortedRecords.map((r) => (
                    <td key={r.id} className="border-y border-slate-100 bg-slate-50/50"></td>
                  ))}
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50 transition-colors group">
                    <td className={`p-4 border-r border-slate-100 sticky left-0 bg-white z-10 text-slate-700 w-52 ${row.isBold ? 'font-bold' : 'font-medium'}`}>
                      {row.label}
                    </td>
                    {sortedRecords.map((r) => {
                      const val = (r as any)[row.key];
                      return (
                        <td key={`${r.id}-${row.key}`} className="p-3 border-r border-slate-50 text-center text-slate-600 font-medium">
                          {val !== undefined && val !== null && val !== '' ? val : '-'}
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
