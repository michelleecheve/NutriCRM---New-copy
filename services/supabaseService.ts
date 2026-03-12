import { supabase } from './supabase';
import { 
  Patient, 
  PatientEvaluation, 
  MeasurementRecord, 
  DietaryEvaluation, 
  GeneratedMenu, 
  Appointment, 
  Invoice, 
  UserProfile,
  SomatotypeRecord
} from '../types';

/**
 * Service to interact with Supabase database.
 * Handles mapping between local types and relational database tables.
 */
export const supabaseService = {
  // --- Profiles ---
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
    if (profile.name) updateData.name = profile.name;
    if (profile.timezone) updateData.timezone = profile.timezone;
    if (profile.professionalTitle) updateData.professional_title = profile.professionalTitle;
    if (profile.specialty) updateData.specialty = profile.specialty;
    if (profile.licenseNumber) updateData.license_number = profile.licenseNumber;
    if (profile.avatar) updateData.avatar = profile.avatar;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  },

  // --- Patients ---
  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapPatientFromDb);
  },

  async getPatientById(id: string) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        evaluations (
          *,
          measurements (*),
          dietary_evaluations (*),
          somatotypes (*),
          menus (*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return this.mapFullPatientFromDb(data);
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        first_name: patient.firstName,
        last_name: patient.lastName,
        registered_at: patient.registeredAt,
        dietary_preferences: patient.dietary.preferences,
        // Clinical data as columns
        status: patient.clinical.status,
        cui: patient.clinical.cui,
        birthdate: patient.clinical.birthdate,
        age: patient.clinical.age,
        sex: patient.clinical.sex,
        email: patient.clinical.email,
        phone: patient.clinical.phone,
        occupation: patient.clinical.occupation,
        study: patient.clinical.study,
        consultmotive: patient.clinical.consultmotive,
        clinicalbackground: patient.clinical.clinicalbackground,
        diagnosis: patient.clinical.diagnosis,
        family_history: patient.clinical.familyHistory,
        medications: patient.clinical.medications,
        supplements: patient.clinical.supplements,
        allergies: patient.clinical.allergies,
        regular_period: patient.clinical.regularPeriod,
        period_duration: patient.clinical.periodDuration,
        first_period_age: patient.clinical.firstperiodage,
        menstrual_others: patient.clinical.menstrualOthers,
        sports_profile: (patient.sportsProfile || []).map(({ patientId, ...rest }: any) => rest)
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapPatientFromDb(data);
  },

  async updatePatient(id: string, patient: Partial<Patient>) {
    const updateData: any = {};
    if (patient.firstName) updateData.first_name = patient.firstName;
    if (patient.lastName) updateData.last_name = patient.lastName;
    if (patient.dietary?.preferences) updateData.dietary_preferences = patient.dietary.preferences;
    
    if (patient.clinical) {
      const c = patient.clinical;
      if (c.status !== undefined) updateData.status = c.status;
      if (c.cui !== undefined) updateData.cui = c.cui;
      if (c.birthdate !== undefined) updateData.birthdate = c.birthdate;
      if (c.age !== undefined) updateData.age = c.age;
      if (c.sex !== undefined) updateData.sex = c.sex;
      if (c.email !== undefined) updateData.email = c.email;
      if (c.phone !== undefined) updateData.phone = c.phone;
      if (c.occupation !== undefined) updateData.occupation = c.occupation;
      if (c.study !== undefined) updateData.study = c.study;
      if (c.consultmotive !== undefined) updateData.consultmotive = c.consultmotive;
      if (c.clinicalbackground !== undefined) updateData.clinicalbackground = c.clinicalbackground;
      if (c.diagnosis !== undefined) updateData.diagnosis = c.diagnosis;
      if (c.familyHistory !== undefined) updateData.family_history = c.familyHistory;
      if (c.medications !== undefined) updateData.medications = c.medications;
      if (c.supplements !== undefined) updateData.supplements = c.supplements;
      if (c.allergies !== undefined) updateData.allergies = c.allergies;
      if (c.regularPeriod !== undefined) updateData.regular_period = c.regularPeriod;
      if (c.periodDuration !== undefined) updateData.period_duration = c.periodDuration;
      if (c.firstperiodage !== undefined) updateData.first_period_age = c.firstperiodage;
      if (c.menstrualOthers !== undefined) updateData.menstrual_others = c.menstrualOthers;
    }

    if (patient.sportsProfile !== undefined) {
      // Limpiar patientId redundante antes de guardar
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

  async deletePatient(id: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- Evaluations ---
  async getEvaluations() {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapEvaluationFromDb);
  },

  async createEvaluation(patientId: string, date: string, title: string) {
    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        patient_id: patientId,
        date,
        title
      })
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
    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- Measurements ---
  async saveMeasurement(evaluationId: string, measurement: MeasurementRecord) {
    const { data, error } = await supabase
      .from('measurements')
      .upsert({
        evaluation_id: evaluationId,
        date: measurement.date,
        gender: measurement.gender,
        age: measurement.age,
        weight: measurement.weight,
        height: measurement.height,
        meta_complied: measurement.metaComplied,
        biceps: measurement.biceps,
        triceps: measurement.triceps,
        subscapular: measurement.subscapular,
        supraspinal: measurement.supraspinal,
        abdomen: measurement.abdomen,
        thigh: measurement.thigh,
        calf: measurement.calf,
        iliac_crest: measurement.iliacCrest,
        skinfold_sum: measurement.skinfoldSum,
        wrist: measurement.wrist,
        arm_contracted: measurement.armContracted,
        calf_girth: measurement.calfGirth,
        waist: measurement.waist,
        umbilical: measurement.umbilical,
        hip: measurement.hip,
        abdominal_low: measurement.abdominalLow,
        thigh_right: measurement.thighRight,
        thigh_left: measurement.thighLeft,
        imc: measurement.imc,
        body_fat_pct: measurement.bodyFat,
        fat_kg: measurement.fatKg,
        lean_mass_kg: measurement.leanMassKg,
        lean_mass_pct: measurement.leanMassPct,
        aks: measurement.aks,
        bone_mass: measurement.boneMass,
        residual_mass: measurement.residualMass,
        muscle_mass_kg: measurement.muscleKg,
        endomorfo: measurement.endomorfo,
        mesomorfo: measurement.mesomorfo,
        ectomorfo: measurement.ectomorfo,
        x: measurement.x,
        y: measurement.y,
        diagnostic_n: measurement.diagnosticN,
        subjective_valuation: measurement.subjectiveValuation
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMeasurement(evaluationId: string) {
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('evaluation_id', evaluationId);
    
    if (error) throw error;
  },

  // --- Dietary Evaluations ---
  async saveDietaryEvaluation(evaluationId: string, dietary: DietaryEvaluation) {
    const { data, error } = await supabase
      .from('dietary_evaluations')
      .upsert({
        evaluation_id: evaluationId,
        date: dietary.date,
        meals_per_day: dietary.mealsPerDay,
        excluded_foods: dietary.excludedFoods,
        notes: dietary.notes,
        recall_24h: dietary.recall,
        food_frequency: dietary.foodFrequency
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteDietaryEvaluation(evaluationId: string) {
    const { error } = await supabase
      .from('dietary_evaluations')
      .delete()
      .eq('evaluation_id', evaluationId);
    
    if (error) throw error;
  },

  async saveSomatotype(evaluationId: string, record: SomatotypeRecord) {
    const { data, error } = await supabase
      .from('somatotypes')
      .upsert({
        evaluation_id: evaluationId,
        date: record.date,
        x: record.x,
        y: record.y
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSomatotype(evaluationId: string) {
    const { error } = await supabase
      .from('somatotypes')
      .delete()
      .eq('evaluation_id', evaluationId);
    
    if (error) throw error;
  },

  async deleteMenu(id: string) {
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- Menus ---
  async saveMenu(evaluationId: string, menu: GeneratedMenu) {
    const { data, error } = await supabase
      .from('menus')
      .upsert({
        evaluation_id: evaluationId,
        patient_id: menu.patientId,
        date: menu.date,
        age: menu.age,
        weight_kg: menu.weightKg,
        height_cm: menu.heightCm,
        gender: menu.gender,
        vet_details: menu.vetDetails,
        kcal_to_work: menu.kcalToWork,
        macros: menu.macros,
        portions: menu.portions,
        templates_references: menu.templatesReferences,
        menu_data: menu.menuData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateInvoice(id: string, invoice: Partial<Invoice>) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        amount: invoice.amount,
        status: invoice.status,
        method: invoice.method,
        date: invoice.date
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapInvoiceFromDb(data);
  },

  async deleteInvoice(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- Appointments ---
  async getAppointments(nutritionistId?: string): Promise<Appointment[]> {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients (
          first_name,
          last_name
        )
      `);
    
    if (nutritionistId) {
      query = query.eq('nutritionist_id', nutritionistId);
    }

    const { data, error } = await query
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(d => this.mapAppointmentFromDb(d));
  },

  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const insertData: any = {
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      type: appointment.type,
      modality: appointment.modality,
      status: appointment.status,
      patient_name: appointment.patientName,
      nutritionist_id: appointment.nutritionistId
    };

    if (appointment.patientId && appointment.patientId !== 'guest') {
      insertData.patient_id = appointment.patientId;
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select(`
        *,
        patients (
          first_name,
          last_name
        )
      `)
      .single();
    
    if (error) throw error;
    return this.mapAppointmentFromDb(data);
  },

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const updateData: any = {
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      type: appointment.type,
      modality: appointment.modality,
      status: appointment.status
    };

    if (appointment.patientName) {
      updateData.patient_name = appointment.patientName;
    }

    if (appointment.nutritionistId) {
      updateData.nutritionist_id = appointment.nutritionistId;
    }

    if (appointment.patientId && appointment.patientId !== 'guest') {
      updateData.patient_id = appointment.patientId;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patients (
          first_name,
          last_name
        )
      `)
      .single();
    
    if (error) throw error;
    return this.mapAppointmentFromDb(data);
  },

  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- Invoices ---
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
        patient_id: invoice.patientId,
        date: invoice.date,
        amount: invoice.amount,
        status: invoice.status,
        method: invoice.method
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapInvoiceFromDb(data);
  },

  // --- Mappers ---
  mapPatientFromDb(dbPatient: any): Patient {
    return {
      id: dbPatient.id,
      firstName: dbPatient.first_name,
      lastName: dbPatient.last_name,
      registeredAt: dbPatient.registered_at,
      clinical: {
        status: dbPatient.status || '',
        cui: dbPatient.cui || '',
        birthdate: dbPatient.birthdate || '',
        age: dbPatient.age || 0,
        sex: dbPatient.sex || '',
        email: dbPatient.email || '',
        phone: dbPatient.phone || '',
        occupation: dbPatient.occupation || '',
        study: dbPatient.study || '',
        consultmotive: dbPatient.consultmotive || '',
        clinicalbackground: dbPatient.clinicalbackground || '',
        diagnosis: dbPatient.diagnosis || '',
        familyHistory: dbPatient.family_history || '',
        medications: dbPatient.medications || '',
        supplements: dbPatient.supplements || '',
        allergies: dbPatient.allergies || '',
        regularPeriod: dbPatient.regular_period || '',
        periodDuration: dbPatient.period_duration || '',
        firstperiodage: dbPatient.first_period_age || '',
        menstrualOthers: dbPatient.menstrual_others || '',
      },
      dietary: {
        preferences: dbPatient.dietary_preferences || ''
      },
      dietaryEvaluations: [],
      measurements: [],
      menus: [],
      somatotypes: [],
      sportsProfile: dbPatient.sports_profile || [],
      labs: [],
      photos: []
    };
  },

  mapFullPatientFromDb(dbPatient: any): Patient {
    const patient = this.mapPatientFromDb(dbPatient);
    
    if (dbPatient.evaluations) {
      dbPatient.evaluations.forEach((ev: any) => {
        if (ev.measurements) {
          ev.measurements.forEach((m: any) => {
            patient.measurements.push({
              id: m.id,
              linkedEvaluationId: ev.id,
              date: m.date,
              gender: m.gender,
              age: m.age,
              weight: m.weight,
              height: m.height,
              metaComplied: m.meta_complied,
              biceps: m.biceps,
              triceps: m.triceps,
              subscapular: m.subscapular,
              supraspinal: m.supraspinal,
              abdomen: m.abdomen,
              thigh: m.thigh,
              calf: m.calf,
              iliacCrest: m.iliac_crest,
              skinfoldSum: m.skinfold_sum,
              wrist: m.wrist,
              armContracted: m.arm_contracted,
              calfGirth: m.calf_girth,
              waist: m.waist,
              umbilical: m.umbilical,
              hip: m.hip,
              abdominalLow: m.abdominal_low,
              thighRight: m.thigh_right,
              thighLeft: m.thigh_left,
              imc: m.imc,
              bodyFat: m.body_fat_pct,
              fatKg: m.fat_kg,
              leanMassKg: m.lean_mass_kg,
              leanMassPct: m.lean_mass_pct,
              aks: m.aks,
              boneMass: m.bone_mass,
              residualMass: m.residual_mass,
              muscleKg: m.muscle_mass_kg,
              endomorfo: m.endomorfo,
              mesomorfo: m.mesomorfo,
              ectomorfo: m.ectomorfo,
              x: m.x,
              y: m.y,
              diagnosticN: m.diagnostic_n,
              subjectiveValuation: m.subjective_valuation
            } as any);
          });
        }
        
        if (ev.dietary_evaluations) {
          ev.dietary_evaluations.forEach((de: any) => {
            patient.dietaryEvaluations.push({
              id: de.id,
              linkedEvaluationId: ev.id,
              date: de.date,
              mealsPerDay: de.meals_per_day,
              excludedFoods: de.excluded_foods,
              notes: de.notes,
              recall: de.recall_24h,
              foodFrequency: de.food_frequency,
              foodFrequencyOthers: de.food_frequency_others
            });
          });
        }

        if (ev.somatotypes) {
          ev.somatotypes.forEach((s: any) => {
            patient.somatotypes.push({
              id: s.id,
              linkedEvaluationId: ev.id,
              date: s.date,
              x: s.x,
              y: s.y
            });
          });
        }
        
        if (ev.menus) {
          ev.menus.forEach((menu: any) => {
            patient.menus.push({
              id: menu.id,
              linkedEvaluationId: ev.id,
              patientId: menu.patient_id,
              date: menu.date,
              age: menu.age,
              weightKg: menu.weight_kg,
              heightCm: menu.height_cm,
              gender: menu.gender,
              vetDetails: menu.vet_details,
              kcalToWork: menu.kcal_to_work,
              macros: menu.macros,
              portions: menu.portions,
              templatesReferences: menu.templates_references,
              menuData: menu.menu_data,
              name: menu.name,
              content: menu.content,
              aiRationale: menu.ai_rationale
            });
          });
        }
      });
    }
    
    return patient;
  },

  mapAppointmentFromDb(dbAppt: any): Appointment {
    // Priorizar el nombre guardado directamente en la cita
    const patientName = dbAppt.patient_name || (dbAppt.patients 
      ? `${dbAppt.patients.first_name} ${dbAppt.patients.last_name}`
      : 'Paciente Desconocido');

    return {
      id: dbAppt.id,
      patientId: dbAppt.patient_id,
      patientName,
      date: dbAppt.date,
      time: dbAppt.time,
      duration: dbAppt.duration,
      type: dbAppt.type,
      modality: dbAppt.modality,
      status: dbAppt.status
    };
  },

  mapInvoiceFromDb(dbInvoice: any): Invoice {
    return {
      id: dbInvoice.id,
      patientId: dbInvoice.patient_id,
      patientName: '', // Should be joined or fetched separately
      date: dbInvoice.date,
      amount: dbInvoice.amount,
      status: dbInvoice.status,
      method: dbInvoice.method
    };
  },

  mapEvaluationFromDb(dbEv: any): PatientEvaluation {
    return {
      id: dbEv.id,
      patientId: dbEv.patient_id,
      date: dbEv.date,
      title: dbEv.title
    };
  },

  // --- Storage ---
  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async uploadPatientFile(userId: string, patientId: string, file: File, folder: 'photos' | 'labs') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${patientId}/${folder}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('patient-data')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // For private buckets, we need to create a signed URL or use a proxy
    // For now, we'll return the path and handle signed URLs when needed
    const { data, error } = await supabase.storage
      .from('patient-data')
      .createSignedUrl(filePath, 60 * 60); // 1 hour

    if (error) throw error;
    return { path: filePath, signedUrl: data.signedUrl };
  }
};
