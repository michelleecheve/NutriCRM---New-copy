---
name: subscription-overhaul-2026-checklist
description: Checklist completo acordado el 2026-05-14 para mejorar el sistema de suscripciones: eliminar trial de UI, período de gracia en cancelación, emails transaccionales con Resend, correcciones de webhook, y limpieza de código legacy.
metadata:
  type: project
---

# Subscription Overhaul — Cambios pendientes (acordados 2026-05-14)

Ver base existente en [[project_subscription_plan]].
Ver regla de trial en [[feedback_trial_activation]].

**Why:** El sistema base ya existe y funciona. Estos cambios mejoran la experiencia de pago, protegen al usuario (período de gracia al cancelar), agregan comunicación propia (emails branded) y corrigen bugs críticos (current_period_end nunca se llena, cancelación baja inmediatamente).
**How to apply:** Implementar en el orden recomendado al final. Marcar ✅ al completar cada ítem.

---

## Estado actual resumido

| Qué existe | Estado |
|---|---|
| Trial 14 días | ❌ Eliminado completamente — ni en UI ni en código. Solo existen Plan Básico y Plan Pro |
| Planes | `free` y `pro` (UI dice "Gratuito" / "Pro") |
| Webhook Recurrente | ✅ Maneja 4 eventos — pero con gaps críticos |
| Cancelación | ⚠️ Baja INMEDIATO a free (no respeta período pagado) |
| `current_period_end` | ⚠️ Existe en tabla pero el webhook NUNCA lo llena |
| Emails transaccionales | ❌ No existen (Recurrente envía recibo genérico) |
| "Cambiar tarjeta" | ⚠️ Solo info box, sin botón ni flujo claro |
| Retry fallido → cancelar | ⚠️ Recurrente reintenta pero no enviamos avisos propios |

---

## Qué hace Recurrente vs. qué hacemos nosotros

**Recurrente hace por nosotros:** procesar/almacenar tarjetas (PCI compliant), cobrar en fecha de renovación, reintentar cobros fallidos, enviar webhooks, mostrar checkout hospedado, enviar recibo básico de pago.

**Nosotros debemos hacer:** actualizar BD según cada webhook, otorgar/revocar acceso Pro, enviar emails propios branded en español, lógica de período de gracia, UI de gestión (cancelar, cambiar tarjeta), configurar número de reintentos en dashboard de Recurrente.

---

## Estado por bloque

| Bloque | Descripción | Estado |
|---|---|---|
| 1 | Eliminar trial de la UI | ✅ Hecho (2026-05-14) |
| 2 | Renombrar "Gratuito" → "Básico" en toda la UI | ✅ Hecho (2026-05-14) |
| 3 | Cancelación con período de gracia (CRÍTICO) | ✅ Hecho (2026-05-14) |
| 4 | Webhook llena `current_period_end` | ⚠️ Reabierto y corregido de verdad (2026-07-07) — ver nota abajo |
| 5 | Configuración en dashboard de Recurrente (manual) | ⬜ Pendiente — hacer en Recurrente dashboard |
| 6 | Emails transaccionales con Resend | ⏸️ Diferido — retomar cuando haya API key de Resend |
| 7 | Botón "Cambiar tarjeta" — ahora cambia la tarjeta de verdad, sin cancelar | ✅ Rehecho (2026-07-07) — ver nota abajo |
| 8 | Timing fix checkout-success | ✅ Hecho (2026-05-14) — polling 2s × 5 intentos |
| 9 | Manejo correcto de `past_due` | ✅ Hecho (2026-05-14) — isPro() incluye past_due |
| 10 | Limpieza de código legacy | ✅ Hecho (2026-05-14) |

## Deploy pendiente (ejecutar en terminal)
```bash
supabase functions deploy recurrente-webhook
supabase functions deploy cancel-subscription
supabase functions deploy expire-subscription
```

---

## BLOQUE 1 — Eliminar trial completamente

> El sistema de trial se elimina por completo: UI, lógica en authStore y edge function.

