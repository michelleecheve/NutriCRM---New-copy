import {
  Patient, Invoice, UserProfile, Appointment, PatientEvaluation,
  ClinicalRecord, DietaryEvaluation, SomatotypeRecord, GeneratedMenu,
  MenuAIConfig, MenuReferenceRecord, MenuRecommendationRecord
} from '../types';
import { supabaseService } from './supabaseService';
import { googleCalendarService } from './googleCalendarService';

// ─── Read current userId directly from localStorage (no circular import) ──────
const SESSION_KEY = 'nutricrm_session_v1';

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

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_STATUSES = ['Sin Status', 'Menú Pendiente', 'Menú Entregado'];

const SEED_USER: UserProfile = {
  professionalTitle: 'Lic.',
  name: 'Nutricionista',
  specialty: '',
  licenseNumber: '',
  email: '',
  contactEmail: '',
  phone: '',
  timezone: 'UTC±00:00',
};

// ─── Store Class ──────────────────────────────────────────────────────────────

class Store {
  private uid: string = 'guest';
  private K = makeKeys('guest');

  private patients:     Patient[]          = [];
  private invoices:     Invoice[]          = [];
  private appointments: Appointment[]      = [];
  private user:         UserProfile        = SEED_USER;
  private statuses:     string[]           = DEFAULT_STATUSES;
  private evaluations:  PatientEvaluation[] = [];
  public menuReferences: MenuReferenceRecord[] = [];
  public menuRecommendations: MenuRecommendationRecord[] = [];
  public menuTemplate: any = null;
  private selectedEvaluationByPatient: Record<string, string> = {};
  public isInitialized: boolean = false;

  constructor() {
    const uid = getCurrentUserId();
    this.initForUser(uid);
  }

  // ── Called on login / logout to reload data for the new user ──────────────
  async initForUser(userId: string): Promise<void> {
    this.uid = userId;
    this.K   = makeKeys(userId);

    if (userId === 'guest') {
      this.patients     = [];
      this.invoices     = [];
      this.appointments = [];
      this.user         = null as any;
      this.statuses     = DEFAULT_STATUSES;
      this.evaluations  = [];
      return;
    }

    try {
      const [patients, appointments, invoices, evaluations, menus, profile, menuRefs, menuRecs, template] = await Promise.all([
        supabaseService.getPatients(),
        supabaseService.getAppointments(),
        supabaseService.getInvoices(),
        supabaseService.getEvaluations(),
        supabaseService.getMenus(),
        supabaseService.getProfile(userId),
        supabaseService.getMenuReferences(userId),
        supabaseService.getMenuRecommendations(userId),
        supabaseService.getDefaultMenuTemplate(userId),
      ]);

      this.patients     = (patients as Patient[]).map(p => ({
        ...p,
        menus: (menus as GeneratedMenu[]).filter(m => m.patientId === p.id)
      }));
      this.appointments = appointments as Appointment[];
      this.invoices     = invoices as Invoice[];
      this.evaluations  = evaluations as PatientEvaluation[];
      this.menuReferences = menuRefs as MenuReferenceRecord[];
      this.menuRecommendations = menuRecs as MenuRecommendationRecord[];
      this.menuTemplate = template;

      if (profile) {
        this.user = {
          name:              profile.name              || '',
          email:             profile.email             || '',
          professionalTitle: profile.professional_title || '',
          specialty:         profile.specialty          || '',
          licenseNumber:     profile.license_number     || '',
          timezone:          profile.timezone           || 'UTC±00:00',
          avatar:            profile.avatar             || '',
          phone:             profile.phone              || '',
          personalPhone:     profile.personal_phone     || '',
          contactEmail:      profile.contact_email      || '',
          instagramHandle:   profile.instagram_handle   || '',
          website:           profile.website            || '',
          address:           profile.address            || '',
          menuAIConfig:      profile.menu_ai_config,
          labAIPrompt:       profile.lab_ai_prompt      || '',
        };

        // ✅ Enforce only the three requested statuses as per user request
        this.statuses = DEFAULT_STATUSES;
        
        // If we wanted to keep custom ones, we would merge, but user said "solo dejes"
        // await this.updatePatientStatuses(DEFAULT_STATUSES); // Optional: force save to Supabase
      }

      this.isInitialized = true;

      // Cache local
      save(this.K.patients,     this.patients);
      save(this.K.appointments, this.appointments);
      save(this.K.invoices,     this.invoices);
      save(this.K.evaluations,  this.evaluations);
      save(this.K.statuses,     this.statuses);   // ✅ también en cache local
      if (this.user) save(this.K.user, this.user);

    } catch (error) {
      console.error('Error initializing store from Supabase:', error);
      // Fallback a localStorage
      this.patients     = load(this.K.patients,     []);
      this.invoices     = load(this.K.invoices,     []);
      this.appointments = load(this.K.appointments, []);
      this.user         = load(this.K.user,         null as any);
      this.evaluations  = load(this.K.evaluations,  []);
      this.statuses     = load(this.K.statuses,     DEFAULT_STATUSES); // ✅ fallback local
    }
  }

