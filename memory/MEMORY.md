# MEMORY.md — NutriFlow CRM

- [Implementación planes Free/Pro con Recurrente](project_subscription_plan.md) — Reglas de negocio, schema BD, flujo Recurrente, orden de implementación completo (base ya hecha)
- [Trial/upgrade siempre vía Recurrente checkout](feedback_trial_activation.md) — Nunca usar edge function para activar trial; usar authStore.startCheckout()
- [Subscription overhaul 2026 — checklist completo](project_subscription_overhaul_2026.md) — 10 bloques acordados 2026-05-14: eliminar trial UI, renombrar Básico, período de gracia en cancelación (CRÍTICO), llenar current_period_end en webhook, emails Resend, botón cambiar tarjeta, validación flujo free→pro, past_due, limpieza legacy