- [ ] 1.1 `ProfileSubscription.tsx` — eliminar el botón "Prueba Gratis 14 Días"; `handleUpgrade` siempre va directo a `startCheckout()`
- [ ] 1.2 `ProfileSubscription.tsx` — eliminar toda la lógica `hasUsedTrial` del botón de acción
- [ ] 1.3 `ProfileSubscription.tsx` — quitar "14 días de prueba gratis" de la lista de features del plan Pro (línea 112)
- [ ] 1.4 `SubscriptionBanner.tsx` — eliminar estado `isTrialing` (banner de trial activo con días restantes)
- [ ] 1.5 `SubscriptionBanner.tsx` — eliminar estado `!hasUsedTrial` ("prueba 14 días gratis aquí"); dejar un solo banner para no-Pro
- [ ] 1.6 `ProfileSubscription.tsx` — quitar `startTrial()` del `handleUpgrade`; siempre `startCheckout()`
- [ ] 1.7 `authStore.tsx` — eliminar `startTrial()`, `isOnTrial()`, `trialDaysLeft()`, `hasUsedTrial` completamente — no hay trial de ningún tipo
- [ ] 1.8 Edge function `activate-trial` — eliminar o dejar muerta sin ningún uso; no se llama desde ningún lado
- [ ] 1.9 **Migración de usuarios existentes** — ejecutar SQL en Supabase al momento de publicar a producción (NO antes, para no afectar usuarios activos durante el desarrollo):
  ```sql
  UPDATE subscriptions SET plan = 'free', status = 'free' WHERE status = 'trialing';
  UPDATE profiles SET plan = 'free' WHERE id IN (SELECT owner_id FROM subscriptions WHERE status = 'trialing');
  ```

---

## BLOQUE 2 — Renombrar "Gratuito" → "Básico"

- [ ] 2.1 `ProfileSubscription.tsx` — card del plan: "Gratuito" → "Básico"
- [ ] 2.2 `ProfileSubscription.tsx` — `statusLabel()`: "Plan Gratuito" → "Plan Básico"
- [ ] 2.3 `SubscriptionBanner.tsx` — "versión gratuita" → "Plan Básico"
- [ ] 2.4 `SubscriptionBanner.tsx` — banner unificado (sin estados de trial): "Plan Básico — Pasa a Pro para acceso ilimitado" con link directo al checkout
- [ ] 2.5 `ProfileSubscription.tsx` — el botón cuando no es Pro siempre dice "Suscribirse a Pro" (ya existe para el caso `hasUsedTrial`, aplicar en todos los casos)

---

## BLOQUE 3 — Cancelación con período de gracia (CRÍTICO)

**Problema actual:** cuando el usuario cancela, el webhook `subscription.cancel` baja el plan a `free` inmediatamente. El usuario pierde el resto del período pagado.

**Dos escenarios que el sistema debe distinguir:**
- **Escenario A — Cancelación voluntaria:** usuario pagó hasta el 15 de junio, cancela el 5 de mayo → mantiene acceso hasta el 15 de junio.
- **Escenario B — Cancelación por cobro fallido:** Recurrente reintentó 3 días y no pudo cobrar → no hay período prepagado pendiente → baja inmediata.

- [ ] 3.1 **BD** — agregar columna `cancelled_at` (timestamptz, nullable) a tabla `subscriptions` — registra cuándo el usuario pidió cancelar
- [ ] 3.2 **BD** — confirmar que columna `current_period_end` existe en `subscriptions` (el código la referencia pero el webhook no la llena — ver Bloque 4)
- [ ] 3.3 **Edge function `cancel-subscription`** — cambiar comportamiento:
  - `status = 'cancelled_pending'`, conservar `plan = 'pro'`, guardar `cancelled_at = now()`
  - NO bajar `ai_rate_limits` todavía
  - Responder con `{ ok: true, access_until: current_period_end }`
- [ ] 3.4 **`authStore.tsx` `cancelSubscription()`** — actualizar estado local a `status = 'cancelled_pending'` (no `cancelled`) para que `isPro()` siga siendo `true`
- [ ] 3.5 **`authStore.tsx` `isPro()`** — agregar `|| status === 'cancelled_pending'` para que el acceso continúe durante el período pagado
- [ ] 3.6 **`authStore.tsx` `handleSupabaseSession()`** — al cargar sesión, si `status === 'cancelled_pending'` y `current_period_end < now()` → downgrade automático a `free` (igual que como expira el trial hoy)
- [ ] 3.7 **Webhook `recurrente-webhook`** — en el evento `subscription.cancel`, leer status actual en BD antes de procesar:
  - Si `cancelled_pending` → usuario ya canceló voluntariamente; el webhook confirma que Recurrente cerró → no tocar acceso, dejar que el tiempo haga el downgrade
  - Si `active` o `past_due` → cancelación por fallo de cobro → bajar a `free` inmediatamente
