export interface Measurement {
  date: string;
  metaComplied: boolean;
  gender?: 'M' | 'F';
  age?: number;
  weight?: number;
  height?: number;
  imc?: number;
  bodyFat?: number;
  fatKg?: number;
  leanMassKg?: number;
  leanMassPct?: number;
  aks?: number;
  boneMass?: number;
  residualMass?: number;
  muscleKg?: number;
  biceps?: number;
  triceps?: number;
  subscapular?: number;
  supraspinal?: number;
  abdomen?: number;
  thigh?: number;
  calf?: number;
  iliacCrest?: number;
  skinfoldSum?: number;
  wrist?: number;
  humerus?: number;
  femur?: number;
  armRelaxed?: number;
  armContracted?: number;
  calfGirth?: number;
  waist?: number;
  umbilical?: number;
  hip?: number;
  abdominalLow?: number;
  thighRight?: number;
  thighLeft?: number;
  diagnosticN?: string;
  endomorfo?: number;
  mesomorfo?: number;
  ectomorfo?: number;
  x?: number;
  y?: number;
  subjectiveValuation?: number;
}

export interface SomatotypeRecord {
  id: string;
  date: string;
  x: number;
  y: number;
  notes?: string;
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  url: string;
  type: 'pdf' | 'image' | 'other';
}

export interface Photo {
  id: string;
  name: string;
  date: string;
  url: string;
  type: 'pdf' | 'image' | 'other';
  description?: string;
}

export interface SportEntry {
  sport: string;
  daysPerWeek: string;
  schedule: string;
  hoursPerDay: string;
}

export interface ClinicalRecord {
  status?: '-' | 'Cita Agendada' | 'Menú Pendiente' | 'Menú Entregado' | 'Cita Cancelada';
  dob: string;
  age: number;
  sex: string;
  cui?: string;
  occupation: string;
  study?: string;
  phone: string;
  email: string;
  initialWeight: string;
  initialHeight: string;
  sport: string;
  category: string;
  sportsAge: string;
  otherSports: string;
  trainingFrequency: string;
  daysPerWeek: string;
  hoursPerDay: string;
  goals: string;
  antecedentes?: string;
  sportsProfile?: SportEntry[];
  consultationReason: string;
  diagnosis: string;
  familyHistory: string;
  medications: string;
  supplements?: string;
  allergies: string;
  menarcheAge?: string;
  regularPeriod?: string;
  periodDuration?: string;
  menstrualOthers?: string;
}

export interface MealEntry {
  mealTime: string;
  time: string;
  place: string;
  description: string;
}

export interface DietaryEvaluation {
  id: string;
  date: string;
  mealsPerDay: number;
  excludedFoods: string;
  notes?: string;
  recall: MealEntry[];
  foodFrequency: Record<string, string>;
  foodFrequencyOthers?: string;
}

export interface VetCalculation {
  age: number;
  weight: number;
  height: number;
  sex: 'Femenino' | 'Masculino';
  activityLevel: 'Muy Leve' | 'Leve' | 'Moderado' | 'Intenso' | 'Excepcional';
  activityFactor: number;
  kcal: number;
  kcalReal: number;
  kcalToWork: number;
}

export interface MacroRecord {
  pct: number;
  kcal: number;
  g: number;
  notes?: string;
}

export interface MacrosRecord {
  cho: MacroRecord;
  chon: MacroRecord;
  fat: MacroRecord;
  totalKcal: number;
}

export interface PortionsRecord {
  lec: number;
  lecDesc: number;
  fru: number;
  veg: number;
  cer: number;
  carMagra: number;
  carSemi: number;
  carAlta: number;
  gra: number;
  azu: number;
}

export interface DietaryRecord {
  currentDiet: string;
  preferences: string;
  dailyCaloriesTarget: number;
  notes: string;
  lastAiSuggestion?: string;
  vet?: VetCalculation;
  macros?: MacrosRecord;
  portions?: PortionsRecord;
  menus?: GeneratedMenu[];
}

export interface GeneratedMenu {
  id: string;
  createdAt: string;
  basedOnMeasurementDate: string;
  content: string;
  vet?: VetCalculation;
  macros?: MacrosRecord;
  portions?: PortionsRecord;
  name?: string;
  selectedTemplateId?: string;
  selectedReferenceIds?: string[];
  aiRationale?: string;
  menuPreviewData?: any;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  type: 'Primera Consulta' | 'Seguimiento';
  modality: 'Presencial' | 'Video';
  status: 'Programada' | 'Completada' | 'Cancelada' | 'Reagendada';
  notes?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  registeredAt: string;
  clinical: ClinicalRecord;
  dietary: DietaryRecord;
  dietaryEvaluations: DietaryEvaluation[];
  measurements: Measurement[];
  somatotypes: SomatotypeRecord[];
  menus: GeneratedMenu[];
  labs: LabResult[];
  photos: Photo[];
}

export interface Invoice {
  id: string;
  patientId?: string;
  patientName: string;
  date: string;
  amount: number;
  status: 'Pagado' | 'Pendiente' | 'Vencido';
  method: 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Otro';
}

export interface UserProfile {
  professionalTitle?: string;
  name: string;
  specialty: string;
  licenseNumber?: string;
  email: string;
  contactEmail?: string;
  phone: string;
  personalPhone?: string;
  instagramHandle?: string;
  address?: string;
  website?: string;
  avatar: string;
  timezone?: string;
}

// ─── ROLES ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'nutricionista' | 'recepcionista';

export interface AppUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  profile: UserProfile;
  linkedNutritionistIds?: string[]; // solo recepcionista
  linkedReceptionistIds?: string[];  // solo nutricionista
}

export interface ModulePermission {
  moduleId: string;
  label: string;
  roles: UserRole[];
}

export interface PagePermission {
  pageId: string;
  label: string;
  roles: UserRole[];
  modules?: ModulePermission[];
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

export enum AppRoute {
  LOGIN            = 'login',
  MAIN             = 'main',
  MAIN_RECEPTIONIST = 'main-receptionist',
  DASHBOARD        = 'dashboard',
  PATIENT_DETAIL   = 'patient-detail',
  CALENDAR         = 'calendar',
  PAYMENTS         = 'payments',
  PROFILE          = 'profile',
  MENUS            = 'menus',
  ADMIN            = 'admin',
}