  getTodayStr(): string {
    return getTodayYMDInUserTimezone(this.user?.timezone || 'UTC±00:00');
  }

  // ── Patients ───────────────────────────────────────────────────────────────

  getPatients(): Patient[] { return this.patients; }

  getPatient(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  async importPatientDataFull(data: Patient & { evaluations?: PatientEvaluation[] }): Promise<void> {
    const { evaluations, ...patient } = data;

    // Legacy compat: sportsProfile nested inside clinical
    if ((patient.clinical as any).sportsProfile && (!patient.sportsProfile || patient.sportsProfile.length === 0)) {
      patient.sportsProfile = (patient.clinical as any).sportsProfile;
    }
    if (!patient.sportsProfile) patient.sportsProfile = [];

    // 1. Update patient base fields in Supabase
    await supabaseService.updatePatient(patient.id, patient);

    // 2. Upsert evaluations
    if (evaluations && Array.isArray(evaluations)) {
      for (const ev of evaluations) {
        await supabaseService.upsertEvaluation({ ...ev, patientId: patient.id });
      }
      const otherEvals = this.evaluations.filter(e => e.patientId !== patient.id);
      this.evaluations = [...otherEvals, ...evaluations.map(e => ({ ...e, patientId: patient.id }))];
      save(this.K.evaluations, this.evaluations);
    }

    // 3. Upsert measurements
    for (const m of (patient.measurements || [])) {
      if (m.linkedEvaluationId) {
        await supabaseService.saveMeasurement(m.linkedEvaluationId, { ...m, patientId: patient.id });
      }
    }

    // 4. Upsert bioimpedancias
    for (const b of (patient.bioimpedancias || [])) {
      if (b.evaluation_id) {
        await supabaseService.saveBioimpedancia(b.evaluation_id, { ...b, patientId: patient.id });
      }
    }

    // 5. Upsert dietary evaluations
    for (const d of (patient.dietaryEvaluations || [])) {
      if (d.linkedEvaluationId) {
        await supabaseService.saveDietaryEvaluation(d.linkedEvaluationId, d);
      }
    }

    // 6. Upsert somatotypes
    for (const s of (patient.somatotypes || [])) {
      if (s.linkedEvaluationId) {
        await supabaseService.saveSomatotype(s.linkedEvaluationId, { ...s, patientId: patient.id } as any);
      }
    }

    // 7. Upsert menus
    for (const m of (patient.menus || [])) {
      if (m.linkedEvaluationId) {
        await supabaseService.saveMenu(m.linkedEvaluationId, { ...m, patientId: patient.id });
      }
    }

    // 8. Upsert labs metadata
    for (const f of (patient.labs || [])) {
      await supabaseService.upsertPatientFileMeta({ ...f, folder: 'labs' }, patient.id);
    }

    // 9. Upsert photos metadata
    for (const f of (patient.photos || [])) {
      await supabaseService.upsertPatientFileMeta({ ...f, folder: 'photos' }, patient.id);
    }

    // 10. Update local in-memory state
    this.patients = this.patients.map(p => p.id === patient.id ? { ...patient } : p);
    save(this.K.patients, this.patients);
  }

  importPatientData(data: Patient & { evaluations?: PatientEvaluation[] }): void {
    const { evaluations, ...patient } = data;

    if ((patient.clinical as any).sportsProfile && (!patient.sportsProfile || patient.sportsProfile.length === 0)) {
      patient.sportsProfile = (patient.clinical as any).sportsProfile;
    }
    if (!patient.sportsProfile) patient.sportsProfile = [];

    if (patient.menus) {
      patient.menus = patient.menus.map(m => {
        if ((m as any).basedOnMeasurementDate && !m.date) {
          return { ...m, date: (m as any).basedOnMeasurementDate };
        }
        return m;
      });
    }

    this.updatePatient(patient);

    if (evaluations && Array.isArray(evaluations)) {
      const otherEvaluations = this.evaluations.filter(e => e.patientId !== patient.id);
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
      id: '',
      registeredAt: this.getTodayStr(),
      firstName: basicInfo.firstName,
      lastName:  basicInfo.lastName,
      clinical: {
        status:             (basicInfo.status as any) || 'Sin Status',
        cui:                '',
        birthdate:          basicInfo.birthdate || '',
        age,
        sex:                '',
        email:              basicInfo.email,
        phone:              basicInfo.phone,
        occupation:         '',
        study:              '',
        consultmotive:      '',
        clinicalbackground: '',
        diagnosis:          '',
        familyHistory:      '',
        medications:        '',
        supplements:        '',
        allergies:          '',
        regularPeriod:      '',
        periodDuration:     '',
        firstperiodage:     '',
        menstrualOthers:    '',
        categ_discipline:   '',
        sport_age:          '',
        competencia:        '',
        sleep_hours:        '',
        othersNotes:        '',
      },
      dietary:            { preferences: '' },
      dietaryEvaluations: [],
      measurements:       [],
      bioimpedancias:     [],
      somatotypes:        [],
      sportsProfile:      [],
      menus:              [],
      labs:               [],
      photos:             [],
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
    
    // Update local state
    const patient = this.patients.find(p => p.dietaryEvaluations.some(d => d.id === dietary.id) || p.id === this.getEvaluationById(evaluationId)?.patientId);
    if (patient) {
      const exists = patient.dietaryEvaluations.some(d => d.id === dietary.id);
      const updatedEvaluations = exists
        ? patient.dietaryEvaluations.map(d => d.id === dietary.id ? dietary : d)
        : [dietary, ...patient.dietaryEvaluations];
      
      const updatedPatient = { ...patient, dietaryEvaluations: updatedEvaluations };
      this.updatePatient(updatedPatient);
    }
  }

  async deleteDietaryEvaluation(id: string): Promise<void> {
    await supabaseService.deleteDietaryEvaluation(id);
    
    // Update local state
    const patient = this.patients.find(p => p.dietaryEvaluations.some(d => d.id === id));
    if (patient) {
      const updatedEvaluations = patient.dietaryEvaluations.filter(d => d.id !== id);
      const updatedPatient = { ...patient, dietaryEvaluations: updatedEvaluations };
      this.updatePatient(updatedPatient);
    }
  }

  async saveMeasurement(evaluationId: string, measurement: any): Promise<void> {
    await supabaseService.saveMeasurement(evaluationId, measurement);
    
    // Update local state
    const evalObj = this.getEvaluationById(evaluationId);
    if (!evalObj) return;
    
    const patient = this.patients.find(p => p.id === evalObj.patientId);
    if (patient) {
      const exists = patient.measurements.some(m => m.id === measurement.id);
      const updatedMeasurements = exists
        ? patient.measurements.map(m => m.id === measurement.id ? measurement : m)
        : [measurement, ...patient.measurements];
      
      const updatedPatient = { ...patient, measurements: updatedMeasurements };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  async deleteMeasurement(id: string): Promise<void> {
    await supabaseService.deleteMeasurementById(id);
    
    // Update local state
    const patient = this.patients.find(p => p.measurements.some(m => m.id === id));
    if (patient) {
      const updatedMeasurements = patient.measurements.filter(m => m.id !== id);
      const updatedPatient = { ...patient, measurements: updatedMeasurements };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  async saveSomatotype(evaluationId: string, record: SomatotypeRecord): Promise<SomatotypeRecord> {
    const saved = await supabaseService.saveSomatotype(evaluationId, record);
    const savedRecord: SomatotypeRecord = { ...record, id: saved.id };

    // Update local state
    const evalObj = this.getEvaluationById(evaluationId);
    if (!evalObj) return savedRecord;

    const patient = this.patients.find(p => p.id === evalObj.patientId);
    if (patient) {
      const exists = patient.somatotypes.some(s => s.id === record.id || s.id === saved.id);
      const updatedSomatotypes = exists
        ? patient.somatotypes.map(s => (s.id === record.id || s.id === saved.id) ? savedRecord : s)
        : [savedRecord, ...patient.somatotypes];

      const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
    return savedRecord;
  }

  async deleteSomatotype(id: string): Promise<void> {
    await supabaseService.deleteSomatotype(id);
    
    // Update local state
    const patient = this.patients.find(p => p.somatotypes.some(s => s.id === id));
    if (patient) {
      const updatedSomatotypes = patient.somatotypes.filter(s => s.id !== id);
      const updatedPatient = { ...patient, somatotypes: updatedSomatotypes };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  async saveBioimpedancia(evaluationId: string, record: any): Promise<void> {
    const saved = await supabaseService.saveBioimpedancia(evaluationId, record);
    
    // Update local state
    const evalObj = this.getEvaluationById(evaluationId);
    if (!evalObj) return;
    
    const patient = this.patients.find(p => p.id === evalObj.patientId);
    if (patient) {
      const exists = patient.bioimpedancias.some(b => b.id === saved.id);
      const updatedBioimpedancias = exists
        ? patient.bioimpedancias.map(b => b.id === saved.id ? saved : b)
        : [saved, ...patient.bioimpedancias];
      
      const updatedPatient = { ...patient, bioimpedancias: updatedBioimpedancias };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  async deleteBioimpedancia(id: string): Promise<void> {
    await supabaseService.deleteBioimpedancia(id);
    
    // Update local state
    const patient = this.patients.find(p => p.bioimpedancias.some(b => b.id === id));
    if (patient) {
      const updatedBioimpedancias = patient.bioimpedancias.filter(b => b.id !== id);
      const updatedPatient = { ...patient, bioimpedancias: updatedBioimpedancias };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  async saveMenu(evaluationId: string, menu: GeneratedMenu): Promise<void> {
    await supabaseService.saveMenu(evaluationId, menu);
    
    // Update local state
    const evalObj = this.getEvaluationById(evaluationId);
    if (!evalObj) return;
    
    const patient = this.patients.find(p => p.id === evalObj.patientId);
    if (patient) {
      const exists = patient.menus.some(m => m.id === menu.id);
      const updatedMenus = exists
        ? patient.menus.map(m => m.id === menu.id ? menu : m)
        : [menu, ...patient.menus];
      
      const updatedPatient = { ...patient, menus: updatedMenus };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  async deleteMenu(id: string): Promise<void> {
    await supabaseService.deleteMenu(id);
    
    // Update local state
    const patient = this.patients.find(p => p.menus.some(m => m.id === id));
    if (patient) {
      const updatedMenus = patient.menus.filter(m => m.id !== id);
      const updatedPatient = { ...patient, menus: updatedMenus };
      this.patients = this.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
      save(this.K.patients, this.patients);
    }
  }

  // ── Menu References ───────────────────────────────────────────────────────

  getMenuReferences(): MenuReferenceRecord[] { return this.menuReferences; }

  async saveMenuReference(ref: Partial<MenuReferenceRecord>): Promise<MenuReferenceRecord> {
    const saved = await supabaseService.saveMenuReference({
      id:             ref.id,
      ownerId:        this.uid,
      kcal:           ref.kcal ?? (ref.data as any)?.kcal,
      type:           ref.type ?? (ref.data as any)?.type,
      data:           ref.data,
    });
    const existing = this.menuReferences.find(r => r.id === saved.id);
    if (existing) {
      this.menuReferences = this.menuReferences.map(r => r.id === saved.id ? saved : r);
    } else {
      this.menuReferences = [saved, ...this.menuReferences];
    }
    return saved;
  }

  async deleteMenuReference(id: string): Promise<void> {
    await supabaseService.deleteMenuReference(id);
    this.menuReferences = this.menuReferences.filter(r => r.id !== id);
  }

  // ── Menu Recommendations ───────────────────────────────────────────────────

  getMenuRecommendations() { return this.menuRecommendations; }

  async saveMenuRecommendation(rec: Partial<MenuRecommendationRecord>): Promise<MenuRecommendationRecord> {
    const saved = await supabaseService.saveMenuRecommendation({ ...rec, ownerId: this.uid });
    const existing = this.menuRecommendations.find(r => r.id === saved.id);
    if (existing) {
      this.menuRecommendations = this.menuRecommendations.map(r => r.id === saved.id ? saved : r);
    } else {
      this.menuRecommendations = [saved, ...this.menuRecommendations];
    }
    return saved;
  }

  async deleteMenuRecommendation(id: string): Promise<void> {
    await supabaseService.deleteMenuRecommendation(id);
    this.menuRecommendations = this.menuRecommendations.filter(r => r.id !== id);
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
    const newAppt = await supabaseService.createAppointment({
      ...appointment,
      ownerId: appointment.ownerId || this.uid,
    });
    this.appointments = [...this.appointments, newAppt];
    save(this.K.appointments, this.appointments);

    // Fire-and-forget: sync to Google Calendar if connected
    const ownerId = this.uid;
    if (ownerId && ownerId !== 'guest' && googleCalendarService.isConnected()) {
      googleCalendarService.createEvent(newAppt, ownerId).then(googleEventId => {
        if (!googleEventId) return;
        supabaseService.updateAppointmentGoogleEventId(newAppt.id, googleEventId).catch(() => {});
        newAppt.googleEventId = googleEventId;
        this.appointments = this.appointments.map(a => a.id === newAppt.id ? { ...a, googleEventId } : a);
        save(this.K.appointments, this.appointments);
      }).catch(() => {});
    }

    return newAppt;
  }

  async updateAppointment(updatedAppointment: Appointment): Promise<void> {
    await supabaseService.updateAppointment(updatedAppointment.id, {
      ...updatedAppointment,
      ownerId: updatedAppointment.ownerId || this.uid,
    });
    this.appointments = this.appointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
    save(this.K.appointments, this.appointments);

    // Fire-and-forget: sync to Google Calendar if connected
    const ownerId = this.uid;
    if (ownerId && ownerId !== 'guest' && updatedAppointment.googleEventId && googleCalendarService.isConnected()) {
      googleCalendarService.updateEvent(updatedAppointment.googleEventId, updatedAppointment, ownerId).catch(() => {});
    }
  }

  async deleteAppointment(id: string): Promise<void> {
    const apptToDelete = this.appointments.find(a => a.id === id);
    await supabaseService.deleteAppointment(id);
    this.appointments = this.appointments.filter(a => a.id !== id);
    save(this.K.appointments, this.appointments);

    // Fire-and-forget: delete from Google Calendar if connected
    const ownerId = this.uid;
    if (ownerId && ownerId !== 'guest' && apptToDelete?.googleEventId && googleCalendarService.isConnected()) {
      googleCalendarService.deleteEvent(apptToDelete.googleEventId, ownerId).catch(() => {});
    }
  }

  async addAppointmentForNutritionist(nutritionistId: string, appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const newAppt = await supabaseService.createAppointment({
      ...appointment,
      ownerId: nutritionistId,
    });
    const keys = makeKeys(nutritionistId);
    const existing = load<Appointment[]>(keys.appointments, []);
    save(keys.appointments, [...existing, newAppt]);

    // Fire-and-forget: sync using the nutritionist's Google Calendar tokens
    if (googleCalendarService.isConnected()) {
      googleCalendarService.createEvent(newAppt, nutritionistId).then(googleEventId => {
        if (!googleEventId) return;
        supabaseService.updateAppointmentGoogleEventId(newAppt.id, googleEventId).catch(() => {});
      }).catch(() => {});
    }

    return newAppt;
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

  async deletePatientCompletely(patientId: string): Promise<void> {
    await supabaseService.deletePatientCompletely(patientId);

    // Limpiar estado local
    this.evaluations = this.evaluations.filter(e => e.patientId !== patientId);
    save(this.K.evaluations, this.evaluations);

    delete this.selectedEvaluationByPatient[patientId];
    save(this.K.evalSelected, this.selectedEvaluationByPatient);

    this.patients = this.patients.filter(p => p.id !== patientId);
    save(this.K.patients, this.patients);
  }

  getSelectedEvaluationId(patientId: string): string | null {
    return this.selectedEvaluationByPatient[patientId] ?? null;
  }

  getLatestEvaluationId(patientId: string): string | null {
    const evals = this.evaluations.filter(e => e.patientId === patientId);
    if (evals.length === 0) return null;
    return [...evals].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return evals.indexOf(b) - evals.indexOf(a);
    })[0].id;
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

  async updateMenuAIConfig(config: MenuAIConfig): Promise<void> {
    if (this.uid && this.uid !== 'guest') {
      await supabaseService.updateProfile(this.uid, { menuAIConfig: config });
    }
    if (this.user) {
      this.user.menuAIConfig = config;
      save(this.K.user, this.user);
    }
  }

  // ── Menu Templates ─────────────────────────────────────────────────────────

  getMenuTemplate() { return this.menuTemplate; }

  async saveMenuTemplate(template: any): Promise<any> {
    const saved = await supabaseService.saveMenuTemplate(template);
    this.menuTemplate = saved;
    return saved;
  }

  // ── Statuses ───────────────────────────────────────────────────────────────

  getPatientStatuses(): string[] { return this.statuses; }

  // ✅ Ahora async — guarda en Supabase (profiles.patient_statuses) + cache local
  async updatePatientStatuses(statuses: string[]): Promise<void> {
    this.statuses = statuses;
    save(this.K.statuses, this.statuses);
    if (this.uid && this.uid !== 'guest') {
      try {
        await supabaseService.updatePatientStatuses(this.uid, statuses);
      } catch (err) {
        console.error('Error guardando statuses en Supabase:', err);
      }
    }
  }

  // ── Cross-user operations ──────────────────────────────────────────────────

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


  async updateAppointmentForNutritionist(nutritionistId: string, updatedAppointment: Appointment): Promise<void> {
    await supabaseService.updateAppointment(updatedAppointment.id, {
      ...updatedAppointment,
      ownerId: nutritionistId,
    });
    const keys = makeKeys(nutritionistId);
    const existing = load<Appointment[]>(keys.appointments, []);
    save(keys.appointments, existing.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));

    // Fire-and-forget: sync using the nutritionist's Google Calendar tokens
    if (updatedAppointment.googleEventId && googleCalendarService.isConnected()) {
      googleCalendarService.updateEvent(updatedAppointment.googleEventId, updatedAppointment, nutritionistId).catch(() => {});
    }
  }

  async deleteAppointmentForNutritionist(nutritionistId: string, appointmentId: string): Promise<void> {
    const keys = makeKeys(nutritionistId);
    const existing = load<Appointment[]>(keys.appointments, []);
    const apptToDelete = existing.find(a => a.id === appointmentId);

    await supabaseService.deleteAppointment(appointmentId);
    save(keys.appointments, existing.filter(a => a.id !== appointmentId));

    // Fire-and-forget: delete from Google Calendar using the nutritionist's tokens
    if (apptToDelete?.googleEventId && googleCalendarService.isConnected()) {
      googleCalendarService.deleteEvent(apptToDelete.googleEventId, nutritionistId).catch(() => {});
    }
  }
}

export const store = new Store();