- [ ] 3.8 **UI `ProfileSubscription.tsx`** — confirmation dialog de cancelación: cambiar "Tu acceso Pro terminará inmediatamente" → "Tu acceso Pro continuará hasta el **[current_period_end]**. Después pasarás al Plan Básico automáticamente."
- [ ] 3.9 **UI `statusLabel()`** — agregar caso `cancelled_pending`: badge "Pro · Cancela el [fecha]" en color ámbar
- [ ] 3.10 **UI** — cuando `status === 'cancelled_pending'`, NO mostrar botón "Cancelar suscripción" (ya canceló); mostrar solo info de cuándo expira el acceso

---

## BUG CRÍTICO ENCONTRADO Y CORREGIDO — 2026-07-07

**Síntoma:** a Michelle le cobraron el 15 de junio (renovación real, confirmado en `subscription_events`), pero `subscriptions.current_period_end` se quedó congelado en el 14 de junio. El 7 de julio seguía en `status='active'` con el período vencido hace 23 días y sin ningún bloqueo de acceso.

**Causa raíz real (el Bloque 4 de mayo se marcó ✅ pero nunca funcionó):** el webhook `recurrente-webhook/index.ts` solo tenía `case` para `subscription.renew`/`subscription.renewed`. **Recurrente nunca manda esos eventos.** Los eventos reales que llegan en cada cobro recurrente son `payment_intent.succeeded` e `intent.succeeded` (confirmado inspeccionando el payload real en `subscription_events`). Ambos caían en el `default: unhandled` — se logueaban pero nunca actualizaban la tabla.

Además, el payload de `payment_intent.succeeded` **no trae ningún campo de fecha de próximo cobro** (a diferencia de `setup_intent.succeeded`). Hay que calcular `current_period_end` sumando `billing_interval`/`billing_interval_count` (vienen en `products[].prices[].billing_interval`) a la fecha del cobro (`payload.created_at`), no confiar en `extractPeriodEnd()`.

**Fix aplicado:**
1. `supabase/functions/recurrente-webhook/index.ts` — agregado `case 'payment_intent.succeeded'` (calcula el período sumando el intervalo de facturación) y `case 'intent.succeeded'` (no-op, es el mismo cobro duplicado con otro nombre de evento). Desplegado manualmente por Michelle el 2026-07-07.
2. `services/authStore.tsx` (`handleSupabaseSession`) — agregado safety-net: si `status` es `active`/`past_due` y `current_period_end` venció hace más de 5 días, hace auto-downgrade a `free` en vez de confiar ciegamente en `status`. Antes esto solo existía para `cancelled_pending`. Antes de desplegar este cambio en frontend, se corrigió manualmente la fila de Michelle (`current_period_start`/`current_period_end` = 15 jun → 15 jul) para que este safety-net no la bajara de plan por error.

**Pendiente de verificar:** confirmar en el dashboard de Recurrente si esta suscripción específica (`su_5kjl9lj5`) sigue anclada a `billing_cycle_anchor_day: 1` en el precio — eso fue probablemente la causa del problema original ("cobro el 1ro del mes"). El campo seguía apareciendo en el payload del 15 de junio pese a que Michelle dice haber corregido la configuración.

---

## FEATURE — Cambiar tarjeta sin cancelar (2026-07-07)

**Problema del flujo viejo (Bloque 7 original):** el botón "Cambiar tarjeta" solo mostraba instrucciones — cancelar y volver a suscribirse. Michelle detectó el riesgo real: si cancelás y volvés a suscribirte antes de que termine tu período pagado, ¿te cobra dos veces? (Resulta que no — `startCheckout()` bloquea re-suscripción mientras `status` sea `active`/`cancelled_pending` — pero igual es una UX mala: hay que esperar exactamente hasta `current_period_end` para poder cambiar de tarjeta, y se pierde el cupón/precio original al crear una suscripción nueva desde cero.)

**Solución implementada:** Recurrente soporta actualizar el método de pago de una suscripción existente sin cancelarla — guía oficial: https://docs.recurrente.com/guias-espanol/guias/cambiar-tarjeta-de-suscripcion.md

