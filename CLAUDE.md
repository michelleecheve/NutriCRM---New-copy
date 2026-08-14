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
| PDF | jsPDF + jspdf-autotable |
| Gráficas | Recharts |
| Iconos | Lucide React |

> ⚠️ La integración con Google Gemini AI fue eliminada del proyecto. No existe `geminiService.ts`, `aiService.ts`, `ai_prompts` ni `ai_rate_limits`. No sugerir nada relacionado con IA.

---

## Estructura de archivos

```
NutriCRM---New-copy/
├── App.tsx                        # Router principal + estado de auth
├── index.tsx                      # Entry point React
├── index.html                     # HTML base
├── types.ts                       # Interfaces/enums TypeScript
├── vite.config.ts                 # Config Vite (port 3000, env vars)
├── pages/                         # Rutas de la app
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
│   ├── menus_components/          # Menús, plantillas, exportar PDF
│   ├── calendar_components/       # Calendario de citas
│   └── profile_config/            # Configuración de usuario
└── services/
    ├── supabaseService.ts         # CRUD Supabase
    ├── authStore.tsx              # Auth + roles + estado global
    ├── store.ts                   # Cache localStorage por usuario
    ├── MeasurementsFormulas.ts    # Fórmulas antropométricas (IMC, grasa, macros)
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

> ⚠️ Este schema fue verificado directamente desde Supabase el 2026-07-03. Es la fuente de verdad. Ante cualquier duda de si una columna existe, confiar en este listado.
>
> 🔔 **IMPORTANTE para Claude:** Cada vez que se agregue, elimine o modifique una tabla o columna en Supabase, recordarle a la usuaria que actualice este archivo con los cambios. El schema desactualizado causó bugs graves (ej: `menu_preview_data` jul 2026).

### Entidad central: `evaluations`
Casi todas las tablas clínicas se vinculan a `evaluations` via `evaluation_id`.

```
id (uuid, PK), owner_id (uuid → profiles.id), patient_id (uuid → patients.id),
date (date), title (text), notes (text), created_at (timestamptz)
```

### `patients`
```
id, owner_id, first_name, last_name, age, birthdate, sex, email, phone, cui,
occupation, study, status, dietary_preferences, consultmotive,
clinicalbackground, diagnosis, family_history, medications, supplements,
allergies, regular_period, period_duration, first_period_age, menstrual_others,
categ_discipline, sport_age, competencia, sleep_hours, others_notes,
sports_profile (jsonb, default '[]'), registered_at, created_at,
access_token (uuid), access_code (text), portal_active (boolean, default false),
portal_goal (text), portal_show_measurements_detail (boolean),
portal_measurements_config (jsonb), portal_pin_active (boolean)
```

### `measurements` (Antropometría — snake_case)
```
id, owner_id, evaluation_id, patient_id, date, weight, height, imc, age, gender,
biceps, triceps, subscapular, supraspinal, abdomen, thigh, calf, iliac_crest,
skinfold_sum, humerus, femur, wrist, arm_relaxed, arm_contracted,
waist, umbilical, hip, abdominal_low, thigh_right, thigh_left, calf_girth,
body_fat_pct, lean_mass_pct, lean_mass_kg, fat_kg, muscle_mass_kg,
bone_mass, residual_mass, endomorfo, mesomorfo, ectomorfo,
x, y, aks, meta_complied (boolean), notes, created_at
```
> ⚠️ Las columnas `diagnostic_n` y `subjective_valuation` NO existen en la BD.

### `bioimpedancia_measurements` (⚠️ columnas de medidas en camelCase)
```
id, owner_id, evaluation_id, patient_id, date, weight, height, imc, age, gender,
body_fat_pct, water_pct, muscle_mass, bone_mass, visceral_fat,
bmr, metabolic_age, physique_rating,
waist, umbilical, hip, thighLeft, thighRight, abdominalLow,
calfGirth, armRelaxed, armContracted,
meta_complied (text), notes, created_at
```
> ⚠️ Esta tabla usa camelCase (thighLeft, armRelaxed, etc.) a diferencia del resto que usa snake_case. No cambiar sin migración.

### `dietary_evaluations`
```
id, owner_id, evaluation_id, patient_id (uuid → patients.id), date,
recall_24h (jsonb, default '[]'), food_frequency (jsonb, default '[]'),
meals_per_day, excluded_foods, notes, created_at
```

### `somatotypes`
```
id, evaluation_id, patient_id, date, x (numeric), y (numeric), created_at
```

### `menus`
```
id, owner_id, patient_id, evaluation_id, date (default CURRENT_DATE),
name, age, gender, weight_kg, height_cm, kcal_to_work,
vet_details (jsonb), macros (jsonb), portions (jsonb), menu_data (jsonb),
templates_references, template_id (text, default 'plantilla_v1'),
design_config (jsonb), content, ai_rationale, created_at
```
> ⚠️ La columna `menu_preview_data` NO existe — nunca agregarla a queries. El dato estructurado del menú está en `menu_data`.
> `menus` SÍ tiene `owner_id`.

### `menu_templates`
```
id, owner_id, name (default 'Mi Plantilla'), template_design (default 'base_v1'),
header_mode (default 'default'), logo_url,
is_default (boolean), footer_config (jsonb),
section_titles (jsonb), visual_theme (jsonb), page_layout (text),
created_at, updated_at
```

### `menu_references`
```
id, owner_id, type, kcal (integer), data (jsonb), created_at
```

### `menu_recommendations`
```
id, owner_id, name, type, data (jsonb), created_at
```

### `patient_digital_tracking`
```
id, patient_id (uuid → patients.id), menu_id (uuid → menus.id),
tracking_data (jsonb, default '{}'),
menu_start_date (date), menu_end_date (date), duration_days (integer, default 28),
updated_at
```

### `patient_files`
```
id, owner_id, patient_id, evaluation_id, name, type, folder,
url, path, date (text), description (default ''), lab_interpretation (default ''),
created_at
```

### `appointments`
```
id, owner_id, patient_name, date, time,
duration (integer, default 60), type, modality,
status (USER-DEFINED enum appointment_status, default 'Programada'),
google_event_id, phone, notes,
reminder_sent (boolean, default false), reminder_sent_at,
created_at
```

### `invoices`
```
id, owner_id, patient_id, patient_name, date,
amount (numeric), status (USER-DEFINED enum invoice_status, default 'Pendiente'),
method, type (default 'ingreso'), category, description, created_at
```

### `profiles`
```
id, name, email, contact_email, personal_phone, phone,
role (USER-DEFINED enum user_role: admin | nutricionista | recepcionista, default 'nutricionista'),
specialty, professional_title, license_number, address, avatar,
instagram_handle, website, timezone (default 'UTC-06:00'), link_code,
patient_statuses (ARRAY text),
country, date_of_birth (date),
share_digital_menu_message (text),
currency (default '$'), navbarconfig (default 'sidebar'),
plan (text, default 'free'),
patient_portal_config (jsonb, default '{}'),
storage_saved (jsonb, default '{}'),
menu_reference_card_config (jsonb, default '{}'),
created_at
```
> ⚠️ Las columnas `menu_ai_config` y `lab_ai_prompt` NO existen — fueron eliminadas con la integración IA.
> 🆕 `menu_reference_card_config` agregada [PENDIENTE — ejecutar el ALTER TABLE indicado por Claude en el Dashboard de Supabase]: guarda qué campos (kcal/nombre del menú/nombre del paciente/tipo) se muestran en las tarjetas del selector "Elige hasta 3 referencias" (MenuAddReadSec2).

### `profile_links`
```
id, nutritionist_id (uuid → profiles.id), receptionist_id (uuid → profiles.id), created_at
```

### `google_calendar_tokens`
```
id, owner_id, access_token, refresh_token,
token_expiry (bigint), watch_channel_id, watch_resource_id, watch_expiry (bigint),
calendar_id, created_at, updated_at
```

### `subscriptions`
```
id, owner_id, plan (default 'free'), status (default 'free'),
recurrente_subscription_id, recurrente_product_id, recurrente_customer_id,
trial_started_at, trial_ends_at,
current_period_start, current_period_end,
created_at, updated_at, cancelled_at
```
> ⚠️ `recurrente_customer_id` (columna `us_...`) agregada 2026-07-07 — necesaria para el flujo de "cambiar tarjeta sin cancelar" (`update-payment-method`). Se llena automáticamente desde `payload.user_id` en cada evento del webhook.

### `subscription_events`
```
id, owner_id, event_type, recurrente_id, payload (jsonb), created_at
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

