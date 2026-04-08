---
name: Implementación de planes Free/Pro con Recurrente
description: Contexto completo del feature de suscripciones (Free vs Pro) usando Recurrente como plataforma de pago. Incluye reglas de negocio, arquitectura de BD, y plan de implementación acordado.
type: project
---

## Objetivo
Implementar versión gratuita y versión Pro en NutriFlow CRM usando Recurrente como plataforma de cobro recurrente.

## Plataforma de pago: Recurrente
- Documentación: https://docs.recurrente.com
- API base: https://app.recurrente.com/api
- Auth: headers `X-PUBLIC-KEY` y `X-SECRET-KEY`
- **Test public key (ya confirmada):** `pk_test_AjDKDY2Sdxnt81mqKMBc6z7KNlF3kh13QS3DiqESnyyENCtmGcy7EyL9g`
- **Product ID (Pro, creado manualmente en dashboard):** `prod_fdnbsrhs`
- Arrancar con keys de TEST primero, luego producción
- Crear checkouts desde frontend con public key (no requiere secret)
- Webhooks deben recibirse en Supabase Edge Function (server-side)

## Flujo de Recurrente
1. Crear Producto Pro en Recurrente (via API o dashboard): $32 USD/mes, 14 días trial
   - `charge_type: recurring`, `billing_interval: month`, `billing_interval_count: 1`
   - `free_trial_interval: day`, `free_trial_interval_count: 14`
2. Frontend crea Checkout con `product_id` → recibe `checkout_url` → redirige usuario
3. Recurrente dispara webhooks al completar/cancelar suscripción
4. Supabase Edge Function recibe webhook → actualiza tabla `subscriptions`

## Reglas de negocio por rol y plan

| Rol | Plan | Pago |
|-----|------|------|
| admin | Siempre Pro | Sin pago |
| recepcionista | Siempre incluido | Sin pago, hereda límites de su nutri vinculada |
| nutricionista | Free / Trial / Pro | Paga $32 USD/mes |

### Límites plan Free (nutricionista):
- Máx 10 pacientes activos
- Máx 20 citas en calendario (contadas por owner_id de la nutri)
- Sin acceso a IA/Gemini (menús con IA, interpretación de labs)
- Trial: 14 días de acceso Pro completo, activado manualmente por el usuario

### Límites heredados por recepcionista:
- El límite de citas aplica al owner_id (la nutri), no a la secre
- Si la nutri es free → secre ve límite de 20 citas al agendar
- Si la nutri es pro → sin límite para la secre también

### Usuarios existentes:
- Por default arrancan en `free`
- Ellos activan el trial manualmente desde la UI

## Arquitectura de base de datos

### Tabla nueva: `subscriptions` (fuente de verdad)
```sql
id                         uuid PK
owner_id                   uuid → profiles.id (UNIQUE)
plan                       text  -- 'free' | 'pro'
status                     text  -- 'free' | 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled'
recurrente_subscription_id text
recurrente_product_id      text
trial_started_at           timestamptz
trial_ends_at              timestamptz
current_period_start       timestamptz
current_period_end         timestamptz
created_at                 timestamptz
updated_at                 timestamptz
```

### Tabla nueva: `subscription_events` (log de webhooks, append-only)
```sql
id              uuid PK
owner_id        uuid → profiles.id
event_type      text  -- 'subscription.create' | 'subscription.cancel' | 'subscription.past_due' | 'subscription.paused'
recurrente_id   text  -- para deduplicar reintentos
payload         jsonb
created_at      timestamptz
```

### Columna desnormalizada en `profiles` (caché para queries rápidas):
```sql
profiles.plan  text  default 'free'
```
- Espejo de `subscriptions.plan`, actualizado por el webhook
- Permite que authStore lo lea sin JOIN adicional

## Webhooks de Recurrente a manejar
- `subscription.create` → activar plan Pro en subscriptions + profiles.plan
- `subscription.cancel` → degradar a Free
- `subscription.past_due` → marcar estado, avisar al usuario
- `subscription.paused` → marcar estado

## Dónde va el check del límite de citas (Google Calendar sync)
El sync de GCal es BIDIRECCIONAL:
- NutriFlow → GCal: createEvent / updateEvent / deleteEvent en googleCalendarService.ts
- GCal → NutriFlow: Edge Function `google-calendar-webhook/index.ts` hace INSERT al detectar evento nuevo

Checks necesarios:
1. `supabaseService.ts` → `createAppointment`: check antes de insertar
2. `google-calendar-webhook/index.ts` → líneas 192-228 (import de evento nuevo desde GCal): check antes del insert, `continue` si ya llegó a 20

El check en Edge Function es:
```typescript
const { data: sub } = await supabase.from('subscriptions').select('plan, status').eq('owner_id', tokenRow.owner_id).single();
const isPro = sub?.plan === 'pro' && sub?.status === 'active';
if (!isPro) {
  const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('owner_id', tokenRow.owner_id);
  if ((count ?? 0) >= 20) continue;
}
```