Flujo: (1) checkout `mode: "setup"` con `user_id` del cliente en Recurrente → tokeniza tarjeta nueva sin cobrar nada; (2) webhook recibe `setup_intent.succeeded` con `checkout.payment_method.id`; (3) `PUT /api/subscriptions/{id}` con `payment_method_id` → reemplaza la tarjeta en la suscripción activa, mismo ciclo de facturación, sin tocar `current_period_end`.

**Archivos:**
- `supabase/functions/update-payment-method/index.ts` (nueva) — crea el checkout `mode=setup`, requiere `RECURRENTE_API_SECRET_KEY` (secret nuevo, **distinto** de `RECURRENTE_SECRET_KEY` que es el secret de firma Svix del webhook)
- `supabase/functions/recurrente-webhook/index.ts` — el case `setup_intent.succeeded`/`subscription.create` ahora revisa `metadata.purpose === 'update_card'` primero; si es así, hace el PUT a Recurrente y no toca plan/status/período. También captura `recurrente_customer_id` (`payload.user_id`, formato `us_...`) en cada upsert — se necesita para poder armar el checkout `mode=setup` la próxima vez.
- `services/authStore.tsx` — nuevo método `updatePaymentMethod()`
- `components/profile_config/ProfileSubscription.tsx` — el botón "Cambiar tarjeta" ahora llama directo al flujo nuevo (se eliminó el modal de instrucciones manual); habilitado también para `status === 'past_due'`
- `pages/CheckoutSuccess.tsx` — detecta `?type=card_update` en la URL y muestra mensaje distinto ("Tarjeta actualizada" en vez de "Pago exitoso")

**Migración BD requerida (pendiente confirmar que Michelle la corrió):**
```sql
alter table subscriptions add column if not exists recurrente_customer_id text;
update subscriptions set recurrente_customer_id = 'us_8hehsrlf'
where owner_id = '2200646d-db1f-4764-83cd-0e4a901b86ea';
```

**Secret nuevo requerido:** `RECURRENTE_API_SECRET_KEY` (Secret Key real de Recurrente, `sk_...`, sacarla del dashboard de Recurrente) — sin esto ni `update-payment-method` ni el nuevo branch del webhook funcionan.

**Riesgo sin verificar todavía:** no hay confirmación de que Recurrente efectivamente eche de vuelta `checkout.metadata` en el payload de `setup_intent.succeeded` para checkouts `mode=setup` (la guía oficial no lo muestra en su ejemplo abreviado). Si `metadata.purpose` no llega, el evento cae en la rama de "activar Pro" en vez de la de cambio de tarjeta — no cobra ni cancela nada, pero sí resetearía `current_period_start`/`current_period_end` incorrectamente (+30 días desde hoy). **Probar el flujo completo una vez y revisar el payload real en `subscription_events` antes de confiar en él.**

---

## FEATURE — Email "Plan Básico" al expirar el período de gracia (2026-07-07)

**Problema detectado:** el email de cancelación inmediata (`cancel-subscription`) decía "puedes volver a suscribirte en cualquier momento" y traía el botón "Volver a suscribirme" — pero mientras `status='cancelled_pending'`, `authStore.subscribe()` bloquea la resuscripción con "Ya tienes una suscripción Pro activa." El botón llevaba a un dead end.

**Además:** cuando el período de gracia realmente termina y el usuario pasa a Plan Básico, esa transición ocurría solo client-side (`authStore.tsx handleSupabaseSession`, downgrade directo a la tabla) — sin ningún email.

**Solución:**
1. `cancel-subscription/index.ts` — se quitó el botón y se corrigió el texto: ahora dice que podrá volver a suscribirse recién cuando termine su acceso Pro y pase al Plan Básico.
2. Nueva edge function `supabase/functions/expire-subscription/index.ts` — hace el downgrade server-side (`status: 'cancelled_pending' → 'cancelled'`, `plan → 'free'`) y envía el email "Tu cuenta ahora está en el Plan Básico" con el botón "Volver a suscribirme". Idempotente: el `UPDATE` solo afecta filas todavía en `cancelled_pending` (`.eq('status','cancelled_pending')`), así que llamadas repetidas (multi-tab, re-login) después del primer downgrade no reenvían el correo.
3. `authStore.tsx` (`handleSupabaseSession`) — el bloque que detecta `cancelled_pending` + `current_period_end` vencido ahora llama `supabase.functions.invoke('expire-subscription')` en vez de escribir directo a `subscriptions`/`profiles`.

