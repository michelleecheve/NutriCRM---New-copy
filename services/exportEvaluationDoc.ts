import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  ImageRun,
} from 'docx';
import { Patient, PatientEvaluation } from '../types';
import { BioimpedanciaInterpretation } from '../components/patient/BioimpedanciaInterpretation';
import { SomatocartaLogic } from '../components/patient/SomatocartaLogic';

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 26, color: '0D9488' })],
  });

const subHeader = (title: string): Paragraph =>
  new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text: title, bold: true, size: 22, color: '475569' })],
  });

const divider = (): Paragraph =>
  new Paragraph({
    spacing: { before: 120, after: 120 },
    children: [new TextRun({ text: '', size: 4 })],
  });

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = window.atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes;
}

// ── Chart capture ─────────────────────────────────────────────────────────────

async function captureComponent(element: React.ReactElement, containerStyle: Partial<CSSStyleDeclaration>): Promise<string | null> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = containerStyle.width || '700px';
  container.style.backgroundColor = containerStyle.backgroundColor || '#ffffff';
  if (containerStyle.height) container.style.height = containerStyle.height;
  document.body.appendChild(container);

  const root = createRoot(container);
  let base64: string | null = null;

  try {
    root.render(element);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    base64 = canvas.toDataURL('image/png').split(',')[1];
  } catch (_e) {
    base64 = null;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }

  return base64;
}

// ── Photo fetch ───────────────────────────────────────────────────────────────

async function fetchPhotoBase64(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<Uint8Array | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (!base64) { resolve(null); return; }
        resolve(base64ToUint8Array(base64));
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (_e) {
    return null;
  }
}

// ── EXCHANGE_LIST ─────────────────────────────────────────────────────────────

const EXCHANGE_LIST: Record<string, { name: string; kcal: number; cho: number; chon: number; fat: number }> = {
  lec:      { name: 'Lácteos Enteros',          kcal: 150, cho: 12, chon: 7, fat: 8 },
  lecDesc:  { name: 'Lácteos Descremados',       kcal: 90,  cho: 12, chon: 7, fat: 1 },
  fru:      { name: 'Frutas',                    kcal: 60,  cho: 15, chon: 0, fat: 0 },
  veg:      { name: 'Vegetales',                 kcal: 25,  cho: 5,  chon: 2, fat: 0 },
  cer:      { name: 'Cereales',                  kcal: 80,  cho: 15, chon: 6, fat: 0 },
  carMagra: { name: 'Carnes Magras',             kcal: 55,  cho: 0,  chon: 7, fat: 3 },
  carSemi:  { name: 'Carnes Semi Grasas',        kcal: 75,  cho: 0,  chon: 7, fat: 5 },
  carAlta:  { name: 'Carnes Altas en Grasa',     kcal: 100, cho: 0,  chon: 7, fat: 8 },
  gra:      { name: 'Grasas',                    kcal: 45,  cho: 0,  chon: 0, fat: 5 },
  azu:      { name: 'Azúcares',                  kcal: 45,  cho: 12, chon: 0, fat: 0 },
};

// ── Table builder helpers ─────────────────────────────────────────────────────

function twoColTable(rows: Array<[string, any]>): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
        width: { size: 3500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Campo', bold: true, size: 20 })] })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
        width: { size: 5000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Valor', bold: true, size: 20 })] })],
      }),
    ],
  });

  const dataRows = rows.map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 5000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: val(value), size: 20 })] })],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ── Main export function ──────────────────────────────────────────────────────

