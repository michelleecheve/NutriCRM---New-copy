import { Patient, Invoice, UserProfile, Appointment, PatientEvaluation, ClinicalRecord, DietaryEvaluation, SomatotypeRecord, GeneratedMenu } from '../types';
import { supabaseService } from './supabaseService';

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

const SEED_PATIENTS: Patient[] = [];

const SEED_INVOICES: Invoice[] = [];

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
  async initForUser(userId: string): Promise<void> {
    this.uid = userId;
    this.K   = makeKeys(userId);

    if (userId === 'guest') {
      this.patients = [];
      this.invoices = [];
      this.appointments = [];
      this.user = null;
      this.evaluations = [];
      return;
    }

    // Fetch from Supabase
    try {
      const [patients, appointments, invoices, evaluations, profile] = await Promise.all([
        supabaseService.getPatients(),
        supabaseService.getAppointments(),
        supabaseService.getInvoices(),
        supabaseService.getEvaluations(),
        supabaseService.getProfile(userId)
      ]);

      this.patients = patients as Patient[];
      this.appointments = appointments as Appointment[];
      this.invoices = invoices as Invoice[];
      this.evaluations = evaluations as PatientEvaluation[];
      this.user = profile ? {
        name: profile.name,
        email: profile.email,
        professionalTitle: profile.professional_title,
        specialty: profile.specialty,
        licenseNumber: profile.license_number,
        timezone: profile.timezone,
        avatar: profile.avatar,
        phone: profile.phone || ''
      } : null as any;

      // Local storage as fallback/cache
      save(this.K.patients, this.patients);
      save(this.K.appointments, this.appointments);
      save(this.K.invoices, this.invoices);
      save(this.K.evaluations, this.evaluations);
      if (this.user) save(this.K.user, this.user);
    } catch (error) {
      console.error('Error initializing store from Supabase:', error);
      // Fallback to local storage
      this.patients = load(this.K.patients, []);
      this.invoices = load(this.K.invoices, []);
      this.appointments = load(this.K.appointments, []);
      this.user = load(this.K.user, null);
      this.evaluations = load(this.K.evaluations, []);
    }

    // ── Migrations ──────────────────────────────────────────────────────────
    // ... (keep migrations if needed, but Supabase should have clean data)
  }

  getTodayStr(): string {
    return getTodayYMDInUserTimezone(this.user?.timezone || 'UTC±00:00');
  }

  // ── Patients ───────────────────────────────────────────────────────────────
  
  getPatients(): Patient[] { return this.patients; }

  getPatient(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  /**
   * Importa un objeto de paciente completo, incluyendo sus evaluaciones vinculadas si están presentes.
   */
  importPatientData(data: Patient & { evaluations?: PatientEvaluation[] }): void {
    const { evaluations, ...patient } = data;
    
    // Asegurar que sportsProfile existe para evitar errores en la UI
    // Si sportsProfile viene dentro de clinical (como en el export solicitado)
    if ((patient.clinical as any).sportsProfile && (!patient.sportsProfile || patient.sportsProfile.length === 0)) {
      patient.sportsProfile = (patient.clinical as any).sportsProfile;
      // No borramos de clinical por si acaso, pero el store prefiere patient.sportsProfile
    }
    
    if (!patient.sportsProfile) {
      patient.sportsProfile = [];
    }

    // Migración de menús: basedOnMeasurementDate -> date
    if (patient.menus) {
      patient.menus = patient.menus.map(m => {
        if ((m as any).basedOnMeasurementDate && !m.date) {
          return { ...m, date: (m as any).basedOnMeasurementDate };
        }
        return m;
      });
    }

    // 1. Actualizar el paciente en la lista
    this.updatePatient(patient);

    // 2. Si hay evaluaciones, importarlas (reemplazando las existentes para este paciente)
    if (evaluations && Array.isArray(evaluations)) {
      // Filtrar evaluaciones de otros pacientes
      const otherEvaluations = this.evaluations.filter(e => e.patientId !== patient.id);
      
      // Asegurar que todas las evaluaciones importadas tengan el patientId correcto
      const newEvaluations = evaluations.map(e => ({ ...e, patientId: patient.id }));
      
      this.evaluations = [...otherEvaluations, ...newEvaluations];
      save(this.K.evaluations, this.evaluations);
    }
  }

  async addPatient(basicInfo: { firstName: string; lastName: string; email: string; phone: string; status?: string; birthdate?: string }): Promise<Patient> {
    let age = 0;
    if (basicInfo.birthdate) {
      const today = new Date();
      const birth = new Date(basicInfo.birthdate);
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    }
    const newPatient: Patient = {
      id: '', // Will be set by Supabase
      registeredAt: this.getTodayStr(),
      firstName: basicInfo.firstName,
      lastName:  basicInfo.lastName,
      clinical: {
        status: (basicInfo.status as any) || '-',
        cui: '',
        birthdate: basicInfo.birthdate || '',
        age,
        sex: '', 
        email: basicInfo.email,
        phone: basicInfo.phone, 
        occupation: '', 
        study: '',
        consultmotive: '',
        clinicalbackground: '',
        diagnosis: '', 
        familyHistory: '',
        medications: '', 
        supplements: '',
        allergies: '',
        regularPeriod: '', 
        periodDuration: '',
        firstperiodage: '',
        menstrualOthers: '',
      },
      dietary: { preferences: '' },
      dietaryEvaluations: [],
      measurements: [],
      somatotypes: [],
      sportsProfile: [],
      menus: [],
      labs: [],
      photos: [],
    };

    const savedPatient = await supabaseService.createPatient(newPatient);
    this.patients = [savedPatient, ...this.patients];
    save(this.K.patients, this.patients);
    return savedPatient;
  }

  async updatePatient(updatedPatient: Patient): Promise<void> {
    await supabaseService.updatePatient(updatedPatient.id, updatedPatient);
    this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    save(this.K.patients, this.patients);
  }

  async saveDietaryEvaluation(evaluationId: string, dietary: DietaryEvaluation): Promise<void> {
    await supabaseService.saveDietaryEvaluation(evaluationId, dietary);
    // No necesitamos actualizar el store localmente aquí porque DietaryTab llama a onUpdate
    // que refresca el estado del componente y luego llama a store.updatePatient
  }

  async deleteDietaryEvaluation(evaluationId: string): Promise<void> {
    await supabaseService.deleteDietaryEvaluation(evaluationId);
  }

  async saveMeasurement(evaluationId: string, measurement: any): Promise<void> {
    await supabaseService.saveMeasurement(evaluationId, measurement);
  }

  async deleteMeasurement(evaluationId: string): Promise<void> {
    await supabaseService.deleteMeasurement(evaluationId);
  }

  async saveSomatotype(evaluationId: string, record: SomatotypeRecord): Promise<void> {
    await supabaseService.saveSomatotype(evaluationId, record);
  }

  async deleteSomatotype(evaluationId: string): Promise<void> {
    await supabaseService.deleteSomatotype(evaluationId);
  }

  async saveMenu(evaluationId: string, menu: GeneratedMenu): Promise<void> {
    await supabaseService.saveMenu(evaluationId, menu);
  }

  async deleteMenu(id: string): Promise<void> {
    await supabaseService.deleteMenu(id);
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  getInvoices(): Invoice[] { return this.invoices; }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const newInvoice = await supabaseService.createInvoice(invoice);
    this.invoices = [newInvoice, ...this.invoices];
    save(this.K.invoices, this.invoices);
    return newInvoice;
  }

  async updateInvoice(updatedInvoice: Invoice): Promise<void> {
    // Note: supabaseService doesn't have updateInvoice yet, but we can add it or use a generic one
    // For now, let's assume we'll add it to supabaseService
    await supabaseService.updateInvoice(updatedInvoice.id, updatedInvoice);
    this.invoices = this.invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
    save(this.K.invoices, this.invoices);
  }

  async deleteInvoice(id: string): Promise<void> {
    await supabaseService.deleteInvoice(id);
    this.invoices = this.invoices.filter(i => i.id !== id);
    save(this.K.invoices, this.invoices);
  }

  // ── Appointments ───────────────────────────────────────────────────────────

  getAppointments(): Appointment[] { return this.appointments; }

  async addAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const newAppt = await supabaseService.createAppointment(appointment);
    this.appointments = [...this.appointments, newAppt];
    save(this.K.appointments, this.appointments);
    return newAppt;
  }

  async updateAppointment(updatedAppointment: Appointment): Promise<void> {
    await supabaseService.updateAppointment(updatedAppointment.id, updatedAppointment);
    this.appointments = this.appointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
    save(this.K.appointments, this.appointments);
  }

  async deleteAppointment(id: string): Promise<void> {
    await supabaseService.deleteAppointment(id);
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

  async addEvaluation(patientId: string, date: string): Promise<PatientEvaluation> {
    const title = `Evaluación ${formatSpanishLongDate(date)}`;
    const savedEv = await supabaseService.createEvaluation(patientId, date, title);
    this.evaluations = [savedEv, ...this.evaluations];
    save(this.K.evaluations, this.evaluations);
    this.selectedEvaluationByPatient[patientId] = savedEv.id;
    save(this.K.evalSelected, this.selectedEvaluationByPatient);
    return savedEv;
  }

  async updateEvaluation(evaluationId: string, patch: Partial<Omit<PatientEvaluation, 'id' | 'patientId'>>): Promise<PatientEvaluation | null> {
    const current = this.getEvaluationById(evaluationId);
    if (!current) return null;
    const updated: PatientEvaluation = { ...current, ...patch };
    await supabaseService.updateEvaluation(evaluationId, patch);
    this.evaluations = this.evaluations.map(e => e.id === evaluationId ? updated : e);
    save(this.K.evaluations, this.evaluations);
    return updated;
  }

  async deleteEvaluation(evaluationId: string): Promise<void> {
    const ev = this.getEvaluationById(evaluationId);
    if (!ev) return;
    const pid = ev.patientId;
    await supabaseService.deleteEvaluation(evaluationId);
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

  getUserProfile(): UserProfile { return this.user || SEED_USER; }

  async updateUserProfile(profile: UserProfile): Promise<void> {
    if (this.uid && this.uid !== 'guest') {
      await supabaseService.updateProfile(this.uid, {
        name: profile.name,
        professionalTitle: profile.professionalTitle,
        specialty: profile.specialty,
        licenseNumber: profile.licenseNumber,
        timezone: profile.timezone,
        avatar: profile.avatar
      });
    }
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

  async getAppointmentsForNutritionist(nutritionistId: string): Promise<Appointment[]> {
    const appts = await supabaseService.getAppointments(nutritionistId);
    const keys = makeKeys(nutritionistId);
    save(keys.appointments, appts);
    return appts;
  }

  getPatientsForNutritionist(nutritionistId: string): Patient[] {
    const keys = makeKeys(nutritionistId);
    return load(keys.patients, []);
  }

  async addAppointmentForNutritionist(nutritionistId: string, appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const newAppt = await supabaseService.createAppointment({ ...appointment, nutritionistId });
    const keys = makeKeys(nutritionistId);
    const existingAppointments = load<Appointment[]>(keys.appointments, []);
    const updated = [...existingAppointments, newAppt];
    save(keys.appointments, updated);
    return newAppt;
  }

  async updateAppointmentForNutritionist(nutritionistId: string, updatedAppointment: Appointment): Promise<void> {
    await supabaseService.updateAppointment(updatedAppointment.id, updatedAppointment);
    const keys = makeKeys(nutritionistId);
    const existingAppointments = load<Appointment[]>(keys.appointments, []);
    const updated = existingAppointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
    save(keys.appointments, updated);
  }

  async deleteAppointmentForNutritionist(nutritionistId: string, appointmentId: string): Promise<void> {
    await supabaseService.deleteAppointment(appointmentId);
    const keys = makeKeys(nutritionistId);
    const existingAppointments = load<Appointment[]>(keys.appointments, []);
    const updated = existingAppointments.filter(a => a.id !== appointmentId);
    save(keys.appointments, updated);
  }
}

export const store = new Store();