**Nota:** el safety-net de `active`/`past_due` vencido hace +5 días (línea ~328 de `authStore.tsx`, agregado en el bug fix del mismo día) sigue haciendo downgrade directo sin email — no se tocó, es un caso distinto (falla silenciosa de webhook, no cancelación voluntaria).

---

## BLOQUE 4 — Webhook llena `current_period_end`

**Problema:** el campo existe en la tabla pero el webhook nunca lo llena. Sin este dato no puede existir período de gracia.

- [ ] 4.1 Revisar payload real de Recurrente en `setup_intent.succeeded` y `subscription.create` — identificar en qué campo envían la fecha del próximo cobro (puede ser `subscription.current_period_end`, `next_billing_date`, `billing_cycle_end`, etc. — necesitamos ver un payload real)
- [ ] 4.2 Actualizar `recurrente-webhook/index.ts` en los casos `setup_intent.succeeded` y `subscription.create` para extraer y guardar `current_period_end` en la tabla `subscriptions`
- [ ] 4.3 Para renovaciones (`subscription.renew` o similar si Recurrente lo envía) — actualizar `current_period_end` al siguiente período
- [ ] 4.4 Fallback si Recurrente no envía la fecha: `current_period_end = fecha_activación + 30 días`

---

## BLOQUE 5 — Configuración en Recurrente dashboard (MANUAL)

Esto se hace en el panel de Recurrente, no en código:

- [ ] 5.1 Configurar reintentos de cobro: falla → retry día 2 → retry día 3 → cancelar día 4
- [ ] 5.2 Verificar webhook URL registrado: `https://[proyecto].supabase.co/functions/v1/recurrente-webhook`
- [ ] 5.3 Verificar eventos suscritos: `setup_intent.succeeded`, `subscription.create`, `subscription.cancel`, `subscription.past_due`, `subscription.paused`
- [ ] 5.4 Verificar que el webhook secret (`whsec_...`) en Supabase Secrets coincide con el configurado en Recurrente
- [ ] 5.5 Investigar si Recurrente permite "cancel at period end" vs "cancel immediately" en la API DELETE — si lo permite, usarlo para que `subscription.cancel` llegue al final del período y no inmediatamente

---

## BLOQUE 6 — Emails transaccionales

**Nada existe actualmente.** Recurrente solo envía recibo genérico, sin branding de NutriFlow.
**Servicio recomendado:** Resend (resend.com) — gratis hasta 3,000 emails/mes, integración nativa con Supabase edge functions.

- [ ] 6.1 Crear cuenta en Resend, obtener API key
- [ ] 6.2 `supabase secrets set RESEND_API_KEY=re_xxx`
- [ ] 6.3 Crear edge function `supabase/functions/send-email/index.ts` (wrapper reutilizable de Resend API)
- [ ] 6.4 **Email bienvenida Pro** — disparar desde webhook `setup_intent.succeeded` / `subscription.create`:
  - Asunto: "¡Bienvenida a NutriFlow Pro!"
  - Cuerpo: nombre + confirmación plan activo + fecha de próxima renovación + botón "Ir a NutriFlow"
- [ ] 6.5 **Email pago fallido** — disparar desde webhook `subscription.past_due`:
  - Asunto: "Problema con tu pago en NutriFlow"
  - Cuerpo: problema al cobrar + instrucciones para cambiar tarjeta (cancelar y volver a suscribirse) + días antes de que se cancele
- [x] 6.6 **Email cancelación voluntaria** — 2 emails distintos (corregido 2026-07-07, ver nota abajo):
  - `cancel-subscription` envía la confirmación inmediata SIN botón de resuscribir (resuscribir está bloqueado mientras `status='cancelled_pending'`)
  - `expire-subscription` (nueva, invocada por `authStore` cuando `current_period_end` ya pasó) envía "Tu cuenta ahora está en el Plan Básico" CON el botón "Volver a suscribirme"
- [ ] 6.7 **Email baja por cobro fallido** — disparar desde webhook `subscription.cancel` cuando era `active`/`past_due`:
  - Asunto: "Tu suscripción Pro ha sido cancelada"
  - Cuerpo: cobro no se pudo completar después de varios intentos + cómo volver a suscribirse

---

## BLOQUE 7 — Botón "Cambiar tarjeta"

