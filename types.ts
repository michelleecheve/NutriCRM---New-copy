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
  categ_discipline: string;
  sport_age: string;
  competencia: string;
  sleep_hours: string;
  othersNotes: string;
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

export type MeasurementRecord = Measurement;

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
  id?: string;
  cho: MacroRecord;
  chon: MacroRecord;
  fat: MacroRecord;
  totalKcal: number;
}

export interface PortionRow {
  id: string;
  group: string;
  portions: number;
  kcal: number;
  cho: number;
  chon: number;
  fat: number;
}

export interface PortionsRecord {
  id?: string;
  rows?: PortionRow[];
  totals?: {
    kcal: number;
    cho: number;
    chon: number;
    fat: number;
  };
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

export interface TrackingRow {
  id: string;
  patientId: string;
  menuId: string;
  durationDays: number;
  menuStartDate: string | null;
  menuEndDate: string | null;
  trackingData: Record<string, any>;
  updatedAt: string;
}

export interface GeneratedMenu {
  id: string;
  linkedEvaluationId: string;
  patientId?: string;
  date: string;
  createdAt?: string;
  
  // VET Calculation Basics (Individual columns)
  age?: number;
  weightKg?: number;
  heightCm?: number;
  gender?: string;
  
  // VET Calculation Details (JSONB)
  vetDetails?: {
    activityLevel: string;
    activityFactor: number;
    tmbKcal: number;
    getKcalReal: number;
  };
  
  // Kcal to work (Individual column)
  kcalToWork?: number;
  
  // Macros and Portions (JSONB)
  macros?: MacrosRecord;
  portions?: PortionsRecord;
  
  // Templates and References
  templatesReferences?: string;
  templateId?: string;

  // The actual menu (JSONB)
  menuData?: any;
  
