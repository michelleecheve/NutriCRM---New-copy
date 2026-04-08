---
name: Trial activation must use Recurrente checkout, not edge functions
description: Never call an activate-trial edge function for trial/upgrade flows — always redirect to Recurrente checkout
type: feedback
---

Never create or call an `activate-trial` (or similar) Supabase Edge Function for trial activation or plan upgrades. The correct approach is always `authStore.startCheckout()`, which redirects the user to the Recurrente checkout page. Recurrente handles trial detection internally.

**Why:** Attempting to call a non-existent edge function caused a "Error de conexión al activar el trial" error in production. The trial/subscription lifecycle is fully managed by Recurrente — the app only needs to send the user to the checkout URL.

**How to apply:** Any UI button that activates a trial or upgrades to Pro (PlanLimitModal, SubscriptionBanner, ProfileSubscription, overlays, etc.) must call `authStore.startCheckout()`. Do not write edge functions for trial activation.
