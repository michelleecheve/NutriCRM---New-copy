# CLAUDE.md — NutriFlow CRM

Guía de referencia completa para el desarrollo de este proyecto. Leer antes de cualquier tarea.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19.2.4 + TypeScript (ES2022) |
| Build | Vite 6.2.0 |
| Estilos | Tailwind CSS (vía CDN) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| IA | Google Gemini API (`@google/genai`) |
| PDF | jsPDF + jspdf-autotable |
| Gráficas | Recharts |
| Iconos | Lucide React |

---

## Estructura de archivos

```
NutriCRM---New-copy/
├── App.tsx                        # Router principal + estado de auth
├── index.tsx                      # Entry point React
├── index.html                     # HTML base
├── types.ts                       # 39 interfaces/enums TypeScript
├── vite.config.ts                 # Config Vite (port 3000, env vars)
├── pages/                         # 11 rutas de la app
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── MainPanel.tsx              # Panel principal nutricionista
│   ├── MainPanelReceptionist.tsx  # Panel recepcionista
│   ├── Dashboard.tsx              # Analíticas (admin)
│   ├── PatientDetail.tsx          # Ficha completa del paciente
│   ├── Calendar.tsx               # Agenda de citas
│   ├── Menus.tsx                  # Diseño y generación de menús
│   ├── Payments.tsx               # Facturas y cobros
│   ├── Profile.tsx                # Configuración de perfil
│   └── Admin.tsx                  # Panel de administración
├── components/
│   ├── Layout.tsx                 # Sidebar + navegación con roles
│   ├── patient/                   # ~30 componentes por tab de paciente
│   ├── menus_components/          # Menús, IA, plantillas, exportar PDF
│   ├── calendar_components/       # Calendario de citas
│   └── profile_config/            # Configuración de usuario
└── services/
    ├── supabaseService.ts         # CRUD Supabase (~1,130 líneas)
    ├── authStore.tsx              # Auth + roles + estado global (~619 líneas)
    ├── store.ts                   # Cache localStorage por usuario (~725 líneas)
    ├── geminiService.ts           # Integración Google Gemini AI (~566 líneas)
    ├── MeasurementsFormulas.ts    # Fórmulas antropométricas (IMC, grasa, macros)
    ├── aiService.ts               # Helpers de IA
    ├── imageUtils.ts              # Procesamiento de imágenes (base64)
    └── supabase.ts                # Instancia del cliente Supabase
```

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| `admin` | Acceso completo a todo el sistema |
| `nutricionista` | Pacientes, evaluaciones, menús, citas, facturas |
| `recepcionista` | Solo agenda de citas (vista limitada) |

- Los roles se definen en `profiles.role` (enum USER-DEFINED en Supabase)
- `profile_links` vincula a una recepcionista con su nutricionista
- La navegación del sidebar se filtra por rol en `Layout.tsx`

---

## Schema de base de datos (Supabase)

### Entidad central: `evaluations`
Casi todas las tablas clínicas se vinculan a `evaluations` via `evaluation_id`.

```
evaluations
├── id (uuid, PK)
├── owner_id (uuid → profiles.id)
├── patient_id (uuid → patients.id)
├── date (date)
├── title (text)
├── notes (text)
└── created_at (timestamptz)
```

### `patients`
```
id, owner_id, first_name, last_name, age, birthdate, sex, email, phone, cui,
occupation, study, status, dietary_preferences, consultmotive,
clinicalbackground, diagnosis, family_history, medications, supplements,
allergies, regular_period, period_duration, first_period_age, menstrual_others,
categ_discipline, sport_age, competencia, sleep_hours, others_notes,
sports_profile (jsonb), registered_at, created_at,
access_token (uuid), access_code (text), portal_active (boolean)
```

### `measurements` (Antropometría — snake_case)
```
id, owner_id, evaluation_id, date, weight, height, imc, age, gender,
biceps, triceps, subscapular, supraspinal, abdomen, thigh, calf, iliac_crest,
skinfold_sum, humerus, femur, wrist, arm_relaxed, arm_contracted,
waist, umbilical, hip, abdominal_low, thigh_right, thigh_left, calf_girth,
body_fat_pct, lean_mass_pct, lean_mass_kg, fat_kg, muscle_mass_kg,
bone_mass, residual_mass, endomorfo, mesomorfo, ectomorfo,
x, y, aks, diagnostic_n, subjective_valuation,
meta_complied (boolean), created_at
```

### `bioimpedancia_measurements` (⚠️ columnas en camelCase)
```
id, owner_id, evaluation_id, date, weight, height, imc, age, gender,
body_fat_pct, water_pct, muscle_mass, bone_mass, visceral_fat,
bmr, metabolic_age, physique_rating,
waist, umbilical, hip, thighLeft, thighRight, abdominalLow,
calfGirth, armRelaxed, armContracted,
meta_complied (text), created_at
```
> ⚠️ Esta tabla usa camelCase (thighLeft, armRelaxed, etc.) a diferencia del resto que usa snake_case.

### `dietary_evaluations`
```
id, owner_id, evaluation_id, date,
recall_24h (jsonb), food_frequency (jsonb),
meals_per_day, excluded_foods, notes, created_at
```