  // UI/Legacy fields
  name?: string;
  content?: string;
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
  patientName: string;
  date: string;
  time: string;
  duration: number;
  type: 'Primera Consulta' | 'Seguimiento';
  modality: 'Presencial' | 'Video';
  status: 'Programada' | 'Completada' | 'Cancelada' | 'Reagendada';
  phone?: string;
  notes?: string;
  ownerId?: string;        // ✅ agregado
  nutritionistId?: string;
  receptionistId?: string;
  createdBy?: string;
  createdByRole?: 'admin' | 'nutricionista' | 'recepcionista';
  googleEventId?: string;  // Google Calendar event ID for two-way sync
  reminderSent?: boolean;
  reminderSentAt?: string;
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  linkedEvaluationId: string;
  url: string;
  path: string
  type: 'image' | 'pdf' | 'other';
  labInterpretation?: string;
}

export interface Photo {
  id: string;
  name: string;
  date: string;
  linkedEvaluationId?: string;  // Opcional porque puede ser foto general
  url: string;
  path: string
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
  bioimpedancias: BioimpedanciaRecord[]; // AGREGADO
  menus: GeneratedMenu[];
  labs: LabResult[];
  photos: Photo[];
  evaluations?: PatientEvaluation[]; // Para export/import
  // Portal digital
  portalActive?: boolean;
  accessToken?: string | null;
  accessCode?: string | null;
  portalGoal?: string | null;
}

export interface Invoice {
  id: string;
  patientId?: string;
  patientName: string;
  date: string;
  amount: number;
  status: 'Pagado' | 'Pendiente' | 'Vencido';
  method: 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Otro';
  type?: 'ingreso' | 'egreso';
  category?: string;
  description?: string;
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
  country?: string;
  dateOfBirth?: string;
  currency?: string;
  menuAIConfig?: MenuAIConfig;
  labAIPrompt?: string;
  shareDigitalMenuMessage?: string;
  navbarConfig?: 'sidebar' | 'topnav';
}

export type MealTimeKey = 'desayuno' | 'refaccion' | 'almuerzo' | 'merienda' | 'cena';

export interface FoodIdea {
  id: string;
  name: string;
  description: string;
  category: 'ingrediente' | 'receta' | 'evitar' | 'marca';
}

export interface MealTimeIdeas {
  desayuno:  FoodIdea[];
  refaccion: FoodIdea[];
  almuerzo:  FoodIdea[];
  merienda:  FoodIdea[];
  cena:      FoodIdea[];
}

export interface RecommendationIdeas {
  preparacion: string[];
  restricciones: string[];
  habitos: string[];
  organizacion: string[];
}

export interface PatientDataFields {
  datosClinicos:            boolean;
  antecedentes:             boolean;
  horasSueno:               boolean;
  deporteEntrenamiento:     boolean;
  meta:                     boolean;
  alergias:                 boolean;
  diagnostico:              boolean;
  historialFamiliar:        boolean;
  medicamentos:             boolean;
  evaluacionDietetica:      boolean;
  evaluacionDieteticaFecha: boolean;
  medidasAntropometricas:   boolean;
  bioimpedancia:            boolean;
  laboratorios:             boolean;
}

export interface MenuAIConfig {
  prompt: string;
  ideas:  MealTimeIdeas;
  fields: PatientDataFields;
  recommendationIdeas?: RecommendationIdeas;
}

export interface MenuReferenceRecord {
  id: string;
  ownerId: string;        // ✅ corregido (antes era nutritionistId)
  kcal: number;
  type: string;
  data: any;
  createdAt: string;
}

export interface MenuRecommendationData {
  preparacion: string[];
  restricciones: string[];
  habitos: string[];
  organizacion: string[];
  sectionTitles?: Partial<MenuSectionTitles>;
}

export interface MenuRecommendationRecord {
  id: string;
  ownerId: string;
  name: string;
  data: MenuRecommendationData;
  createdAt: string;
}

// ─── Menu Templates ────────────────────────────────────────────────────────────

export type MenuTemplateDesign = 'plantilla_v1' | 'plantilla_v2';
export type MenuHeaderMode = 'default' | 'logo';

export interface MenuFooterConfig {
  showName: boolean;
  showSpecialty: boolean;
  showLicense: boolean;
  showClinicPhone: boolean;
  showPersonalPhone: boolean;
  showEmail: boolean;
  showInstagram: boolean;
  showWebsite: boolean;
  showAddress: boolean;
}

export interface MenuSectionTitles {
  planTitle: string;
  page2Title: string;
  preparacionEmoji: string;
  preparacionTitle: string;
  restriccionesEmoji: string;
  restriccionesTitle: string;
  habitosEmoji: string;
  habitosTitle: string;
  organizacionEmoji: string;
  organizacionTitle: string;
}

export const DEFAULT_SECTION_TITLES: MenuSectionTitles = {
  planTitle: 'Plan de Alimentación\nPersonalizado',
  page2Title: 'RECOMENDACIONES Y HÁBITOS',
  preparacionEmoji: '🍳',
  preparacionTitle: 'PREPARACIÓN DE ALIMENTOS',
  restriccionesEmoji: '🚫',
  restriccionesTitle: 'RESTRICCIONES ESPECÍFICAS',
  habitosEmoji: '❤️',
  habitosTitle: 'HÁBITOS SALUDABLES',
  organizacionEmoji: '⏰',
  organizacionTitle: 'ORGANIZACIÓN Y HORARIOS',
};

export interface VisualThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

export type FontFamily = 'sans' | 'serif' | 'humanist';
export type SizeScale  = 'compact' | 'normal' | 'spacious';

export interface VisualThemeConfig {
  theme: 'original' | 'minimalista';
  colors: VisualThemeColors;
  paletteId: string;
  font: FontFamily;
  sizeScale: SizeScale;
}

export const DEFAULT_VISUAL_THEME: VisualThemeConfig = {
  theme: 'original',
  colors: { primary: '#0f766e', secondary: '#1e293b', tertiary: '#f0fdf4' },
  paletteId: 'default',
  font: 'sans',
  sizeScale: 'normal',
};

export interface MenuTemplate {
  id: string;
  ownerId: string;
  name: string;
  headerMode: MenuHeaderMode;
  logoUrl?: string;
  templateDesign: MenuTemplateDesign;
  isDefault: boolean;
  footerConfig?: MenuFooterConfig;
  sectionTitles?: MenuSectionTitles;
  visualTheme?: VisualThemeConfig;
  createdAt?: string;
  updatedAt?: string;
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
  password?: string;
  role: 'admin' | 'nutricionista' | 'recepcionista';
  profile: UserProfile;
  linkedNutritionistIds?: string[];
  linkedReceptionistIds?: string[];
  linkCode?: string;
}

export interface BioimpedanciaRecord {
  id: string;
  evaluation_id: string;
  owner_id: string;
  date: string;
  gender?: string;
  age?: number;
  weight: number;
  height: number;
  imc: number;
  body_fat_pct: number;
  water_pct: number;
  muscle_mass: number;
  physique_rating: string;
  visceral_fat: number;
  bone_mass: number;
  bmr: number;
  metabolic_age: number;
  meta_complied?: string;
  armRelaxed?: number;
  armContracted?: number;
  calfGirth?: number;
  waist?: number;
  umbilical?: number;
  hip?: number;
  abdominalLow?: number;
  thighRight?: number;
  thighLeft?: number;
  created_at?: string;
}

export interface PatientEvaluation {
  id: string;
  patientId: string;
  date: string;
  title?: string;
  createdAt?: string;
  notes?: string;
}

export enum AppRoute {
  LANDING           = 'landing',
  LOGIN             = 'login',
  REGISTER          = 'register',
  RESET_PASSWORD    = 'reset-password',
  MAIN              = 'main',
  MAIN_RECEPTIONIST = 'main-receptionist',
  DASHBOARD         = 'dashboard',
  PATIENT_DETAIL    = 'patient-detail',
  CALENDAR          = 'calendar',
  PAYMENTS          = 'payments',
  PROFILE           = 'profile',
  MENUS             = 'menus',
  ADMIN             = 'admin',
  CHECKOUT_SUCCESS  = 'checkout-success',
}