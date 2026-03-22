import type { Measurement } from '../types';

const fmt = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return undefined;
  return parseFloat(n.toFixed(2));
};

export function calculateAnthropometry(m: Measurement): Measurement {
  const get = (key: keyof Measurement) => Number(m[key]) || 0;

  const h = get('height');
  const w = get('weight');
  const gender = m.gender;

  const wrist = get('wrist');
  const femur = get('femur');
  const humerus = get('humerus');

  const armContracted = get('armContracted');
  const calfGirth = get('calfGirth');

  const triceps = get('triceps');
  const subscapular = get('subscapular');
  const calfSkin = get('calf');

  const age = Number(m.age) || 0;

  const sumSixSkinfolds =
    get('triceps') +
    get('subscapular') +
    get('supraspinal') +
    get('abdomen') +
    get('thigh') +
    get('calf');

  const sumSkinfolds =
    get('biceps') +
    get('triceps') +
    get('subscapular') +
    get('supraspinal') +
    get('abdomen') +
    get('thigh') +
    get('calf') +
    get('iliacCrest');

  const sum2 = triceps + subscapular;

  // =========================
  // 🔥 % GRASA (REPLICA EXCEL)
  // =========================
  let bodyFat = 0;

  if (gender === 'M') {
    if (age < 12) {
      bodyFat = 1.21 * sum2 - 0.008 * Math.pow(sum2, 2) - 1.7;
    } else if (age >= 12 && age <= 13) {
      bodyFat = 1.21 * sum2 - 0.008 * Math.pow(sum2, 2) - 3.4;
    } else if (age > 13 && age <= 16) {
      bodyFat = 1.21 * sum2 - 0.008 * Math.pow(sum2, 2) - 5.5;
    } else {
      bodyFat = sumSixSkinfolds * 0.097 + 3.64;
    }
  } else if (gender === 'F') {
    if (age >= 5 && age <= 14) {
      bodyFat = 1.33 * sum2 - 0.013 * Math.pow(sum2, 2) - 2.5;
    } else {
      bodyFat = sumSixSkinfolds * 0.143 + 4.56;
    }
  }

  // Seguridad (evitar negativos)
  bodyFat = Math.max(0, bodyFat);

  // =========================
  // RESTO DEL MODELO
  // =========================

  let imc = 0;
  if (h > 0) imc = w / Math.pow(h / 100, 2);

  const fatKg = (bodyFat * w) / 100;
  const leanMassKg = w - fatKg;

  let leanMassPct = 0;
  if (w > 0) leanMassPct = (leanMassKg / w) * 100;

  let aks = 0;
  if (h > 0) aks = (leanMassKg * 1000) / (Math.pow(h, 3) * 0.01);

  let boneMass = 0;
  if (h > 0 && wrist > 0 && humerus > 0) {
    boneMass = 3.02 * Math.pow(((h * h * wrist * humerus * 4) / 1_000_000), 0.712);
  }

  let residualMass = 0;
  if (gender === 'M') residualMass = w * 0.241;
  else if (gender === 'F') residualMass = w * 0.209;

  const muscleKg = w - (boneMass + fatKg + residualMass);

  // =========================
  // SOMATOTIPO
  // =========================

  let endo = 0, meso = 0, ecto = 0;

  const sumEndo = triceps + subscapular + get('supraspinal');

  if (h > 0) {
    const X = sumEndo * (170.18 / h);
    endo =
      -0.7182 +
      0.145 * X -
      0.00068 * Math.pow(X, 2) +
      0.0000014 * Math.pow(X, 3);
  }

  if (h > 0) {
    const correctedArm = armContracted - (triceps / 10);
    const correctedCalf = calfGirth - (calfSkin / 10);

    meso =
      0.858 * humerus +
      0.601 * femur +
      0.188 * correctedArm +
      0.161 * correctedCalf -
      0.131 * h +
      4.5;
  }

  if (w > 0 && h > 0) {
    const hwr = h / Math.cbrt(w);

    if (hwr > 40.75) ecto = 0.732 * hwr - 28.58;
    else ecto = 0.463 * hwr - 17.63;
  }

  const x = ecto - endo;
  const y = (2 * meso) - (endo + ecto);

  return {
    ...m,
    skinfoldSum: fmt(sumSkinfolds),
    imc: fmt(imc),
    bodyFat: fmt(bodyFat),
    fatKg: fmt(fatKg),
    leanMassKg: fmt(leanMassKg),
    leanMassPct: fmt(leanMassPct),
    aks: fmt(aks),
    boneMass: fmt(boneMass),
    residualMass: fmt(residualMass),
    muscleKg: fmt(muscleKg),
    endomorfo: fmt(endo),
    mesomorfo: fmt(meso),
    ectomorfo: fmt(ecto),
    x: fmt(x),
    y: fmt(y)
  };
}