- [ ] 7.1 `ProfileSubscription.tsx` — reemplazar info box discreto actual por un botón real "Cambiar tarjeta"
- [ ] 7.2 Al hacer click, mostrar modal/alert con pasos claros:
  1. Cancela tu suscripción actual (seguirás con acceso Pro hasta el [fecha])
  2. Cuando expire, vuelve a suscribirte con la nueva tarjeta
  "Tus datos y pacientes nunca se eliminan."
- [x] 7.3 (revertido 2026-07-07) El botón "Cambiar tarjeta" NO aparece en `cancelled_pending` — no tiene sentido actualizar la tarjeta de una suscripción que ya está en cuenta regresiva para cancelarse. Solo `status === 'active'` o `'past_due'` con `recurrente_subscription_id`.

---

## BLOQUE 8 — Validar flujo free → pro completo

El flujo ya funciona en teoría, pero hay que validar estos puntos:

- [ ] 8.1 Verificar en `startCheckout()` que `metadata.owner_id` se envía correctamente (línea 663 authStore) — ya se hace, solo confirmar
- [ ] 8.2 Probar en staging: usuario free completa checkout → webhook llega → `refreshSubscription()` en `/checkout-success` muestra Pro
- [ ] 8.3 **Timing fix `/checkout-success`** — el webhook puede no haber llegado cuando el usuario aterriza; agregar polling: reintentar `refreshSubscription()` cada 2s por hasta 10s hasta que `status === 'active'`; mostrar "Verificando tu pago..." mientras espera y "¡Plan Pro activo!" al confirmar
- [ ] 8.4 Verificar deduplicación del webhook: si Recurrente envía el mismo evento dos veces, la tabla `subscription_events` debe absorber el duplicado sin double-process — ya hay lógica, solo confirmar con test

---

## BLOQUE 9 — Manejo de past_due

Actualmente `past_due` solo cambia el `status` pero el `plan` sigue siendo `pro`. Completar:

- [ ] 9.1 Verificar que `isPro()` devuelve `true` cuando `status === 'past_due'` — actualmente NO lo hace (solo `active` o `trialing`). El usuario en `past_due` pierde acceso mientras Recurrente reintenta — decidir si es bug o intencional
- [ ] 9.2 Decisión de política: el usuario `past_due` sigue con acceso Pro durante los días de retry (recomendado: sí, durante los 3 días de retry tiene acceso) → si se aprueba, agregar `|| status === 'past_due'` a `isPro()`
- [ ] 9.3 Mostrar banner de "Pago pendiente" prominente a nivel global para `past_due` con instrucciones claras (ya existe warning en ProfileSubscription pero debe ser más visible en el banner global)

---

## BLOQUE 10 — Limpieza de código legacy

- [ ] 10.1 `authStore.tsx` — eliminar `startTrial()`, `isOnTrial()`, `trialDaysLeft()`, `hasUsedTrial` y toda referencia a trial en toda la app (ya cubierto en Bloque 1; hacer búsqueda global para confirmar que no queda ningún rastro)
- [ ] 10.2 `SubscriptionBanner.tsx` — simplificar: eliminar los 3 estados (trial activo, nunca trial, trial usado) → dejar solo 1 estado: "Estás en Plan Básico → Upgrade a Pro"
- [ ] 10.3 `cancelSubscription()` en `authStore` — actualizar `this.subscription` local a `cancelled_pending` (no `cancelled`) para evitar que la UI baje prematuramente
- [ ] 10.4 `statusLabel()` — agregar caso `cancelled_pending` y verificar que `paused` también tiene mensaje correcto

---

## Orden de implementación recomendado

1. **Primero (BD):** Verificar/agregar columna `cancelled_at` en `subscriptions` + confirmar `current_period_end` existe
2. **Segundo (Recurrente dashboard):** Configurar reintentos y verificar webhook URL/eventos/secret
3. **Tercero (Webhook):** Actualizar `recurrente-webhook` para llenar `current_period_end` y diferenciar tipos de cancelación
4. **Cuarto (cancel-subscription):** Cambiar edge function a `cancelled_pending` con período de gracia
5. **Quinto (authStore):** Actualizar `isPro()`, `cancelSubscription()`, y lógica de expiración de `cancelled_pending`
6. **Sexto (UI):** Eliminar trial, renombrar Básico, actualizar confirmation dialog, botón cambiar tarjeta, limpiar legacy
7. **Séptimo (Emails):** Setup Resend + edge function `send-email` + disparar desde webhook y cancel function
8. **Octavo (Validación):** Probar flujo completo free→pro, timing de `/checkout-success`, deduplicación
