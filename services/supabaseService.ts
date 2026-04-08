import { supabase } from './supabase';
import { authStore } from './authStore';
import {
  Patient,
  PatientEvaluation,
  MeasurementRecord,
  DietaryEvaluation,
  GeneratedMenu,
  TrackingRow,
  Appointment,
  Invoice,
  UserProfile,
  SomatotypeRecord,
  BioimpedanciaRecord,
  MenuReferenceRecord,
  MenuRecommendationRecord
} from '../types';

export const supabaseService = {

  // ─── Profiles ──────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>) {
    const updateData: any = {};
    if (profile.name)              updateData.name               = profile.name;
    if (profile.timezone)          updateData.timezone           = profile.timezone;
    if (profile.professionalTitle) updateData.professional_title = profile.professionalTitle;
    if (profile.specialty)         updateData.specialty          = profile.specialty;
    if (profile.licenseNumber)     updateData.license_number     = profile.licenseNumber;
    if (profile.avatar)            updateData.avatar             = profile.avatar;
    if (profile.menuAIConfig)      updateData.menu_ai_config     = profile.menuAIConfig;
    if (profile.labAIPrompt             !== undefined) updateData.lab_ai_prompt             = profile.labAIPrompt;
    if (profile.shareDigitalMenuMessage !== undefined) updateData.share_digital_menu_message = profile.shareDigitalMenuMessage;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    if (error) throw error;
    return data;
  },

  // ✅ Guardar statuses en profiles.patient_statuses
  async updatePatientStatuses(userId: string, statuses: string[]): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ patient_statuses: statuses })
      .eq('id', userId);
    if (error) throw error;
  },

  // ─── Patients ──────────────────────────────────────────────────────────────

  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.mapPatientFromDb);
  },

  async getPatientById(id: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        evaluations (
          *,
          measurements (*),
          bioimpedancia_measurements (*),
          dietary_evaluations (*),
          somatotypes (*),
          menus (*)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;

    const patient = this.mapFullPatientFromDb(data);

    // Cargar labs y fotos desde patient_files
    const { data: filesData, error: filesError } = await supabase
      .from('patient_files')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    if (!filesError && filesData) {
      patient.labs   = filesData.filter((f: any) => f.folder === 'labs').map(this.mapFileFromDb);
      patient.photos = filesData.filter((f: any) => f.folder === 'photos').map(this.mapFileFromDb);
    }

    return patient;
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    // Plan limit: free users can have at most 10 active patients
    if (!authStore.isPro()) {
      const ownerId = authStore.getCurrentUser()?.id;
      const { count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
        .eq('status', 'Activo');
      if (authStore.patientLimitReached(count ?? 0)) {
        throw new Error('PLAN_LIMIT_PATIENTS');
      }
    }

    const { data, error } = await supabase
      .from('patients')
      .insert({
        first_name:          patient.firstName,
        last_name:           patient.lastName,
        registered_at:       patient.registeredAt,
        dietary_preferences: patient.dietary.preferences,
        status:              patient.clinical.status,
        cui:                 patient.clinical.cui,
        birthdate:           patient.clinical.birthdate,
        age:                 patient.clinical.age,
        sex:                 patient.clinical.sex,
        email:               patient.clinical.email,
        phone:               patient.clinical.phone,
        occupation:          patient.clinical.occupation,
        study:               patient.clinical.study,
        consultmotive:       patient.clinical.consultmotive,
        clinicalbackground:  patient.clinical.clinicalbackground,
        diagnosis:           patient.clinical.diagnosis,
        family_history:      patient.clinical.familyHistory,
        medications:         patient.clinical.medications,
        supplements:         patient.clinical.supplements,
        allergies:           patient.clinical.allergies,
        regular_period:      patient.clinical.regularPeriod,
        period_duration:     patient.clinical.periodDuration,
        first_period_age:    patient.clinical.firstperiodage,
        menstrual_others:    patient.clinical.menstrualOthers,
        categ_discipline:    patient.clinical.categ_discipline,
        sport_age:           patient.clinical.sport_age,
        competencia:         patient.clinical.competencia,
        sleep_hours:         patient.clinical.sleep_hours,
        others_notes:        patient.clinical.othersNotes,
        sports_profile:      (patient.sportsProfile || []).map(({ patientId, ...rest }: any) => rest),
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapPatientFromDb(data);
  },

  async updatePatient(id: string, patient: Partial<Patient>) {
    const updateData: any = {};
    if (patient.firstName)              updateData.first_name           = patient.firstName;
    if (patient.lastName)               updateData.last_name            = patient.lastName;
    if (patient.dietary?.preferences)   updateData.dietary_preferences  = patient.dietary.preferences;

    if (patient.clinical) {
      const c = patient.clinical;
      if (c.status             !== undefined) updateData.status            = c.status;
      if (c.cui                !== undefined) updateData.cui               = c.cui;
      if (c.birthdate          !== undefined) updateData.birthdate         = c.birthdate;
      if (c.age                !== undefined) updateData.age               = c.age;
      if (c.sex                !== undefined) updateData.sex               = c.sex;
      if (c.email              !== undefined) updateData.email             = c.email;
      if (c.phone              !== undefined) updateData.phone             = c.phone;
      if (c.occupation         !== undefined) updateData.occupation        = c.occupation;
      if (c.study              !== undefined) updateData.study             = c.study;
      if (c.consultmotive      !== undefined) updateData.consultmotive     = c.consultmotive;
      if (c.clinicalbackground !== undefined) updateData.clinicalbackground = c.clinicalbackground;
      if (c.diagnosis          !== undefined) updateData.diagnosis         = c.diagnosis;
      if (c.familyHistory      !== undefined) updateData.family_history    = c.familyHistory;
      if (c.medications        !== undefined) updateData.medications       = c.medications;
      if (c.supplements        !== undefined) updateData.supplements       = c.supplements;
      if (c.allergies          !== undefined) updateData.allergies         = c.allergies;
      if (c.regularPeriod      !== undefined) updateData.regular_period    = c.regularPeriod;
      if (c.periodDuration     !== undefined) updateData.period_duration   = c.periodDuration;
      if (c.firstperiodage     !== undefined) updateData.first_period_age  = c.firstperiodage;
      if (c.menstrualOthers    !== undefined) updateData.menstrual_others  = c.menstrualOthers;
      if (c.categ_discipline   !== undefined) updateData.categ_discipline   = c.categ_discipline;
      if (c.sport_age          !== undefined) updateData.sport_age          = c.sport_age;
      if (c.competencia        !== undefined) updateData.competencia        = c.competencia;
      if (c.sleep_hours        !== undefined) updateData.sleep_hours        = c.sleep_hours;
      if (c.othersNotes        !== undefined) updateData.others_notes       = c.othersNotes;
    }

    if (patient.sportsProfile !== undefined) {
      updateData.sports_profile = patient.sportsProfile.map(({ patientId, ...rest }: any) => rest);
    }

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapPatientFromDb(data);
  },

  async updatePatientPortal(id: string, patch: {
    portalActive?: boolean;
    accessToken?: string;
    accessCode?: string;
  }): Promise<Patient> {
    const updateData: any = {};
    if (patch.portalActive !== undefined) updateData.portal_active = patch.portalActive;
    if (patch.accessToken  !== undefined) updateData.access_token  = patch.accessToken;
    if (patch.accessCode   !== undefined) updateData.access_code   = patch.accessCode;

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapPatientFromDb(data);
  },

  async deletePatient(id: string) {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
  },

  async deletePatientCompletely(patientId: string): Promise<void> {
    // 1. Obtener todas las evaluaciones del paciente
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('id')
      .eq('patient_id', patientId);
    if (evalError) throw evalError;

    const evalIds = (evaluations || []).map((e: any) => e.id);

    // 2. Borrar registros hijos de cada evaluación
    if (evalIds.length > 0) {
      await supabase.from('measurements').delete().in('evaluation_id', evalIds);
      await supabase.from('bioimpedancia_measurements').delete().in('evaluation_id', evalIds);
      await supabase.from('dietary_evaluations').delete().in('evaluation_id', evalIds);
      await supabase.from('somatotypes').delete().in('evaluation_id', evalIds);
      await supabase.from('menus').delete().in('evaluation_id', evalIds);
    }

    // 3. Borrar evaluaciones
    if (evalIds.length > 0) {
      await supabase.from('evaluations').delete().in('id', evalIds);
    }

    // 4. Borrar archivos del paciente (labs y fotos) — también del Storage
    const { data: files } = await supabase
      .from('patient_files')
      .select('id, path')
      .eq('patient_id', patientId);

    if (files && files.length > 0) {
      const paths = files.map((f: any) => f.path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('patient-data').remove(paths);
      }
      await supabase.from('patient_files').delete().eq('patient_id', patientId);
    }

    // 5. Borrar menús vinculados directamente al paciente (sin evaluation_id)
    await supabase.from('menus').delete().eq('patient_id', patientId);

    // 6. Borrar citas e invoices
    await supabase.from('appointments').delete().eq('patient_id', patientId);
    await supabase.from('invoices').delete().eq('patient_id', patientId);

    // 7. Finalmente borrar el paciente
    const { error } = await supabase.from('patients').delete().eq('id', patientId);
    if (error) throw error;
  },

  // ─── Evaluations ───────────────────────────────────────────────────────────

  async createEvaluation(patientId: string, date: string, title: string) {
    const { data, error } = await supabase
      .from('evaluations')
      .insert({ patient_id: patientId, date, title })
      .select()
      .single();
    if (error) throw error;
    return this.mapEvaluationFromDb(data);
  },

  async updateEvaluation(id: string, patch: any) {
    const { data, error } = await supabase
      .from('evaluations')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapEvaluationFromDb(data);
  },

  async deleteEvaluation(id: string) {
    const { error } = await supabase.from('evaluations').delete().eq('id', id);
    if (error) throw error;
  },

  async upsertEvaluation(ev: { id: string; patientId: string; date: string; title: string; notes?: string }) {
    const { data, error } = await supabase
      .from('evaluations')
      .upsert(
        { id: ev.id, patient_id: ev.patientId, date: ev.date, title: ev.title, notes: ev.notes || null },
        { onConflict: 'id' }
      )
      .select()
      .single();
    if (error) throw error;
    return this.mapEvaluationFromDb(data);
  },

  async upsertPatientFileMeta(file: { id: string; linkedEvaluationId?: string | null; name: string; type: string; folder: string; url: string; path?: string; date?: string; description?: string; labInterpretation?: string }, patientId: string) {
    const { error } = await supabase
      .from('patient_files')
      .upsert(
        {
          id:                 file.id,
          patient_id:         patientId,
          evaluation_id:      file.linkedEvaluationId || null,
          name:               file.name,
          type:               file.type,
          folder:             file.folder,
          url:                file.url,
          path:               file.path || null,
          date:               file.date || null,
          description:        file.description || null,
          lab_interpretation: file.labInterpretation || null,
        },
        { onConflict: 'id' }
      );
    if (error) throw error;
  },

  // ─── Measurements ──────────────────────────────────────────────────────────

  async saveMeasurement(evaluationId: string, measurement: any) {
    // Incluye el id si existe, siempre
    const payload: any = {
      evaluation_id:       evaluationId,
      patient_id:          measurement.patientId,
      date:                measurement.date,
      gender:              measurement.gender,
      age:                 measurement.age,
      weight:              measurement.weight,
      height:              measurement.height,
      meta_complied:       measurement.metaComplied,
      biceps:              measurement.biceps,
      triceps:             measurement.triceps,
      subscapular:         measurement.subscapular,
      supraspinal:         measurement.supraspinal,
      abdomen:             measurement.abdomen,
      thigh:               measurement.thigh,
      calf:                measurement.calf,
      iliac_crest:         measurement.iliacCrest,
      skinfold_sum:        measurement.skinfoldSum,
      wrist:               measurement.wrist,
      humerus:             measurement.humerus,
      femur:               measurement.femur,
      arm_relaxed:         measurement.armRelaxed,
      arm_contracted:      measurement.armContracted,
      calf_girth:          measurement.calfGirth,
      waist:               measurement.waist,
      umbilical:           measurement.umbilical,
      hip:                 measurement.hip,
      abdominal_low:       measurement.abdominalLow,
      thigh_right:         measurement.thighRight,
      thigh_left:          measurement.thighLeft,
      imc:                 measurement.imc,
      body_fat_pct:        measurement.bodyFat,
      fat_kg:              measurement.fatKg,
      lean_mass_kg:        measurement.leanMassKg,
      lean_mass_pct:       measurement.leanMassPct,
      aks:                 measurement.aks,
      bone_mass:           measurement.boneMass,
      residual_mass:       measurement.residualMass,
      muscle_mass_kg:      measurement.muscleKg,
      endomorfo:           measurement.endomorfo,
      mesomorfo:           measurement.mesomorfo,
      ectomorfo:           measurement.ectomorfo,
      x:                   measurement.x,
      y:                   measurement.y,
      diagnostic_n:        measurement.diagnosticN,
      subjective_valuation: measurement.subjectiveValuation,
    };
    // ⬇️ Este if es lo clave
    if (measurement.id) payload.id = measurement.id;

    // ⬇️ Esto también es CRÍTICO
    const { data, error } = await supabase
      .from('measurements')
      .upsert(payload, { onConflict: 'id' }) // Asegura upsert por el id único
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMeasurementById(id: string) {
    const { error } = await supabase.from('measurements').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Bioimpedancia ─────────────────────────────────────────────────────────

  async saveBioimpedancia(evaluationId: string, record: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const toNum = (val: any) => Number(val) || 0;

    const payload: any = {
      evaluation_id:   evaluationId,
      patient_id:      record.patientId,
      owner_id:        user.id,
      date:            record.date,
      gender:          record.gender || null,
      age:             toNum(record.age) || null,
      weight:          toNum(record.weight),
      height:          toNum(record.height),
      imc:             toNum(record.imc),
      body_fat_pct:    toNum(record.bodyFat),
      water_pct:       toNum(record.totalBodyWater),
      muscle_mass:     toNum(record.muscleMass),
      physique_rating: toNum(record.physiqueRating),
      visceral_fat:    toNum(record.visceralFat),
      bone_mass:       toNum(record.boneMass),
      bmr:             toNum(record.bmr),
      metabolic_age:   toNum(record.metabolicAge),
      meta_complied:   String(record.meta_complied || 'false'),
      armRelaxed:      toNum(record.armRelaxed),
      armContracted:   toNum(record.armContracted),
      calfGirth:       toNum(record.calfGirth),
      waist:           toNum(record.waist),
      umbilical:       toNum(record.umbilical),
      hip:             toNum(record.hip),
      abdominalLow:    toNum(record.abdominalLow),
      thighRight:      toNum(record.thighRight),
      thighLeft:       toNum(record.thighLeft),
    };
    if (record.id) payload.id = record.id;

    const { data, error } = await supabase
      .from('bioimpedancia_measurements')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return this.mapBioimpedanciaFromDb(data, evaluationId);
  },

  async deleteBioimpedancia(id: string) {
    const { error } = await supabase.from('bioimpedancia_measurements').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Dietary Evaluations ───────────────────────────────────────────────────

  async saveDietaryEvaluation(evaluationId: string, dietary: DietaryEvaluation) {
    const payload: any = {
      evaluation_id:  evaluationId,
      date:           dietary.date,
      meals_per_day:  dietary.mealsPerDay,
      excluded_foods: dietary.excludedFoods,
      notes:          dietary.notes,
      recall_24h:     dietary.recall,
      food_frequency: {
        entries: dietary.foodFrequency,
        other:   dietary.foodFrequencyOthers
      },
    };

    if (dietary.id) payload.id = dietary.id;

    const { data, error } = await supabase
      .from('dietary_evaluations')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDietaryEvaluation(id: string) {
    const { error } = await supabase.from('dietary_evaluations').delete().eq('id', id);
    if (error) throw error;
  },

  async saveSomatotype(evaluationId: string, record: SomatotypeRecord) {
    const payload: any = { evaluation_id: evaluationId, patient_id: record.patientId, date: record.date, x: record.x, y: record.y };
    if (record.id) payload.id = record.id;
    const { data, error } = await supabase
      .from('somatotypes')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSomatotype(id: string) {
    const { error } = await supabase.from('somatotypes').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Menus ─────────────────────────────────────────────────────────────────

  async saveMenu(evaluationId: string, menu: GeneratedMenu) {
    const payload: any = {
      id:                   menu.id,
      evaluation_id:        evaluationId,
      patient_id:           menu.patientId,
      date:                 menu.date,
      age:                  menu.age,
      weight_kg:            menu.weightKg,
      height_cm:            menu.heightCm,
      gender:               menu.gender,
      vet_details:          menu.vetDetails,
      kcal_to_work:         menu.kcalToWork,
      macros:               menu.macros,
      portions:             menu.portions,
      templates_references: menu.templatesReferences,
      template_id:          menu.templateId  || null,
      menu_data:            menu.menuData,
      name:                 menu.name        || null,
      content:              menu.content     || null,
      ai_rationale:         menu.aiRationale || null,
    };
    const { data, error } = await supabase
      .from('menus')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMenu(id: string) {
    const { error } = await supabase.from('menus').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Patient Digital Tracking ───────────────────────────────────────────────

  async getPatientTracking(patientId: string, menuId: string): Promise<TrackingRow | null> {
    const { data, error } = await supabase
      .from('patient_digital_tracking')
      .select('*')
      .eq('patient_id', patientId)
      .eq('menu_id', menuId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id:            data.id,
      patientId:     data.patient_id,
      menuId:        data.menu_id,
      durationDays:  data.duration_days  ?? 28,
      menuStartDate: data.menu_start_date ?? null,
      menuEndDate:   data.menu_end_date   ?? null,
      trackingData:  data.tracking_data   ?? {},
      updatedAt:     data.updated_at,
    };
  },

  // Upsert de configuración: si ya existe solo actualiza duration_days (NO toca start/end/tracking)
  async savePatientTrackingConfig(patientId: string, menuId: string, durationDays: number): Promise<TrackingRow> {
    const { data: existing } = await supabase
      .from('patient_digital_tracking')
      .select('id')
      .eq('patient_id', patientId)
      .eq('menu_id', menuId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('patient_digital_tracking')
        .update({ duration_days: durationDays })
        .eq('patient_id', patientId)
        .eq('menu_id', menuId)
        .select()
        .single();
      if (error) throw error;
      return {
        id:            data.id,
        patientId:     data.patient_id,
        menuId:        data.menu_id,
        durationDays:  data.duration_days  ?? 28,
        menuStartDate: data.menu_start_date ?? null,
        menuEndDate:   data.menu_end_date   ?? null,
        trackingData:  data.tracking_data   ?? {},
        updatedAt:     data.updated_at,
      };
    } else {
      const { data, error } = await supabase
        .from('patient_digital_tracking')
        .insert({ patient_id: patientId, menu_id: menuId, duration_days: durationDays, tracking_data: {} })
        .select()
        .single();
      if (error) throw error;
      return {
        id:            data.id,
        patientId:     data.patient_id,
        menuId:        data.menu_id,
        durationDays:  data.duration_days  ?? 28,
        menuStartDate: data.menu_start_date ?? null,
        menuEndDate:   data.menu_end_date   ?? null,
        trackingData:  data.tracking_data   ?? {},
        updatedAt:     data.updated_at,
      };
    }
  },

  async extendPlanEndDate(patientId: string, menuId: string, newEndDate: string): Promise<void> {
    const { error } = await supabase
      .from('patient_digital_tracking')
      .update({ menu_end_date: newEndDate })
      .eq('patient_id', patientId)
      .eq('menu_id', menuId);
    if (error) throw error;
  },

  // ─── Evaluations (query directa — usada por store.initForUser) ────────────

  async getEvaluations(): Promise<PatientEvaluation[]> {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapEvaluationFromDb);
  },

  async getMenus(): Promise<GeneratedMenu[]> {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapMenuFromDb);
  },

  // ─── Patient Files (labs & photos) ─────────────────────────────────────────

  async getPatientFiles(patientId: string) {
    const { data, error } = await supabase
      .from('patient_files')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapFileFromDb);
  },

  async savePatientFile(file: {
    patientId: string;
    evaluationId: string | null;
    name: string;
    type: 'image' | 'pdf' | 'other';
    folder: 'photos' | 'labs';
    path: string;
    url: string;
    date: string;
    description?: string;
    labInterpretation?: string;
  }) {
    const { data, error } = await supabase
      .from('patient_files')
      .insert({
        patient_id:          file.patientId,
        evaluation_id:       file.evaluationId || null,
        name:                file.name,
        type:                file.type,
        folder:              file.folder,
        path:                file.path,
        url:                 file.url,
        date:                file.date,
        description:         file.description || '',
        lab_interpretation:  file.labInterpretation || '',
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapFileFromDb(data);
  },

  async updatePatientFile(id: string, patch: {
    evaluationId?: string | null;
    date?: string;
    name?: string;
    description?: string;
    labInterpretation?: string;   // ✅ campo de interpretación por archivo
  }) {
    const updateData: any = {};
    if (patch.evaluationId     !== undefined) updateData.evaluation_id      = patch.evaluationId;
    if (patch.date             !== undefined) updateData.date               = patch.date;
    if (patch.name             !== undefined) updateData.name               = patch.name;
    if (patch.description      !== undefined) updateData.description        = patch.description;
    if (patch.labInterpretation !== undefined) updateData.lab_interpretation = patch.labInterpretation;

    const { data, error } = await supabase
      .from('patient_files')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapFileFromDb(data);
  },

  async deletePatientFile(id: string, path: string) {
    // 1. Eliminar del Storage
    const { error: storageError } = await supabase.storage
      .from('patient-data')
      .remove([path]);
    if (storageError) console.warn('Error eliminando del Storage:', storageError);

    // 2. Eliminar de la tabla
    const { error } = await supabase.from('patient_files').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async getInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data.map(this.mapInvoiceFromDb);
  },

  async createInvoice(invoice: Omit<Invoice, 'id'>) {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        patient_id:   invoice.patientId || null,
        patient_name: invoice.patientName || null,
        date:         invoice.date,
        amount:       invoice.amount,
        status:       invoice.status,
        method:       invoice.method,
        type:         invoice.type ?? 'ingreso',
        category:     invoice.category,
        description:  invoice.description,
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapInvoiceFromDb(data);
  },

  async updateInvoice(id: string, invoice: Partial<Invoice>) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        amount:       invoice.amount,
        status:       invoice.status,
        method:       invoice.method,
        date:         invoice.date,
        patient_id:   invoice.patientId,
        patient_name: invoice.patientName,
        type:         invoice.type,
        category:     invoice.category,
        description:  invoice.description,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapInvoiceFromDb(data);
  },

  async deleteInvoice(id: string) {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Appointments ──────────────────────────────────────────────────────────

  async getAppointments(ownerId?: string): Promise<Appointment[]> {
    let query = supabase.from('appointments').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    return (data || []).map((d: any) => this.mapAppointmentFromDb(d));
  },

  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    // Plan limit: free users can have at most 20 appointments
    if (!authStore.isPro()) {
      const ownerId = appointment.ownerId;
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId);
      if (authStore.appointmentLimitReached(count ?? 0)) {
        throw new Error('PLAN_LIMIT_APPOINTMENTS');
      }
    }

    const insertData: any = {
      date:             appointment.date,
      time:             appointment.time,
      duration:         appointment.duration,
      type:             appointment.type,
      modality:         appointment.modality,
      status:           appointment.status,
      patient_name:     appointment.patientName,
      owner_id:         appointment.ownerId,
      phone:            appointment.phone ?? null,
      notes:            appointment.notes ?? null,
    };
    const { data, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAppointmentFromDb(data);
  },

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const updateData: any = {
      date:     appointment.date,
      time:     appointment.time,
      duration: appointment.duration,
      type:     appointment.type,
      modality: appointment.modality,
      status:   appointment.status,
    };
    if (appointment.patientName)         updateData.patient_name = appointment.patientName;
    if (appointment.ownerId)             updateData.owner_id     = appointment.ownerId;
    if (appointment.phone !== undefined) updateData.phone        = appointment.phone;
    if (appointment.notes !== undefined) updateData.notes        = appointment.notes;
    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAppointmentFromDb(data);
  },

  async deleteAppointment(id: string) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Menu References ───────────────────────────────────────────────────────

  async getMenuReferences(ownerId: string): Promise<MenuReferenceRecord[]> {
    const { data, error } = await supabase
      .from('menu_references')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapMenuReferenceFromDb);
  },

  async getMenuRecommendations(ownerId: string): Promise<MenuRecommendationRecord[]> {
    const { data, error } = await supabase
      .from('menu_recommendations')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapMenuRecommendationFromDb);
  },

  async saveMenuRecommendation(rec: Partial<MenuRecommendationRecord>) {
    const payload: any = {
      owner_id: rec.ownerId,
      name:     rec.name,
      data:     rec.data,
    };
    if (rec.id) payload.id = rec.id;

    const { data, error } = await supabase
      .from('menu_recommendations')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return this.mapMenuRecommendationFromDb(data);
  },

  async deleteMenuRecommendation(id: string) {
    const { error } = await supabase
      .from('menu_recommendations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async saveMenuReference(ref: Partial<MenuReferenceRecord>) {
    const payload: any = {
      owner_id: ref.ownerId,
      kcal:            ref.kcal,
      type:            ref.type,
      data:            ref.data,
    };
    if (ref.id) payload.id = ref.id;

    const { data, error } = await supabase
      .from('menu_references')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return this.mapMenuReferenceFromDb(data);
  },

  async deleteMenuReference(id: string) {
    const { error } = await supabase.from('menu_references').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Storage ───────────────────────────────────────────────────────────────

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  },

  async uploadPatientFile(userId: string, patientId: string, file: File, folder: 'photos' | 'labs') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${patientId}/${folder}/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('patient-data')
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from('patient-data')
      .getPublicUrl(fileName);
    return { path: fileName, signedUrl: data.publicUrl };
  },

  async uploadMenuLogo(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/menu-logo/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  },

  // ─── Menu Templates ────────────────────────────────────────────────────────

  async getDefaultMenuTemplate(ownerId: string) {
    const { data, error } = await supabase
      .from('menu_templates')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('is_default', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? this.mapMenuTemplateFromDb(data) : null;
  },

  async saveMenuTemplate(template: {
    id?: string;
    ownerId: string;
    name?: string;
    headerMode: 'default' | 'logo';
    logoUrl?: string;
    templateDesign: string;
    isDefault?: boolean;
    footerConfig?: import('../types').MenuFooterConfig;
    sectionTitles?: import('../types').MenuSectionTitles;
    visualTheme?: import('../types').VisualThemeConfig;
  }) {
    const payload: any = {
      owner_id:        template.ownerId,
      name:            template.name || 'Mi Plantilla',
      header_mode:     template.headerMode,
      logo_url:        template.logoUrl || null,
      template_design: template.templateDesign,
      is_default:      template.isDefault ?? true,
      footer_config:   template.footerConfig ?? null,
      section_titles:  template.sectionTitles ?? null,
      visual_theme:    template.visualTheme ?? null,
      updated_at:      new Date().toISOString(),
    };
    if (template.id) payload.id = template.id;

    const { data, error } = await supabase
      .from('menu_templates')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return this.mapMenuTemplateFromDb(data);
  },

  async deleteMenuTemplate(id: string) {
    const { error } = await supabase.from('menu_templates').delete().eq('id', id);
    if (error) throw error;
  },


  // ─── AI Rate Limits ────────────────────────────────────────────────────────

  async getAIRateLimit(userId: string) {
    const { data, error } = await supabase
      .from('ai_rate_limits')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createAIRateLimit(userId: string) {
    const { data, error } = await supabase.functions.invoke('create-ai-rate-limit', {
      body: { owner_id: userId }
    });

    if (error) throw error;
    return data;
  },

  // ─── Mappers ───────────────────────────────────────────────────────────────

  mapMenuTemplateFromDb(db: any) {
    return {
      id:             db.id,
      ownerId:        db.owner_id,
      name:           db.name,
      headerMode:     db.header_mode as 'default' | 'logo',
      logoUrl:        db.logo_url || undefined,
      templateDesign: db.template_design,
      isDefault:      db.is_default,
      footerConfig:   db.footer_config || undefined,
      sectionTitles:  db.section_titles || undefined,
      visualTheme:    db.visual_theme || undefined,
      createdAt:      db.created_at,
      updatedAt:      db.updated_at,
    };
  },

  mapPatientFromDb(dbPatient: any): Patient {
    return {
      id:         dbPatient.id,
      firstName:  dbPatient.first_name,
      lastName:   dbPatient.last_name,
      registeredAt: dbPatient.registered_at,
      clinical: {
        status:              dbPatient.status            || 'Sin Status',
        cui:                 dbPatient.cui               || '',
        birthdate:           dbPatient.birthdate         || '',
        age:                 dbPatient.age               || 0,
        sex:                 dbPatient.sex               || '',
        email:               dbPatient.email             || '',
        phone:               dbPatient.phone             || '',
        occupation:          dbPatient.occupation        || '',
        study:               dbPatient.study             || '',
        consultmotive:       dbPatient.consultmotive     || '',
        clinicalbackground:  dbPatient.clinicalbackground || '',
        diagnosis:           dbPatient.diagnosis         || '',
        familyHistory:       dbPatient.family_history    || '',
        medications:         dbPatient.medications       || '',
        supplements:         dbPatient.supplements       || '',
        allergies:           dbPatient.allergies         || '',
        regularPeriod:       dbPatient.regular_period    || '',
        periodDuration:      dbPatient.period_duration   || '',
        firstperiodage:      dbPatient.first_period_age  || '',
        menstrualOthers:     dbPatient.menstrual_others  || '',
        categ_discipline:    dbPatient.categ_discipline   || '',
        sport_age:           dbPatient.sport_age          || '',
        competencia:         dbPatient.competencia        || '',
        sleep_hours:         dbPatient.sleep_hours        || '',
        othersNotes:         dbPatient.others_notes       || '',
      },
      dietary: { preferences: dbPatient.dietary_preferences || '' },
      dietaryEvaluations: [],
      measurements:       [],
      bioimpedancias:     [],
      menus:              [],
      somatotypes:        [],
      sportsProfile:      dbPatient.sports_profile || [],
      labs:               [],
      photos:             [],
      portalActive:       dbPatient.portal_active  ?? false,
      accessToken:        dbPatient.access_token   ?? null,
      accessCode:         dbPatient.access_code    ?? null,
      portalGoal:         dbPatient.portal_goal    ?? null,
    };
  },

  mapFullPatientFromDb(dbPatient: any): Patient {
    const patient = this.mapPatientFromDb(dbPatient);

    if (dbPatient.evaluations) {
      dbPatient.evaluations.forEach((ev: any) => {

        // Measurements
        (ev.measurements || []).forEach((m: any) => {
          patient.measurements.push({
            id:                  m.id,
            linkedEvaluationId:  ev.id,
            date:                m.date,
            gender:              m.gender,
            age:                 m.age,
            weight:              m.weight,
            height:              m.height,
            metaComplied:        m.meta_complied,
            biceps:              m.biceps,
            triceps:             m.triceps,
            subscapular:         m.subscapular,
            supraspinal:         m.supraspinal,
            abdomen:             m.abdomen,
            thigh:               m.thigh,
            calf:                m.calf,
            iliacCrest:          m.iliac_crest,
            skinfoldSum:         m.skinfold_sum,
            wrist:               m.wrist,
            humerus:             m.humerus,
            femur:               m.femur,
            armRelaxed:          m.arm_relaxed,
            armContracted:       m.arm_contracted,
            calfGirth:           m.calf_girth,
            waist:               m.waist,
            umbilical:           m.umbilical,
            hip:                 m.hip,
            abdominalLow:        m.abdominal_low,
            thighRight:          m.thigh_right,
            thighLeft:           m.thigh_left,
            imc:                 m.imc,
            bodyFat:             m.body_fat_pct,
            fatKg:               m.fat_kg,
            leanMassKg:          m.lean_mass_kg,
            leanMassPct:         m.lean_mass_pct,
            aks:                 m.aks,
            boneMass:            m.bone_mass,
            residualMass:        m.residual_mass,
            muscleKg:            m.muscle_mass_kg,
            endomorfo:           m.endomorfo,
            mesomorfo:           m.mesomorfo,
            ectomorfo:           m.ectomorfo,
            x:                   m.x,
            y:                   m.y,
            diagnosticN:         m.diagnostic_n,
            subjectiveValuation: m.subjective_valuation,
          } as any);
        });

        // Bioimpedancia
        (ev.bioimpedancia_measurements || []).forEach((b: any) => {
          patient.bioimpedancias.push(this.mapBioimpedanciaFromDb(b, ev.id));
        });

        // Dietary evaluations
        (ev.dietary_evaluations || []).forEach((de: any) => {
          patient.dietaryEvaluations.push({
            id:                  de.id,
            linkedEvaluationId:  ev.id,
            date:                de.date,
            mealsPerDay:         de.meals_per_day,
            excludedFoods:       de.excluded_foods,
            notes:               de.notes,
            recall:              de.recall_24h,
            foodFrequency:       de.food_frequency?.entries || (Array.isArray(de.food_frequency) ? de.food_frequency : []),
            foodFrequencyOthers: de.food_frequency?.other || '',
          });
        });

        // Somatotypes
        (ev.somatotypes || []).forEach((s: any) => {
          patient.somatotypes.push({
            id:                 s.id,
            linkedEvaluationId: ev.id,
            date:               s.date,
            x:                  s.x,
            y:                  s.y,
          });
        });

        // Menus
        (ev.menus || []).forEach((menu: any) => {
          patient.menus.push(this.mapMenuFromDb(menu));
        });
      });
    }

    return patient;
  },

  // ✅ mapper para patient_files — incluye lab_interpretation
  mapFileFromDb(dbFile: any) {
    return {
      id:                 dbFile.id,
      name:               dbFile.name,
      type:               dbFile.type,
      folder:             dbFile.folder,
      path:               dbFile.path,
      url:                dbFile.url,
      date:               dbFile.date,
      description:        dbFile.description        || '',
      labInterpretation:  dbFile.lab_interpretation || '',   // ✅
      linkedEvaluationId: dbFile.evaluation_id      || null,
    };
  },

  mapBioimpedanciaFromDb(db: any, evaluationId: string): BioimpedanciaRecord {
    return {
      id:              db.id,
      evaluation_id:   evaluationId,
      owner_id:        db.owner_id,
      date:            db.date,
      gender:          db.gender || '',
      age:             db.age ?? null,
      weight:          db.weight,
      height:          db.height,
      imc:             db.imc,
      body_fat_pct:    db.body_fat_pct,
      water_pct:       db.water_pct,
      muscle_mass:     db.muscle_mass,
      physique_rating: db.physique_rating || '',
      visceral_fat:    db.visceral_fat,
      bone_mass:       db.bone_mass,
      bmr:             db.bmr,
      metabolic_age:   db.metabolic_age,
      meta_complied:   db.meta_complied,
      armRelaxed:      db.armRelaxed,
      armContracted:   db.armContracted,
      calfGirth:       db.calfGirth,
      waist:           db.waist,
      umbilical:       db.umbilical,
      hip:             db.hip,
      abdominalLow:    db.abdominalLow,
      thighRight:      db.thighRight,
      thighLeft:       db.thighLeft,
      created_at:      db.created_at,
    };
  },

  mapMenuFromDb(menu: any): GeneratedMenu {
    return {
      id:                  menu.id,
      linkedEvaluationId:  menu.evaluation_id,
      patientId:           menu.patient_id,
      date:                menu.date,
      age:                 menu.age,
      weightKg:            menu.weight_kg,
      heightCm:            menu.height_cm,
      gender:               menu.gender,
      vetDetails:          menu.vet_details,
      kcalToWork:          menu.kcal_to_work,
      macros:              menu.macros,
      portions:            menu.portions,
      templatesReferences: menu.templates_references,
      templateId:          menu.template_id  || null,
      menuData:            menu.menu_data,
      name:                menu.name,
      content:             menu.content,
      aiRationale:         menu.ai_rationale,
      menuPreviewData:     menu.menu_preview_data,
      createdAt:           menu.created_at,
    };
  },

  mapEvaluationFromDb(db: any): PatientEvaluation {
    return {
      id:        db.id,
      patientId: db.patient_id,
      date:      db.date,
      title:     db.title,
      createdAt: db.created_at,
      notes:     db.notes,
    };
  },

  mapInvoiceFromDb(db: any): Invoice {
    return {
      id:          db.id,
      patientId:   db.patient_id,
      patientName: db.patient_name || '',
      date:        db.date,
      amount:      db.amount,
      status:      db.status,
      method:      db.method,
      type:        db.type ?? 'ingreso',
      category:    db.category,
      description: db.description,
    };
  },

  mapAppointmentFromDb(db: any): Appointment {
    return {
      id:             db.id,
      patientName:    db.patient_name || 'Paciente',
      date:           db.date,
      time:           db.time,
      duration:       db.duration,
      type:           db.type,
      modality:       db.modality,
      status:         db.status,
      phone:          db.phone        ?? undefined,
      notes:          db.notes        ?? undefined,
      ownerId:        db.owner_id,
      receptionistId: db.receptionist_id,
      googleEventId:  db.google_event_id ?? undefined,
      reminderSent:   db.reminder_sent ?? false,
      reminderSentAt: db.reminder_sent_at ?? undefined,
    };
  },

  async updateAppointmentReminder(id: string, sent: boolean): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({
        reminder_sent: sent,
        reminder_sent_at: sent ? new Date().toISOString() : null,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async updateAppointmentGoogleEventId(id: string, googleEventId: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ google_event_id: googleEventId })
      .eq('id', id);
    if (error) throw error;
  },

  mapMenuReferenceFromDb(db: any): MenuReferenceRecord {
    return {
      id:             db.id,
      ownerId:  db.owner_id,
      kcal:           db.kcal,
      type:           db.type,
      data:           db.data,
      createdAt:      db.created_at,
    };
  },

  mapMenuRecommendationFromDb(db: any): MenuRecommendationRecord {
    return {
      id:        db.id,
      ownerId:   db.owner_id,
      name:      db.name,
      data:      db.data,
      createdAt: db.created_at,
    };
  },

  mapProfileFromDb(db: any): UserProfile {
    return {
      name:              db.name || '',
      email:             db.email || '',
      professionalTitle: db.professional_title,
      specialty:         db.specialty || '',
      licenseNumber:     db.license_number,
      avatar:            db.avatar,
      timezone:          db.timezone,
      phone:             db.phone || '',
      menuAIConfig:      db.menu_ai_config,
    };
  },
};