### Carga de menús (patrón lazy)
- El store **no cachea `menu_data`** — los menús se stripean antes de guardar en localStorage para no acumular JSONB pesado
- Para **listas/historial**: usar `getMenusForHistory()` — solo columnas ligeras, sin JSONB
- Para **edición o preview de un menú específico**: usar `getMenuData(id)` — trae `menu_data` y `content`
- Nunca usar `getMenus()` (select *) para listas de UI — descarga todo el JSONB de todos los menús

---

## Funcionalidades principales

1. **Ficha de paciente** — Historia clínica, datos personales, antecedentes, perfil deportivo, datos menstruales
2. **Evaluaciones** — Entidad que agrupa mediciones, dieta, bioimpedancia, menú y archivos de una consulta
3. **Antropometría** — Pliegues, perímetros, diámetros, composición corporal, somatotipo (carta XY)
4. **Bioimpedancia** — Grasa, músculo, agua, masa ósea, grasa visceral, edad metabólica, TMB
5. **Evaluación dietética** — Recordatorio 24h, frecuencia alimentaria, comidas por día
6. **Menús** — Plan alimentario editable; plantillas PDF exportables con diseño personalizable
7. **Archivos de paciente** — Fotos, laboratorios, documentos
8. **Calendario de citas** — Agenda por nutricionista, modalidad, duración, estado; integración Google Calendar
9. **Facturación** — Control de ingresos/egresos con categoría, método y estado
10. **Dashboard** — Analíticas con gráficas Recharts
11. **Administración** — Panel admin con gestión de usuarios
12. **Portal del paciente** — Acceso anónimo del paciente a su menú y seguimiento
13. **Suscripciones** — Gestión de planes vía Recurrente

---

## Consideraciones de desarrollo

- Las variables de entorno Supabase se definen en `.env` y se exponen via Vite
- Los formularios de mediciones y bioimpedancia son extensos — verificar columnas exactas en este schema antes de modificar
- `bioimpedancia_measurements` usa **camelCase** en columnas de medidas corporales (inconsistencia histórica — no cambiar sin migración)
- `menus.menu_data` es un JSONB con la estructura completa del menú
- `patients.sports_profile` es JSONB con datos deportivos estructurados
- Los enums `USER-DEFINED` de Supabase (`appointment_status`, `invoice_status`, `user_role`) requieren valores exactos
- El portal del paciente es anónimo — las tablas que el portal lee necesitan policies RLS para el rol `anon`
- El puerto de desarrollo es **3000** (definido en `vite.config.ts`)
