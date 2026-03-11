export interface MealEntry {
  id?: string;
  dietaryEvaluationId?: string;
  mealTime: string;
  time: string;
  place: string;
  description: string;
}

export interface FoodFrequencyEntry {
  id: string;
  dietaryEvaluationId: string;
  category: string;
  frequency: string;
}

export interface DietaryEvaluation {
  id: string;
  linkedEvaluationId: string;  // AGREGADO - Foreign key con evaluations
  date: string;
  mealsPerDay: number;
  excludedFoods: string;
  notes?: string;
  recall: MealEntry[];
  foodFrequency: FoodFrequencyEntry[];
  foodFrequencyOthers?: string;
}

export interface ClinicalRecord {
  status: string;
  cui: string;
  birthdate: string;
  age: number;
  sex: string;
  email: string;
  phone: string;
  occupation: string;
  study: string;
  consultmotive: string;
  clinicalbackground: string;
  diagnosis: string;
  familyHistory: string;
  medications: string;
  supplements: string;
  allergies: string;
  regularPeriod: string;
  periodDuration: string;
  firstperiodage: string;
  menstrualOthers: string;
}

export interface Measurement {
  id: string;
  linkedEvaluationId: string;  // AGREGADO - Foreign key con evaluations
  date: string;
  metaComplied?: boolean;
  age?: number;
  weight?: number;
  height?: number;
  imc?: number;
  bodyFat?: number;
  fatKg?: number;
  aks?: number;
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
  gender?: string;
  leanMassKg?: number;
  leanMassPct?: number;
  boneMass?: number;
  residualMass?: number;
  endomorfo?: number;
  mesomorfo?: number;
  ectomorfo?: number;
  x?: number;
  y?: number;
  diagnosticN?: string;
  subjectiveValuation?: number;
  [key: string]: any;
}

export interface SomatotypeRecord {
  id: string;
  linkedEvaluationId: string; // AGREGADO - Foreign key con evaluations
  date: string;
  x: number;
  y: number;
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

export interface GeneratedMenu {
  id: string;                          // Usar IDs cortos (ej: "menu-1", "menu-2")
  linkedEvaluationId: string;          // Foreign key con evaluations
  date: string;                        // RENOMBRADO (era basedOnMeasurementDate) - Sacar de linkedEvaluationId
  content: string;
  vet?: VetCalculation;
  macros?: MacrosRecord;
  portions?: PortionsRecord;
  name?: string;
  selectedTemplateId?: string;
  selectedReferenceIds?: string[];     // Usar IDs cortos (ej: ["ref-1", "ref-2"])
  aiRationale?: string;
  menuPreviewData?: any;
}

// SIMPLIFICADO - Eliminados: currentDiet, dailyCaloriesTarget, menus, notes
export interface DietaryRecord {
  preferences: string;
  lastAiSuggestion?: string;
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
  nutritionistId?: string;
  receptionistId?: string;
  createdBy?: string;
  createdByRole?: 'admin' | 'nutricionista' | 'recepcionista';
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  linkedEvaluationId: string;
  url: string;
  type: 'image' | 'pdf' | 'other';
  labInterpretation?: string;
}

export interface Photo {
  id: string;
  name: string;
  date: string;
  linkedEvaluationId?: string;  // Opcional porque puede ser foto general
  url: string;
  type: 'image' | 'pdf' | 'other';
}

export interface SportsProfile {
  id: string;
  patientId: string;
  sport: string;
  daysPerWeek: string;
  schedule: string;
  hoursPerDay: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  registeredAt: string;
  clinical: ClinicalRecord;
  dietary: DietaryRecord;
  dietaryEvaluations: DietaryEvaluation[];
  measurements: Measurement[];
  somatotypes: SomatotypeRecord[];
  sportsProfile: SportsProfile[]; // AGREGADO
  menus: GeneratedMenu[];
  labs: LabResult[];
  photos: Photo[];
  evaluations?: PatientEvaluation[]; // Para export/import
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
  avatar?: string;
  timezone?: string;
}

export interface PageModulePermission {
  moduleId: string;
  label: string;
  roles: Array<'admin' | 'nutricionista' | 'recepcionista'>;
}

export type UserRole = 'admin' | 'nutricionista' | 'recepcionista';

export interface PagePermission {
  pageId: string;
  label: string;
  roles: Array<'admin' | 'nutricionista' | 'recepcionista'>;
  modules?: PageModulePermission[];
}

export interface AppUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'nutricionista' | 'recepcionista';
  profile: UserProfile;
  linkedNutritionistIds?: string[];
  linkedReceptionistIds?: string[];
  linkCode?: string;
}

export interface PatientEvaluation {
  id: string;
  patientId: string;
  date: string;
  title?: string;
}

export enum AppRoute {
  LOGIN             = 'login',
  MAIN              = 'main',
  MAIN_RECEPTIONIST = 'main-receptionist',
  DASHBOARD         = 'dashboard',
  PATIENT_DETAIL    = 'patient-detail',
  CALENDAR          = 'calendar',
  PAYMENTS          = 'payments',
  PROFILE           = 'profile',
  MENUS             = 'menus',
  ADMIN             = 'admin',
}