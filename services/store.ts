import { Patient, Invoice, UserProfile, Appointment, PatientEvaluation } from '../types';

// ─── Read current userId directly from localStorage (no circular import) ──────
const SESSION_KEY = 'nutricrm_session_v1';

// ─── ID de Blanca Morales (propietaria de los datos seed) ─────────────────────
const BLANCA_MORALES_USER_ID = 'nutri-001';

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 'guest';
    const user = JSON.parse(raw);
    return user?.id ?? 'guest';
  } catch {
    return 'guest';
  }
}

// ─── Per-user scoped keys ─────────────────────────────────────────────────────
function makeKeys(uid: string) {
  return {
    patients:     `nutriflow_patients_v1_${uid}`,
    invoices:     `nutriflow_invoices_v1_${uid}`,
    appointments: `nutriflow_appointments_v1_${uid}`,
    user:         `nutriflow_user_v1_${uid}`,
    statuses:     `nutriflow_statuses_v1_${uid}`,
    evaluations:  `nutriflow_patient_evaluations_v1_${uid}`,
    evalSelected: `nutriflow_patient_selected_evaluation_v1_${uid}`,
  };
}

// ─── Generic load/save ────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('nutriflow: localStorage save failed', key, e);
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatSpanishLongDate(yyyyMmDd: string): string {
  const d = new Date(`${yyyyMmDd}T12:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString('es-ES', { month: 'long' });
  const year = d.getFullYear();
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  return `${day} ${monthCap}, ${year}`;
}

function parseUtcOffsetToMinutes(tz: string): number {
  if (!tz) return 0;
  if (tz === 'UTC' || tz === 'UTC±00:00') return 0;
  const m = tz.match(/^UTC([+-])(\d{2}):(\d{2})$/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hh = parseInt(m[2], 10);
  const mm = parseInt(m[3], 10);
  return sign * (hh * 60 + mm);
}

function ymdFromShiftedUtcDate(shifted: Date): string {
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayYMDInUserTimezone(userTz: string): string {
  const offsetMin = parseUtcOffsetToMinutes(userTz);
  const now = Date.now();
  const shifted = new Date(now + offsetMin * 60_000);
  return ymdFromShiftedUtcDate(shifted);
}

function addDaysYmdInUserTimezone(userTz: string, daysToAdd: number): string {
  const offsetMin = parseUtcOffsetToMinutes(userTz);
  const now = Date.now();
  const shifted = new Date(now + offsetMin * 60_000 + daysToAdd * 86_400_000);
  return ymdFromShiftedUtcDate(shifted);
}

// ─── Seeds (solo para Blanca Morales) ────────────────────────────────────────

const SEED_USER: UserProfile = {
  professionalTitle: 'Lic.',
  name: 'Blanca Morales',
  specialty: 'Nutricionista Deportiva',
  licenseNumber: '123456',
  email: 'blancamoralesc96@gmail.com',
  contactEmail: 'blancamoralesc96@gmail.com',
  phone: '+502 30508872',
  personalPhone: '+502 50178353',
  instagramHandle: 'blancamoorales',
  address: 'Edificio Medika 10, Clínica Vascure Nivel 12 - 1211, 6a Avenida 04-01, Zona 10, Ciudad de Guatemala',
  website: 'blancamoralesnutricion.com',
  avatar: 'https://user3047.na.imgto.link/public/20260225/isotipo-beige-fondo-verde-circular.avif',
  timezone: 'UTC-06:00',
};

const SEED_PATIENTS: Patient[] = [
  {
    id: '1',
    firstName: 'Michelle',
    lastName: 'Echeverria',
    registeredAt: '2025-01-07',
    clinical: {
      status: 'Menú Pendiente',
      dob: '1997-05-12',
      age: 27,
      sex: 'Femenino',
      occupation: 'Arquitecta',
      phone: '555-0123',
      email: 'michelleecheve@gmail.com',
      initialWeight: '70',
      initialHeight: '170',
      sport: 'Crossfit',
      category: 'Amateur',
      sportsAge: '3 años',
      otherSports: 'Running ocasional',
      trainingFrequency: 'Alta',
      daysPerWeek: '5',
      hoursPerDay: '1.5',
      goals: 'Aumentar masa muscular',
      consultationReason: 'Mejorar rendimiento y composición corporal',
      diagnosis: 'Ninguno diagnosticado',
      familyHistory: 'Madre hipertensa',
      medications: 'Multivitamínico',
      allergies: 'Ninguna',
      menarcheAge: '13',
      regularPeriod: 'Si',
      periodDuration: '28 días',
    },
    dietary: {
      currentDiet: 'Alta en proteínas',
      preferences: 'Le gusta el pollo, no le gusta el pescado',
      dailyCaloriesTarget: 2200,
      notes: 'Dificultad con los desayunos.',
    },
    dietaryEvaluations: [
      {
        id: 'eval-1',
        date: '2026-02-18',
        mealsPerDay: 5,
        excludedFoods: 'aguacate',
        recall: [
          { mealTime: 'Desayuno',  time: '07:00', place: 'Casa',    description: 'Huevos revueltos, 1 pan integral' },
          { mealTime: 'Refacción', time: '10:00', place: 'Oficina', description: 'Manzana verde' },
          { mealTime: 'Almuerzo',  time: '13:00', place: 'Oficina', description: 'Pollo a la plancha, arroz, ensalada' },
          { mealTime: 'Refacción', time: '16:00', place: 'Oficina', description: 'Yogurt griego' },
          { mealTime: 'Cena',      time: '20:00', place: 'Casa',    description: 'Licuado de proteína' },
        ],
        foodFrequency: {
          'Carne, Pollo, Cerdo': 'Diario',
          'Vegetales': 'Diario',
          'Frutas': 'Semanal',
        },
      },
    ],
    measurements: [
      { id: 'meas-1', date: '2025-07-01', metaComplied: false, age: 25, weight: 70, height: 170, imc: 24.2, bodyFat: 18, fatKg: 12.6, aks: 1.2, muscleKg: 32, biceps: 5, triceps: 10, subscapular: 12, supraspinal: 15, abdomen: 20, thigh: 15, calf: 10, iliacCrest: 18, skinfoldSum: 102, wrist: 6, humerus: 7, femur: 10, armRelaxed: 30, armContracted: 32, calfGirth: 35, waist: 80, umbilical: 85, hip: 95, abdominalLow: 88, thighRight: 55, thighLeft: 55 },
      { id: 'meas-2', date: '2025-09-08', metaComplied: true,  age: 25, weight: 68, height: 170, imc: 23.5, bodyFat: 17, fatKg: 11.5, aks: 1.3, muscleKg: 33, biceps: 4, triceps: 9,  subscapular: 11, supraspinal: 14, abdomen: 18, thigh: 14, calf: 9,  iliacCrest: 17, skinfoldSum: 96,  wrist: 6, humerus: 7, femur: 10, armRelaxed: 29, armContracted: 31, calfGirth: 34, waist: 78, umbilical: 83, hip: 94, abdominalLow: 86, thighRight: 54, thighLeft: 54 },
      { id: 'meas-3', date: '2026-01-01', metaComplied: true,  age: 26, weight: 67, height: 170, imc: 23.1, bodyFat: 16, fatKg: 10.7, aks: 1.4, muscleKg: 34, biceps: 4, triceps: 8,  subscapular: 10, supraspinal: 13, abdomen: 16, thigh: 13, calf: 8,  iliacCrest: 16, skinfoldSum: 88,  wrist: 6, humerus: 7, femur: 10, armRelaxed: 29, armContracted: 31, calfGirth: 34, waist: 76, umbilical: 81, hip: 93, abdominalLow: 84, thighRight: 53, thighLeft: 53 },
      { id: 'meas-4', date: '2026-02-16', metaComplied: false, age: 26, weight: 66, height: 170, imc: 22.8, bodyFat: 15, fatKg: 9.9,  aks: 1.5, muscleKg: 35, biceps: 3, triceps: 7,  subscapular: 9,  supraspinal: 12, abdomen: 14, thigh: 12, calf: 7,  iliacCrest: 15, skinfoldSum: 79,  wrist: 6, humerus: 7, femur: 10, armRelaxed: 28, armContracted: 30, calfGirth: 33, waist: 74, umbilical: 79, hip: 92, abdominalLow: 82, thighRight: 52, thighLeft: 52 },
    ],
    somatotypes: [
      { id: '1', date: '2025-07-01', x: 2, y: 4 },
      { id: '2', date: '2025-09-08', x: 1, y: 5 },
    ],
    menus: [],
    labs: [],
    photos: [],
  },
  {
    id: '2',
    firstName: 'Juan',
    lastName: 'Perez',
    registeredAt: '2024-01-10',
    clinical: {
      status: 'Cita Agendada',
      dob: '1985-08-20',
      age: 38,
      sex: 'Masculino',
      occupation: 'Ingeniero',
      phone: '555-9876',
      email: 'juan.perez@example.com',
      initialWeight: '90',
      initialHeight: '180',
      sport: 'Running',
      category: 'Recreativo',
      sportsAge: '1 año',
      otherSports: '-',
      trainingFrequency: 'Media',
      daysPerWeek: '3',
      hoursPerDay: '1',
      goals: 'Bajar de peso',
      consultationReason: 'Bajar porcentaje de grasa',
      diagnosis: 'Sobrepeso',
      familyHistory: 'Diabetes tipo 2 paterna',
      medications: 'Ninguno',
      allergies: 'Penicilina',
      menarcheAge: '',
      regularPeriod: '',
      periodDuration: '',
    },
    dietary: {
      currentDiet: 'Estándar',
      preferences: 'Vegetariano flexible',
      dailyCaloriesTarget: 1800,
      notes: 'Beber más agua.',
    },
    dietaryEvaluations: [],
    measurements: [
      { id: 'meas-5', date: '2024-01-10', metaComplied: false, age: 38, weight: 90, height: 180, imc: 27.8, bodyFat: 30, fatKg: 27 },
    ],
    somatotypes: [],
    menus: [],
    labs: [],
    photos: [],
  },
];

const SEED_INVOICES: Invoice[] = [
  { id: '#INV-4498', patientId: '1', patientName: 'Michelle Echeverria', date: '2026-02-17', amount: 250.00, status: 'Pagado',   method: 'Transferencia' },
  { id: '#INV-4497', patientId: '2', patientName: 'Juan Perez',          date: '2026-02-15', amount: 250.00, status: 'Pendiente', method: 'Efectivo' },
  { id: '#INV-4496', patientId: '',  patientName: 'Carlos Ruiz',         date: '2026-02-10', amount: 300.00, status: 'Pagado',   method: 'Tarjeta' },
];

const SEED_STATUSES: string[] = ['-', 'Menú Pendiente', 'Menú Entregado'];
const SEED_EVALUATIONS: PatientEvaluation[] = [];
const SEED_SELECTED: Record<string, string> = {};

// ─── Store Class ──────────────────────────────────────────────────────────────

class Store {
  private uid: string = 'guest';
  private K = makeKeys('guest');

  private patients:     Patient[]     = [];
  private invoices:     Invoice[]     = [];
  private appointments: Appointment[] = [];
  private user:         UserProfile   = SEED_USER;
  private statuses:     string[]      = SEED_STATUSES;
  private evaluations:  PatientEvaluation[] = [];
  private selectedEvaluationByPatient: Record<string, string> = {};

  constructor() {
    const uid = getCurrentUserId();
    this.initForUser(uid);
  }

  // ── Called on login / logout to reload data for the new user ──────────────
  initForUser(userId: string): void {
    this.uid = userId;
    this.K   = makeKeys(userId);

    // ── Determinar fallbacks según el usuario ─────────────────────────────────
    // Solo Blanca Morales tiene datos seed; otros usuarios empiezan vacíos
    const isBlancaMorales = userId === BLANCA_MORALES_USER_ID;

    const fallbackPatients     = isBlancaMorales ? SEED_PATIENTS     : [];
    const fallbackInvoices     = isBlancaMorales ? SEED_INVOICES     : [];
    const fallbackEvaluations  = isBlancaMorales ? SEED_EVALUATIONS  : [];
    const fallbackSelected     = isBlancaMorales ? SEED_SELECTED     : {};

    // Appointments siempre se generan dinámicamente solo para Blanca
    const seedAppointments: Appointment[] = isBlancaMorales ? [
      { id: 'appt-1', patientId: '1', patientName: 'Michelle Echeverria', date: getTodayYMDInUserTimezone(SEED_USER.timezone),      time: '15:00', duration: 60, type: 'Seguimiento', modality: 'Presencial', status: 'Programada' },
      { id: 'appt-2', patientId: '2', patientName: 'Juan Perez',          date: addDaysYmdInUserTimezone(SEED_USER.timezone, 1),    time: '10:00', duration: 45, type: 'Seguimiento', modality: 'Video',      status: 'Programada' },
    ] : [];

    // Load all data for this user
    this.patients     = load(this.K.patients,     fallbackPatients);
    this.invoices     = load(this.K.invoices,     fallbackInvoices);
    this.appointments = load(this.K.appointments, seedAppointments);
    this.user         = load(this.K.user,         SEED_USER);
    this.statuses     = load(this.K.statuses,     SEED_STATUSES);
    this.evaluations  = load(this.K.evaluations,  fallbackEvaluations);
    this.selectedEvaluationByPatient = load(this.K.evalSelected, fallbackSelected);

    // ── Migrations ──────────────────────────────────────────────────────────

    // evaluations legacy (createdDate → date)
    this.evaluations = this.evaluations.map(e => {
      const legacy = e as any;
      if (legacy.createdDate) {
        const { createdDate, ...rest } = legacy;
        return { ...rest, date: createdDate } as PatientEvaluation;
      }
      return e;
    });

    // patients: limpiar menus históricos seed
    this.patients = this.patients.map(p => {
      if (p.firstName === 'Michelle' && p.lastName === 'Echeverria') {
        return { ...p, menus: p.menus.filter(m => !m.id.startsWith('menu-hist-')) };
      }
      return p;
    });

    // measurements sin id
    this.patients = this.patients.map(p => ({
      ...p,
      measurements: p.measurements.map(m =>
        m.id ? m : { ...m, id: `meas-${p.id}-${m.date}-${Math.random().toString(36).substring(2, 6)}` }
      ),
    }));

    save(this.K.patients,    this.patients);
    save(this.K.evaluations, this.evaluations);
  }

  getTodayStr(): string {
    return getTodayYMDInUserTimezone(this.user?.timezone || 'UTC±00:00');
  }

  // ── Patients ───────────────────────────────────────────────────────────────

  getPatients(): Patient[] { return this.patients; }

  getPatient(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  addPatient(basicInfo: { firstName: string; lastName: string; email: string; phone: string; status?: string; dob?: string }): Patient {
    let age = 0;
    if (basicInfo.dob) {
      const today = new Date();
      const birth = new Date(basicInfo.dob);
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    }
    const newPatient: Patient = {
      id: Math.random().toString(36).substring(2, 9),
      registeredAt: this.getTodayStr(),
      firstName: basicInfo.firstName,
      lastName:  basicInfo.lastName,
      clinical: {
        status: (basicInfo.status as any) || '-',
        dob: basicInfo.dob || '',
        age,
        sex: '', occupation: '', phone: basicInfo.phone, email: basicInfo.email,
        initialWeight: '', initialHeight: '',
        sport: '', category: '', sportsAge: '', otherSports: '',
        trainingFrequency: '', daysPerWeek: '', hoursPerDay: '', goals: '',
        consultationReason: '', diagnosis: '', familyHistory: '',
        medications: '', allergies: '',
        menarcheAge: '', regularPeriod: '', periodDuration: '',
      },
      dietary: { currentDiet: '', preferences: '', dailyCaloriesTarget: 2000, notes: '' },
      dietaryEvaluations: [],
      measurements: [],
      somatotypes: [],
      menus: [],
      labs: [],
      photos: [],
    };
    this.patients = [newPatient, ...this.patients];
    save(this.K.patients, this.patients);
    return newPatient;
  }

  updatePatient(updatedPatient: Patient): void {
    this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    save(this.K.patients, this.patients);
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  getInvoices(): Invoice[] { return this.invoices; }

  addInvoice(invoice: Omit<Invoice, 'id'>): Invoice {
    const newInvoice = { ...invoice, id: `#INV-${Math.floor(1000 + Math.random() * 9000)}` };
    this.invoices = [newInvoice, ...this.invoices];
    save(this.K.invoices, this.invoices);
    return newInvoice;
  }

  updateInvoice(updatedInvoice: Invoice): void {
    this.invoices = this.invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
    save(this.K.invoices, this.invoices);
  }

  deleteInvoice(id: string): void {
    this.invoices = this.invoices.filter(i => i.id !== id);
    save(this.K.invoices, this.invoices);
  }

  // ── Appointments ───────────────────────────────────────────────────────────

  getAppointments(): Appointment[] { return this.appointments; }

  addAppointment(appointment: Omit<Appointment, 'id'>): Appointment {
    const newAppt = { ...appointment, id: Math.random().toString(36).substring(7) };
    this.appointments = [...this.appointments, newAppt];
    save(this.K.appointments, this.appointments);
    return newAppt;
  }

  updateAppointment(updatedAppointment: Appointment): void {
    this.appointments = this.appointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
    save(this.K.appointments, this.appointments);
  }

  deleteAppointment(id: string): void {
    this.appointments = this.appointments.filter(a => a.id !== id);
    save(this.K.appointments, this.appointments);
  }

  // ── Evaluations ────────────────────────────────────────────────────────────

  getEvaluations(patientId: string): PatientEvaluation[] {
    return this.evaluations
      .filter(e => e.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getEvaluationById(id: string): PatientEvaluation | undefined {
    return this.evaluations.find(e => e.id === id);
  }

  addEvaluation(patientId: string, date: string): PatientEvaluation {
    const ev: PatientEvaluation = {
      id: `EVAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      patientId,
      date,
      title: `Evaluación ${formatSpanishLongDate(date)}`,
      createdAt: new Date().toISOString(),
    };
    this.evaluations = [ev, ...this.evaluations];
    save(this.K.evaluations, this.evaluations);
    this.selectedEvaluationByPatient[patientId] = ev.id;
    save(this.K.evalSelected, this.selectedEvaluationByPatient);
    return ev;
  }

  updateEvaluation(evaluationId: string, patch: Partial<Omit<PatientEvaluation, 'id' | 'patientId' | 'createdAt'>>): PatientEvaluation | null {
    const current = this.getEvaluationById(evaluationId);
    if (!current) return null;
    const updated: PatientEvaluation = { ...current, ...patch };
    this.evaluations = this.evaluations.map(e => e.id === evaluationId ? updated : e);
    save(this.K.evaluations, this.evaluations);
    return updated;
  }

  deleteEvaluation(evaluationId: string): void {
    const ev = this.getEvaluationById(evaluationId);
    if (!ev) return;
    const pid = ev.patientId;
    this.evaluations = this.evaluations.filter(e => e.id !== evaluationId);
    save(this.K.evaluations, this.evaluations);
    if (this.selectedEvaluationByPatient[pid] === evaluationId) {
      delete this.selectedEvaluationByPatient[pid];
      const remaining = this.evaluations
        .filter(e => e.patientId === pid)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (remaining.length > 0) {
        this.selectedEvaluationByPatient[pid] = remaining[0].id;
      }
      save(this.K.evalSelected, this.selectedEvaluationByPatient);
    }
  }

  getSelectedEvaluationId(patientId: string): string | null {
    return this.selectedEvaluationByPatient[patientId] ?? null;
  }

  setSelectedEvaluationId(patientId: string, evaluationId: string | null): void {
    if (!evaluationId) {
      delete this.selectedEvaluationByPatient[patientId];
    } else {
      this.selectedEvaluationByPatient[patientId] = evaluationId;
    }
    save(this.K.evalSelected, this.selectedEvaluationByPatient);
  }

  // ── User profile ───────────────────────────────────────────────────────────

  getUserProfile(): UserProfile { return this.user; }

  updateUserProfile(profile: UserProfile): void {
    this.user = profile;
    save(this.K.user, this.user);
  }

  // ── Statuses ───────────────────────────────────────────────────────────────

  getPatientStatuses(): string[] { return this.statuses; }

  updatePatientStatuses(statuses: string[]): void {
    this.statuses = statuses;
    save(this.K.statuses, this.statuses);
  }

  // ── Cross-user operations (para recepcionistas/admin) ────────────────────

  getAppointmentsForNutritionist(nutritionistId: string): Appointment[] {
    const keys = makeKeys(nutritionistId);
    return load(keys.appointments, []);
  }

  getPatientsForNutritionist(nutritionistId: string): Patient[] {
    const keys = makeKeys(nutritionistId);
    return load(keys.patients, []);
  }

  addAppointmentForNutritionist(nutritionistId: string, appointment: Omit<Appointment, 'id'>): Appointment {
    const keys = makeKeys(nutritionistId);
    const existingAppointments = load<Appointment[]>(keys.appointments, []);
    const newAppt = { ...appointment, id: Math.random().toString(36).substring(7) };
    const updated = [...existingAppointments, newAppt];
    save(keys.appointments, updated);
    return newAppt;
  }

  updateAppointmentForNutritionist(nutritionistId: string, updatedAppointment: Appointment): void {
    const keys = makeKeys(nutritionistId);
    const existingAppointments = load<Appointment[]>(keys.appointments, []);
    const updated = existingAppointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
    save(keys.appointments, updated);
  }

  deleteAppointmentForNutritionist(nutritionistId: string, appointmentId: string): void {
    const keys = makeKeys(nutritionistId);
    const existingAppointments = load<Appointment[]>(keys.appointments, []);
    const updated = existingAppointments.filter(a => a.id !== appointmentId);
    save(keys.appointments, updated);
  }
}

export const store = new Store();