export async function buildEvaluationDocBlob(patient: Patient, evaluation: PatientEvaluation): Promise<Blob> {
  const firstName = patient.firstName;
  const lastName = patient.lastName;
  const fullName = `${firstName} ${lastName}`;

  const today = new Date();
  const exportDateStr = today.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── 1. Find linked records ───────────────────────────────────────────────
  const dietary    = patient.dietaryEvaluations.find((d) => d.linkedEvaluationId === evaluation.id);
  const measurement = patient.measurements.find((m) => m.linkedEvaluationId === evaluation.id);
  const bioimpedancia = patient.bioimpedancias.find((b) => b.evaluation_id === evaluation.id);
  const somatotype = patient.somatotypes.find((s) => s.linkedEvaluationId === evaluation.id);
  const menu       = patient.menus.find((m) => m.linkedEvaluationId === evaluation.id);
  const labs       = patient.labs.filter((l) => l.linkedEvaluationId === evaluation.id && !!l.labInterpretation);
  const photos     = patient.photos.filter((p) => p.linkedEvaluationId === evaluation.id);

  // ── 2. Capture charts ───────────────────────────────────────────────────
  let bioImage: string | null = null;
  let somaImage: string | null = null;

  if (bioimpedancia) {
    const bioFormData = {
      gender:         String(bioimpedancia.gender ?? ''),
      age:            String(bioimpedancia.age ?? ''),
      weight:         String(bioimpedancia.weight ?? ''),
      height:         String(bioimpedancia.height ?? ''),
      imc:            String(bioimpedancia.imc ?? ''),
      bodyFat:        String(bioimpedancia.body_fat_pct ?? ''),
      totalBodyWater: String(bioimpedancia.water_pct ?? ''),
      muscleMass:     String(bioimpedancia.muscle_mass ?? ''),
      physiqueRating: String(bioimpedancia.physique_rating ?? ''),
      visceralFat:    String(bioimpedancia.visceral_fat ?? ''),
      boneMass:       String(bioimpedancia.bone_mass ?? ''),
      bmr:            String(bioimpedancia.bmr ?? ''),
      metabolicAge:   String(bioimpedancia.metabolic_age ?? ''),
    };

    const bioElement = React.createElement(
      'div',
      { style: { padding: '16px', backgroundColor: 'white', width: '700px' } },
      React.createElement(BioimpedanciaInterpretation, { formData: bioFormData })
    );
    bioImage = await captureComponent(bioElement, { width: '700px', backgroundColor: '#ffffff' });
  }

  if (somatotype) {
    const somaElement = React.createElement(
      'div',
      { style: { width: '500px', height: '500px', backgroundColor: 'white' } },
      React.createElement(SomatocartaLogic, { x: somatotype.x, y: somatotype.y })
    );
    somaImage = await captureComponent(somaElement, { width: '500px', height: '500px', backgroundColor: '#ffffff' });
  }

  // ── 3. Fetch photo images ───────────────────────────────────────────────
  const photoDataMap: Map<string, Uint8Array> = new Map();
  if (photos.length > 0) {
    const maxPhotos = photos.slice(0, 6);
    await Promise.all(
      maxPhotos.map(async (photo) => {
        if (photo.url) {
          const data = await fetchPhotoBase64(photo.url);
          if (data) photoDataMap.set(photo.id, data);
        }
      })
    );
  }

  // ── 4. Build document children ──────────────────────────────────────────
  const docChildren: any[] = [];

  // ── Section 1: Header ──────────────────────────────────────────────────
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: fullName, bold: true, size: 40, color: '0F766E' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: `Evaluación ${evaluation.date}`, size: 26, color: '475569' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: `Fecha de exportación: ${exportDateStr}`, size: 20, color: '94A3B8', italics: true })],
    })
  );

  if (evaluation.title && evaluation.title !== evaluation.date) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: evaluation.title, size: 22, color: '475569', bold: true })],
      })
    );
  }

  if (evaluation.notes) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: evaluation.notes, size: 20, color: '64748B', italics: true })],
      })
    );
  }

  docChildren.push(
    new Paragraph({
      spacing: { after: 320 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '0D9488' } },
      children: [new TextRun({ text: '', size: 4 })],
    })
  );

  // ── Section 2: Evaluación Dietética ───────────────────────────────────
  if (dietary) {
    docChildren.push(sectionHeader('Evaluación Dietética'));
    docChildren.push(field('Comidas al día', dietary.mealsPerDay));
    docChildren.push(field('Alimentos que evita', dietary.excludedFoods));
    docChildren.push(...fieldBlock('Notas', dietary.notes));

    // Recordatorio 24h
    docChildren.push(subHeader('Recordatorio de 24 Horas'));
    if (dietary.recall && dietary.recall.length > 0) {
      const recallHeader = new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: 'Tiempo', bold: true, size: 20 })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
            width: { size: 1200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: 'Hora', bold: true, size: 20 })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: 'Lugar', bold: true, size: 20 })] })],
          }),
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
            width: { size: 3300, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: 'Alimentos', bold: true, size: 20 })] })],
          }),
        ],
      });

      const recallRows = dietary.recall.map(
        (entry: any) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(entry.mealTime), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(entry.time), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(entry.place), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(entry.description), size: 20 })] })] }),
            ],
          })
      );

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [recallHeader, ...recallRows],
        })
      );
      docChildren.push(divider());
    }

    // Frecuencia de Consumo
    docChildren.push(subHeader('Frecuencia de Consumo'));
    if (dietary.foodFrequency && dietary.foodFrequency.length > 0) {
      // Group by frequency
      const grouped: Record<string, string[]> = {};
      dietary.foodFrequency.forEach((entry: any) => {
        const freq = val(entry.frequency);
        if (!grouped[freq]) grouped[freq] = [];
        grouped[freq].push(val(entry.category));
      });

      Object.entries(grouped).forEach(([freq, cats]) => {
        docChildren.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `${freq}: `, bold: true, size: 22 }),
              new TextRun({ text: cats.join(', '), size: 22 }),
            ],
          })
        );
      });
    }

    if (dietary.foodFrequencyOthers) {
      docChildren.push(...fieldBlock('Otros', dietary.foodFrequencyOthers));
    }

    docChildren.push(divider());
  }

  // ── Section 3: Medidas Antropométricas ────────────────────────────────
  if (measurement) {
    docChildren.push(sectionHeader('Medidas Antropométricas'));

    // DATOS GENERALES
    docChildren.push(subHeader('Datos Generales'));
    docChildren.push(
      twoColTable([
        ['Género', measurement.gender],
        ['Edad', measurement.age !== undefined ? `${measurement.age} años` : undefined],
        ['Peso', measurement.weight !== undefined ? `${measurement.weight} kg` : undefined],
        ['Talla', measurement.height !== undefined ? `${measurement.height} cm` : undefined],
        ['Meta cumplida', measurement.metaComplied === true ? 'Sí' : measurement.metaComplied === false ? 'No' : undefined],
      ])
    );
    docChildren.push(divider());

    // PLIEGUES CUTÁNEOS
    docChildren.push(subHeader('Pliegues Cutáneos'));
    docChildren.push(
      twoColTable([
        ['Bíceps', measurement.biceps !== undefined ? `${measurement.biceps} mm` : undefined],
        ['Tríceps', measurement.triceps !== undefined ? `${measurement.triceps} mm` : undefined],
        ['Subescapular', measurement.subscapular !== undefined ? `${measurement.subscapular} mm` : undefined],
        ['Supraespinal', measurement.supraspinal !== undefined ? `${measurement.supraspinal} mm` : undefined],
        ['Abdomen', measurement.abdomen !== undefined ? `${measurement.abdomen} mm` : undefined],
        ['Muslo', measurement.thigh !== undefined ? `${measurement.thigh} mm` : undefined],
        ['Pantorrilla', measurement.calf !== undefined ? `${measurement.calf} mm` : undefined],
        ['Cresta Ilíaca', measurement.iliacCrest !== undefined ? `${measurement.iliacCrest} mm` : undefined],
        ['Sumatoria de Pliegues', measurement.skinfoldSum !== undefined ? `${measurement.skinfoldSum} mm` : undefined],
      ])
    );
    docChildren.push(divider());

    // DIÁMETROS ÓSEOS
    docChildren.push(subHeader('Diámetros Óseos'));
    docChildren.push(
      twoColTable([
        ['Muñeca', measurement.wrist !== undefined ? `${measurement.wrist} cm` : undefined],
        ['Húmero', measurement.humerus !== undefined ? `${measurement.humerus} cm` : undefined],
        ['Fémur', measurement.femur !== undefined ? `${measurement.femur} cm` : undefined],
      ])
    );
    docChildren.push(divider());

    // PERÍMETROS CORPORALES
    docChildren.push(subHeader('Perímetros Corporales'));
    docChildren.push(
      twoColTable([
        ['Brazo Relajado', measurement.armRelaxed !== undefined ? `${measurement.armRelaxed} cm` : undefined],
        ['Brazo Contraído', measurement.armContracted !== undefined ? `${measurement.armContracted} cm` : undefined],
        ['Pantorrilla (perímetro)', measurement.calfGirth !== undefined ? `${measurement.calfGirth} cm` : undefined],
        ['Cintura', measurement.waist !== undefined ? `${measurement.waist} cm` : undefined],
        ['Umbilical', measurement.umbilical !== undefined ? `${measurement.umbilical} cm` : undefined],
        ['Cadera', measurement.hip !== undefined ? `${measurement.hip} cm` : undefined],
        ['Abdominal Bajo', measurement.abdominalLow !== undefined ? `${measurement.abdominalLow} cm` : undefined],
        ['Muslo Derecho', measurement.thighRight !== undefined ? `${measurement.thighRight} cm` : undefined],
        ['Muslo Izquierdo', measurement.thighLeft !== undefined ? `${measurement.thighLeft} cm` : undefined],
      ])
    );
    docChildren.push(divider());

    // COMPOSICIÓN CORPORAL
    docChildren.push(subHeader('Composición Corporal'));
    docChildren.push(
      twoColTable([
        ['IMC', measurement.imc],
        ['% Grasa', measurement.bodyFat !== undefined ? `${measurement.bodyFat} %` : undefined],
        ['Masa Grasa (kg)', measurement.fatKg],
        ['Masa Magra (kg)', measurement.leanMassKg],
        ['% Masa Magra', measurement.leanMassPct !== undefined ? `${measurement.leanMassPct} %` : undefined],
        ['AKS', measurement.aks],
        ['Masa Ósea (kg)', measurement.boneMass],
        ['Masa Residual (kg)', measurement.residualMass],
        ['Peso Músculo (kg)', measurement.muscleKg],
      ])
    );
    docChildren.push(divider());

    // SOMATOTIPO
    docChildren.push(subHeader('Somatotipo'));
    docChildren.push(
      twoColTable([
        ['Endomorfo', measurement.endomorfo],
        ['Mesomorfo', measurement.mesomorfo],
        ['Ectomorfo', measurement.ectomorfo],
        ['X', measurement.x],
        ['Y', measurement.y],
      ])
    );
    docChildren.push(divider());

    // DIAGNÓSTICO NUTRICIONAL
    docChildren.push(subHeader('Diagnóstico Nutricional'));
    docChildren.push(
      twoColTable([
        ['Diagnóstico', measurement.diagnosticN],
        ['Valoración Subjetiva', measurement.subjectiveValuation],
      ])
    );
    docChildren.push(divider());
  }

  // ── Section 4: Bioimpedancia ──────────────────────────────────────────
  if (bioimpedancia) {
    docChildren.push(sectionHeader('Bioimpedancia'));

    docChildren.push(
      twoColTable([
        ['Género', bioimpedancia.gender],
        ['Edad', bioimpedancia.age !== undefined ? `${bioimpedancia.age} años` : undefined],
        ['Peso', `${bioimpedancia.weight} kg`],
        ['Talla', `${bioimpedancia.height} cm`],
        ['IMC', bioimpedancia.imc],
        ['% Grasa', bioimpedancia.body_fat_pct !== undefined ? `${bioimpedancia.body_fat_pct} %` : undefined],
        ['% Agua', bioimpedancia.water_pct !== undefined ? `${bioimpedancia.water_pct} %` : undefined],
        ['Masa Muscular (kg)', bioimpedancia.muscle_mass],
        ['Masa Ósea (kg)', bioimpedancia.bone_mass],
        ['Grasa Visceral', bioimpedancia.visceral_fat],
        ['TMB (kcal)', bioimpedancia.bmr],
        ['Edad Metabólica', bioimpedancia.metabolic_age],
        ['Physique Rating', bioimpedancia.physique_rating],
      ])
    );
    docChildren.push(divider());

    // Perímetros bio
    docChildren.push(subHeader('Perímetros Corporales'));
    docChildren.push(
      twoColTable([
        ['Brazo Relajado', bioimpedancia.armRelaxed !== undefined ? `${bioimpedancia.armRelaxed} cm` : undefined],
        ['Brazo Contraído', bioimpedancia.armContracted !== undefined ? `${bioimpedancia.armContracted} cm` : undefined],
        ['Pantorrilla', bioimpedancia.calfGirth !== undefined ? `${bioimpedancia.calfGirth} cm` : undefined],
        ['Cintura', bioimpedancia.waist !== undefined ? `${bioimpedancia.waist} cm` : undefined],
        ['Umbilical', bioimpedancia.umbilical !== undefined ? `${bioimpedancia.umbilical} cm` : undefined],
        ['Cadera', bioimpedancia.hip !== undefined ? `${bioimpedancia.hip} cm` : undefined],
        ['Abdominal Bajo', bioimpedancia.abdominalLow !== undefined ? `${bioimpedancia.abdominalLow} cm` : undefined],
        ['Muslo Derecho', bioimpedancia.thighRight !== undefined ? `${bioimpedancia.thighRight} cm` : undefined],
        ['Muslo Izquierdo', bioimpedancia.thighLeft !== undefined ? `${bioimpedancia.thighLeft} cm` : undefined],
      ])
    );
    docChildren.push(divider());

    docChildren.push(field('Meta Cumplida', bioimpedancia.meta_complied));

    if (bioImage) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [
            new ImageRun({
              data: base64ToUint8Array(bioImage),
              transformation: { width: 560, height: 400 },
              type: 'png',
            }),
          ],
        })
      );
    }

    docChildren.push(divider());
  }

  // ── Section 5: Somatocarta ────────────────────────────────────────────
  if (somatotype) {
    docChildren.push(sectionHeader('Somatocarta'));
    docChildren.push(field('X', somatotype.x));
    docChildren.push(field('Y', somatotype.y));

    if (somaImage) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [
            new ImageRun({
              data: base64ToUint8Array(somaImage),
              transformation: { width: 400, height: 400 },
              type: 'png',
            }),
          ],
        })
      );
    }

    docChildren.push(divider());
  }

  // ── Section 6: Cálculo Nutricional ───────────────────────────────────
  if (menu && (menu.vetDetails || menu.macros || menu.portions)) {
    docChildren.push(sectionHeader('Cálculo Nutricional'));

    // VET
    if (menu.vetDetails || menu.weightKg || menu.heightCm || menu.age || menu.gender || menu.kcalToWork) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: 'VET (Valor Energético Total)', bold: true, size: 22 })],
        })
      );

      const vetRows: Array<[string, any]> = [];
      if (menu.age !== undefined)       vetRows.push(['Edad', menu.age !== undefined ? `${menu.age} años` : undefined]);
      if (menu.gender)                  vetRows.push(['Sexo', menu.gender]);
      if (menu.weightKg !== undefined)  vetRows.push(['Peso', `${menu.weightKg} kg`]);
      if (menu.heightCm !== undefined)  vetRows.push(['Talla', `${menu.heightCm} cm`]);
      if (menu.vetDetails?.activityLevel)  vetRows.push(['Nivel de Actividad', menu.vetDetails.activityLevel]);
      if (menu.vetDetails?.activityFactor !== undefined) vetRows.push(['Factor de Actividad', menu.vetDetails.activityFactor]);
      if (menu.vetDetails?.tmbKcal !== undefined) vetRows.push(['TMB (kcal)', menu.vetDetails.tmbKcal]);
      if (menu.vetDetails?.getKcalReal !== undefined) vetRows.push(['GET (kcal)', menu.vetDetails.getKcalReal]);
      if (menu.kcalToWork !== undefined) vetRows.push(['Kcal a trabajar', menu.kcalToWork]);

      if (vetRows.length > 0) {
        docChildren.push(twoColTable(vetRows));
        docChildren.push(divider());
      }
    }

    // Macronutrientes
    if (menu.macros) {
      docChildren.push(subHeader('Distribución de Macronutrientes'));

      const macroHeader = new TableRow({
        children: ['Macronutriente', '%', 'Kcal', 'g', 'Notas'].map((text) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
          })
        ),
      });

      const macros = menu.macros;
      const macroRows = [
        ['CHO', macros.cho?.pct, macros.cho?.kcal, macros.cho?.g, macros.cho?.notes],
        ['CHON', macros.chon?.pct, macros.chon?.kcal, macros.chon?.g, macros.chon?.notes],
        ['FAT', macros.fat?.pct, macros.fat?.kcal, macros.fat?.g, macros.fat?.notes],
      ].map(
        ([name, pct, kcal, g, notes]) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(name), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(pct), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(kcal), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(g), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(notes), size: 20 })] })] }),
            ],
          })
      );

      if (macros.totalKcal !== undefined) {
        macroRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 20 })] })],
              }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—', size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val(macros.totalKcal), bold: true, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—', size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—', size: 20 })] })] }),
            ],
          })
        );
      }

      docChildren.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [macroHeader, ...macroRows] })
      );
      docChildren.push(divider());
    }

    // Porciones
    if (menu.portions) {
      docChildren.push(subHeader('Porciones por Grupo'));

      const portionsHeader = new TableRow({
        children: ['Grupo', 'Porciones', 'Kcal', 'CHO', 'CHON', 'FAT'].map((text) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'CCFBF1' },
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
          })
        ),
      });

      const portions = menu.portions as any;
      const portionRows: TableRow[] = [];
      let totKcal = 0, totCho = 0, totChon = 0, totFat = 0;

      Object.entries(EXCHANGE_LIST).forEach(([key, ref]) => {
        const p = Number(portions[key] ?? 0);
        if (p === 0) return;
        const rowKcal = Math.round(p * ref.kcal);
        const rowCho  = Math.round(p * ref.cho);
        const rowChon = Math.round(p * ref.chon);
        const rowFat  = Math.round(p * ref.fat);
        totKcal += rowKcal; totCho += rowCho; totChon += rowChon; totFat += rowFat;

        portionRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ref.name, size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(p), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(rowKcal), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(rowCho), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(rowChon), size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(rowFat), size: 20 })] })] }),
            ],
          })
        );
      });

      portionRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—', size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totKcal), bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totCho), bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totChon), bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totFat), bold: true, size: 20 })] })] }),
          ],
        })
      );

      docChildren.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [portionsHeader, ...portionRows] })
      );
      docChildren.push(divider());
    }
  }

  // ── Section 7: Análisis de Laboratorios ──────────────────────────────
  if (labs.length > 0) {
    docChildren.push(sectionHeader('Análisis de Laboratorios'));

    labs.forEach((lab) => {
      docChildren.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: `${lab.name} — ${lab.date}`, bold: true, size: 22 })],
        })
      );

      const lines = (lab.labInterpretation || '').split('\n');
      lines.forEach((line) => {
        docChildren.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: 360 },
            children: [new TextRun({ text: line, size: 20 })],
          })
        );
      });

      docChildren.push(divider());
    });
  }

  // ── Section 8: Fotos ──────────────────────────────────────────────────
  const photosWithData = photos.slice(0, 6).filter((p) => photoDataMap.has(p.id));
  if (photosWithData.length > 0) {
    docChildren.push(sectionHeader('Galería de Fotos'));

    photosWithData.forEach((photo) => {
      const imgData = photoDataMap.get(photo.id)!;
      docChildren.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: `${photo.name} — ${photo.date}`, bold: true, size: 20 })],
        })
      );
      docChildren.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new ImageRun({
              data: imgData,
              transformation: { width: 280, height: 200 },
              type: 'png',
            }),
          ],
        })
      );
    });
  }

  // ── 5. Finalize and download ──────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
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

  return Packer.toBlob(doc);
}

export async function exportEvaluationDoc(patient: Patient, evaluation: PatientEvaluation): Promise<void> {
  const blob = await buildEvaluationDocBlob(patient, evaluation);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = `${patient.firstName}_${patient.lastName}`.replace(/\s+/g, '_');
  link.download = `${safeName}_Evaluacion_${evaluation.date}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
