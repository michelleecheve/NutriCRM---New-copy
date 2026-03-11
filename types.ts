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

export interface ClinicalRecord {
  status: string;
  dob: string;
  age: number;
  sex: string;
  occupation: string;
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
  consultationReason: string;
  diagnosis: string;
  familyHistory: string;
  medications: string;
  allergies: string;
  menarcheAge: string;
  regularPeriod: string;
  periodDuration: string;
}

export interface Measurement {
  id: string;          // ✅ nuevo — identificador único
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
  url: string;
  type: 'image' | 'pdf' | 'other';
  description?: string;
  labInterpretation?: string;
}

export interface Photo {
  id: string;
  name: string;
  date: string;
  url: string;
  type: 'image' | 'pdf' | 'other';
  description?: string;
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
  createdAt: string;
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