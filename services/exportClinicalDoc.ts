import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx';
import { Patient } from '../types';

const val = (v: any): string => (v !== undefined && v !== null && v !== '' ? String(v) : '—');

const field = (label: string, value: any): Paragraph =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: val(value), size: 22 }),
    ],
  });

const fieldBlock = (label: string, value: any): Paragraph[] => {
  const text = val(value);
  return [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `${label}:`, bold: true, size: 22 })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      indent: { left: 360 },
      children: [new TextRun({ text, size: 22, color: text === '—' ? 'AAAAAA' : '222222' })],
    }),
  ];
};

const sectionHeader = (title: string): Paragraph =>
  new Paragraph({
    spacing: { before: 360, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '0D9488' } },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 26,
        color: '0D9488',
      }),
    ],
  });

const divider = (): Paragraph =>
  new Paragraph({
    spacing: { before: 120, after: 120 },
    children: [new TextRun({ text: '', size: 4 })],
  });

export async function exportClinicalDoc(patient: Patient): Promise<void> {
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const c = patient.clinical;

  // ── Sports profile table ──────────────────────────────────────────────────
  const sports = patient.sportsProfile || [];
  const sportsRows: Paragraph[] = [];

  if (sports.length > 0) {
    const headerRow = new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Deporte / Actividad', bold: true, size: 20 })] })],
          width: { size: 2500, type: WidthType.DXA },
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Días/Sem', bold: true, size: 20 })] })],
          width: { size: 1200, type: WidthType.DXA },
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Horario', bold: true, size: 20 })] })],
          width: { size: 3500, type: WidthType.DXA },
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Hrs/Día', bold: true, size: 20 })] })],
          width: { size: 1200, type: WidthType.DXA },
        }),
      ],
    });

    const dataRows = sports.map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.sport), size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.daysPerWeek), size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.schedule), size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.hoursPerDay), size: 20 })] })] }),
          ],
        })
    );

    sportsRows.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Deportes y Actividades Físicas:', bold: true, size: 22 })],
      })
    );

    // We'll add the table inline as a section in the children array
    // Return table separately and merge
  }

  // ── Build document children ───────────────────────────────────────────────
  const docChildren: any[] = [
    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: fullName, bold: true, size: 40, color: '0F766E' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'Información Clínica Completa', size: 26, color: '475569' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `Fecha de exportación: ${dateStr}`, size: 20, color: '94A3B8', italics: true }),
      ],
    }),
    new Paragraph({
      spacing: { after: 320 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '0D9488' } },
      children: [new TextRun({ text: '', size: 4 })],
    }),

    // ── STATUS ───────────────────────────────────────────────────────────────
    sectionHeader('Status del Paciente'),
    field('Status', c.status || 'Sin Status'),

    // ── INFORMACIÓN PERSONAL ─────────────────────────────────────────────────
    sectionHeader('Información Personal'),
    field('Nombre completo', fullName),
    field('CUI / DPI', c.cui),
    field('Fecha de nacimiento', c.birthdate),
    field('Edad', c.age ? `${c.age} años` : undefined),
    field('Género', c.sex),
    field('Email', c.email),
    field('Teléfono', c.phone),
    field('Trabajo / Ocupación', c.occupation),
    field('Estudio', c.study),
    divider(),
    ...fieldBlock('Motivos de Consulta', c.consultmotive),
    ...fieldBlock('Antecedentes', c.clinicalbackground),

    // ── PERFIL DEPORTIVO ─────────────────────────────────────────────────────
    sectionHeader('Perfil Deportivo'),
  ];

  // Sports table or empty notice
  if (sports.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Deportes y Actividades Físicas:', bold: true, size: 22 })],
      })
    );

    const headerRow = new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Deporte / Actividad', bold: true, size: 20 })] })],
          width: { size: 2500, type: WidthType.DXA },
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Días/Sem', bold: true, size: 20 })] })],
          width: { size: 1200, type: WidthType.DXA },
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Horario', bold: true, size: 20 })] })],
          width: { size: 3500, type: WidthType.DXA },
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
          children: [new Paragraph({ children: [new TextRun({ text: 'Hrs/Día', bold: true, size: 20 })] })],
          width: { size: 1200, type: WidthType.DXA },
        }),
      ],
    });

    const dataRows = sports.map(
      (s) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.sport), size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.daysPerWeek), size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.schedule), size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(s.hoursPerDay), size: 20 })] })] }),
          ],
        })
    );

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      })
    );
    docChildren.push(divider());
  } else {
    docChildren.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Sin deportes o actividades físicas registradas.', size: 22, color: 'AAAAAA', italics: true })],
      })
    );
  }

  docChildren.push(
    field('Categoría / Disciplina', c.categ_discipline),
    field('Edad Deportiva', c.sport_age),
    field('Competencia', c.competencia),

    // ── HISTORIA CLÍNICA ─────────────────────────────────────────────────────
    sectionHeader('Historia Clínica'),
    ...fieldBlock('Diagnóstico médico', c.diagnosis),
    ...fieldBlock('Antecedentes familiares de enfermedades', c.familyHistory),
    ...fieldBlock('Medicamentos', c.medications),
    ...fieldBlock('Suplementos', c.supplements),
    ...fieldBlock('Alergias e Intolerancias', c.allergies),
    ...fieldBlock('Horas de Sueño', c.sleep_hours),

    // Menstrual
    new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [new TextRun({ text: 'Periodo Menstrual:', bold: true, size: 22 })],
    }),
    field('Regular', c.regularPeriod),
    field('Duración', c.periodDuration),
    field('Edad de primera menstruación', c.firstperiodage),
    ...fieldBlock('Otros (menstrual)', c.menstrualOthers),

    ...fieldBlock('Otras Notas', c.othersNotes),

    // ── PERFIL DIETÉTICO ─────────────────────────────────────────────────────
    sectionHeader('Perfil Dietético'),
    ...fieldBlock('Preferencias y Aversiones', patient.dietary.preferences),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            },
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = `${patient.firstName}_${patient.lastName}`.replace(/\s+/g, '_');
  link.download = `${safeName}_InformacionClinica.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