## UI — ProfileSubscription
- Nuevo componente: `components/profile_config/ProfileSubscription.tsx`
- Se agrega en `Profile.tsx` debajo de "Configuración de Sistema"
- NO es acordeón: al hacer click navega a una página completa (similar al resto del perfil)
- Muestra: plan actual, días de trial restantes, botón de upgrade, estado de suscripción

## Orden de implementación acordado — COMPLETADO ✅

1. ✅ Migración Supabase: tablas `subscriptions` + `subscription_events` + columna `profiles.plan`
2. ✅ Producto Pro creado manualmente en dashboard Recurrente (`prod_fdnbsrhs`)
3. ✅ Edge Function `recurrente-webhook/index.ts` — maneja create/cancel/past_due/paused. Webhook configurado en Svix (vía dashboard Recurrente). Secret key seteada como Supabase secret (`RECURRENTE_SECRET_KEY`).
4. ✅ `authStore.tsx` — helpers: `isPro()`, `isOnTrial()`, `trialDaysLeft()`, `canUseAI()`, `patientLimitReached()`, `appointmentLimitReached()`, `startTrial()`, `cancelSubscription()`, `getSubscription()`. Suscripción carga `recurrente_subscription_id` también. Solo para rol `nutricionista`.
5. ✅ `components/profile_config/ProfileSubscription.tsx` — acordeón en Profile.tsx. Badge de plan, comparativa Free vs Pro, botón trial (14 días), botón upgrade (crea checkout via API POST), botón cancelar suscripción con confirmación de dos pasos, info de cambio de método de pago.
6. ✅ Gatekeeping:
   - Pacientes: `supabaseService.createPatient` lanza `PLAN_LIMIT_PATIENTS`, capturado en `Dashboard.tsx`. **Fix aplicado: agregado filtro `owner_id` en el count de pacientes activos.**
   - Citas: `supabaseService.createAppointment` lanza `PLAN_LIMIT_APPOINTMENTS`, capturado en `CalendarAppointmentModal.tsx`
   - IA menús: `MenuAddReadSec3.tsx` → `handleGenerateAi` verifica `authStore.canUseAI()`
   - IA labs: `LabsTab.tsx` → `handleAnalyzeWithAI` verifica `authStore.canUseAI()`
7. ✅ `google-calendar-webhook/index.ts` — check de plan optimizado: 2 queries fijas por request.
8. ✅ Checkout fix: `handleUpgrade` ahora hace `POST https://app.recurrente.com/api/checkouts` con `X-PUBLIC-KEY`, recibe `checkout_url` real y redirige con `window.location.href`. Antes construía URL con query params (no funcionaba).
9. ✅ Edge Function `activate-trial/index.ts` — trial seguro server-side. Verifica JWT sin legacy secret (patrón: `createClient` con `Authorization` header → `getUser()`). Chequea `trial_started_at IS NULL` para garantizar 1 trial por cuenta para siempre. `authStore.startTrial()` ahora llama esta función en vez de escribir directo a DB.
10. ✅ Edge Function `cancel-subscription/index.ts` — cancela en Recurrente via `DELETE /api/subscriptions/{id}` con `RECURRENTE_PUBLIC_KEY`. También cubre cancelación de trials (sin llamar Recurrente). Actualiza `subscriptions` y `profiles.plan`.
11. ✅ JWT pattern en Edge Functions: `google-oauth/index.ts` actualizado con el mismo patrón seguro. `recurrente-webhook` y `google-calendar-webhook` no necesitan JWT (son server-to-server).

## Secrets de Supabase requeridos
- `RECURRENTE_SECRET_KEY` — ya seteado
- `RECURRENTE_PUBLIC_KEY` — **pendiente setear** (`pk_test_...` en test, cambiar en producción)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — ya seteados

## Deploy pendiente
```bash
supabase functions deploy activate-trial
supabase functions deploy cancel-subscription
supabase functions deploy google-oauth
supabase secrets set RECURRENTE_PUBLIC_KEY=pk_test_AjDKDY2Sdxnt81mqKMBc6z7KNlF3kh13QS3DiqESnyyENCtmGcy7EyL9g
```

## Pendientes / próximos pasos
- **✅ Botón "Activar 14 días gratis" eliminado de `ProfileSubscription.tsx`.** El trial ahora lo maneja Recurrente directamente en su checkout (configurar `prod_fdnbsrhs` con `free_trial_interval: day, free_trial_interval_count: 14`). La Edge Function `activate-trial` se conserva pero ya no está en el workflow de la UI. El webhook `subscription.create` maneja la activación cuando Recurrente confirma el trial.
- Cambiar a keys de producción de Recurrente cuando se vaya a producción
- Verificar flujo completo de checkout → webhook → activación Pro en ambiente de test

**Why:** Feature necesario para monetizar NutriFlow. Arrancar con test keys de Recurrente.
**How to apply:** Implementación completa. Si se retoma, revisar pendientes arriba.
