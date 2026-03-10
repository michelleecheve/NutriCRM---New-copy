import type { Measurement } from '../types';

const fmt = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return undefined;
  return parseFloat(n.toFixed(3));
};

/**
 * Motor de cálculo antropométrico.
 * IMPORTANTÍSIMO:
 * - Función pura (no toca estado ni store).
 * - Mantener lógica idéntica a la que ya estaba en NewMeasurementForm.
 */
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
  const calfSkin = get('calf');

  const sumSixSkinfolds =
    get('biceps') + get('thigh') + get('calf') +
    get('triceps') + get('subscapular') + get('supraspinal');

  const sumSkinfolds =
    get('biceps') + get('triceps') + get('subscapular') +
    get('supraspinal') + get('abdomen') + get('thigh') +
    get('calf') + get('iliacCrest');

  let imc = 0;
  if (h > 0) imc = w / ((h / 100) * (h / 100));

  const bodyFat = gender === 'F'
    ? (sumSixSkinfolds * 0.143) + 4.56
    : (sumSixSkinfolds * 0.097) + 3.64;

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

  let endo = 0, meso = 0, ecto = 0;

  const sumEndo = get('triceps') + get('subscapular') + get('supraspinal');
  if (h > 0) {
    const X = sumEndo * (170.18 / h);
    endo =
      -0.7182 +
      (0.145 * X) -
      (0.00068 * Math.pow(X, 2)) +
      (0.0000014 * Math.pow(X, 3));
  }

  if (h > 0) {
    const correctedArm = armContracted - (triceps / 10);
    const correctedCalf = calfGirth - (calfSkin / 10);
    meso =
      (0.858 * humerus) +
      (0.601 * femur) +
      (0.188 * correctedArm) +
      (0.161 * correctedCalf) -
      (0.131 * h) +
      4.5;
  }

  if (w > 0 && h > 0) {
    const hwr = h / Math.cbrt(w);
    if (hwr > 40.75) ecto = (0.732 * hwr) - 28.58;
    else ecto = (0.463 * hwr) - 17.63;
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