### `somatotypes`
```
id, evaluation_id, date, x (numeric), y (numeric), created_at
```

### `menus`
```
id, patient_id, evaluation_id, date, name, age, gender,
weight_kg, height_cm, kcal_to_work,
vet_details (jsonb), macros (jsonb), portions (jsonb), menu_data (jsonb),
templates_references, template_id (text, default 'plantilla_v1'),
content, ai_rationale, created_at
```
> ⚠️ `menus` no tiene `owner_id` propio — se infiere via `patient_id` o `evaluation_id`.

### `menu_templates`
```
id, owner_id, name, template_design, header_mode, logo_url,
is_default (boolean), footer_config (jsonb), created_at, updated_at
```

### `menu_references`
```
id, owner_id, type, kcal (integer), data (jsonb), created_at
```

### `menu_recommendations`
```
id, owner_id, name, data (jsonb), created_at
```

### `patient_digital_tracking`
```
id, patient_id (uuid → patients.id), menu_id (uuid → menus.id),
tracking_data (jsonb, default '{}'), updated_at
```

### `patient_files`
```
id, patient_id, evaluation_id, name, type, folder,
url, path, date (text), description, lab_interpretation, created_at
```

### `appointments`
```
id, owner_id, patient_id, patient_name, date, time,
duration (integer, minutos), type, modality,
status (USER-DEFINED enum), created_at
```

### `invoices`
```
id, owner_id, patient_id, patient_name, date,
amount (numeric), status (USER-DEFINED enum), method, created_at
```

### `profiles`
```
id, name, email, contact_email, personal_phone, phone,
role (USER-DEFINED: admin | nutricionista | recepcionista),
specialty, professional_title, license_number, address, avatar,
instagram_handle, website, timezone, link_code,
menu_ai_config (jsonb), lab_ai_prompt (text),
patient_statuses (ARRAY), country, date_of_birth (date), created_at
```

### `profile_links`
```
id, nutritionist_id (uuid → profiles.id),
receptionist_id (uuid → profiles.id), created_at
```

### `ai_prompts` (log de llamadas IA)
```
id, owner_id, model, category,
prompt (jsonb), response (jsonb),
tokens (integer), cost (numeric), duration_ms (integer), created_at
```

### `ai_rate_limits`
```
id, owner_id, tokens, max_tokens,
max_requests_per_minute, reset_at, created_at
```

---

## Arquitectura y patrones

### Flujo de datos
```
Pages → Components → Services (supabaseService.ts) → Supabase
                   ↘ store.ts (cache localStorage)
```

### State management
- **`authStore.tsx`**: Estado global de autenticación y rol del usuario (Supabase Auth)
- **`store.ts`**: Cache local con localStorage, claves por usuario: `nutriflow_${key}_v1_${userId}`
- Sin Redux ni Context API — state management propio y ligero

### Caché local
Las claves de localStorage siguen el patrón: `nutriflow_${entidad}_v1_${userId}`
Esto permite multi-usuario en el mismo navegador.

### Integración IA (Gemini)
- Generación de planes alimentarios configurable por usuario (`menu_ai_config` en `profiles`)
- Interpretación de resultados de laboratorio (`lab_ai_prompt` en `profiles`)
- Todo log de llamadas se guarda en `ai_prompts`
- Límites de uso en `ai_rate_limits`

---

## Funcionalidades principales

1. **Ficha de paciente** — Historia clínica, datos personales, antecedentes, perfil deportivo, datos menstruales
2. **Evaluaciones** — Entidad que agrupa mediciones, dieta, bioimpedancia, menú y archivos de una consulta
3. **Antropometría** — Pliegues, perímetros, diámetros, composición corporal, somatotipo (carta XY)
4. **Bioimpedancia** — Grasa, músculo, agua, masa ósea, grasa visceral, edad metabólica, TMB
5. **Evaluación dietética** — Recordatorio 24h, frecuencia alimentaria, comidas por día
6. **Generación de menús con IA** — Gemini genera plan alimentario; plantillas PDF exportables
7. **Archivos de paciente** — Fotos, laboratorios (con interpretación IA), documentos
8. **Calendario de citas** — Agenda por nutricionista, modalidad, duración, estado
9. **Facturación** — Control de pagos con método y estado
10. **Dashboard** — Analíticas con gráficas Recharts
11. **Administración** — Panel admin con gestión de usuarios

---

## Consideraciones de desarrollo

- Las variables de entorno Supabase y Gemini se definen en `.env` y se exponen via Vite
- Los formularios de mediciones y bioimpedancia son extensos — revisar las columnas exactas del schema antes de modificar
- `bioimpedancia_measurements` usa **camelCase** en columnas de medidas corporales (inconsistencia histórica — no cambiar sin migración)
- `menus.menu_data` es un JSONB con la estructura completa del menú generado por IA
- `patients.sports_profile` es JSONB con datos deportivos estructurados
- Los enums `USER-DEFINED` de Supabase (status en appointments/invoices, role en profiles) requieren valores exactos — verificar en Supabase antes de insertar
- El puerto de desarrollo es **3000** (definido en `vite.config.ts`)
