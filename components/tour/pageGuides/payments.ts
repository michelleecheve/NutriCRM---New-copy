import { PageGuideStep } from '../pageGuideTypes';

// Factory porque los pasos de Ingresos/Egresos/Resumen necesitan cambiar de tab
// (setActiveTab) antes de poder resaltar su contenido, ya que cada tab solo
// monta su contenido cuando está activo.
export function getPaymentsGuideSteps(setTab: (tab: 'ingresos' | 'egresos' | 'resumen') => void): PageGuideStep[] {
  return [
    // ── Ingresos ──────────────────────────────────────────────────────────
    {
      id: 'payments-tab-ingresos',
      target: '[data-tour="payments-tab-ingresos"]',
      placement: 'bottom',
      title: 'Ingresos',
      body: 'Empecemos por Ingresos, donde registras y das seguimiento a los cobros de tu clínica.',
      onBeforeShow: () => setTab('ingresos'),
    },
    {
      id: 'payments-ingresos-kpis',
      target: '[data-tour="payments-ingresos-kpis"]',
      placement: 'bottom',
      title: 'Ingresos: tus KPIs',
      body: 'Aquí verás tus ingresos cobrados, facturas pendientes y montos vencidos.',
    },
    {
      id: 'payments-ingresos-search',
      target: '[data-tour="payments-search"]',
      placement: 'bottom',
      title: 'Buscador',
      body: 'Busca un ingreso por paciente o ID de factura.',
    },
    {
      id: 'payments-ingresos-filters',
      target: '[data-tour="payments-filters"]',
      placement: 'bottom',
      title: 'Filtros',
      body: 'Filtra tus ingresos por fecha y por estado (Pendiente, Pagado, Vencido).',
    },
    {
      id: 'payments-ingresos-export',
      target: '[data-tour="payments-export"]',
      placement: 'left',
      title: 'Exportar información',
      body: 'Exporta tus ingresos a CSV, ya sea con el filtro activo o todo el historial.',
    },
    {
      id: 'payments-ingresos-table',
      target: '[data-tour="payments-ingresos-table"]',
      placement: 'top',
      title: 'Ingresos registrados',
      body: 'Aquí verás la tabla con todos tus ingresos registrados. Haz clic en cualquiera para editarlo.',
    },

    // ── Egresos ───────────────────────────────────────────────────────────
    {
      id: 'payments-tab-egresos',
      target: '[data-tour="payments-tab-egresos"]',
      placement: 'bottom',
      title: 'Ahora vamos a Egresos',
      body: 'En Egresos registras los gastos de tu clínica: renta, personal, equipo, marketing, etc.',
      onBeforeShow: () => setTab('egresos'),
    },
    {
      id: 'payments-egresos-kpis',
      target: '[data-tour="payments-egresos-kpis"]',
      placement: 'bottom',
      title: 'Egresos: tus KPIs',
      body: 'Aquí verás tus egresos pagados, pendientes y el total general.',
    },
    {
      id: 'payments-egresos-search',
      target: '[data-tour="payments-search"]',
      placement: 'bottom',
      title: 'Buscador',
      body: 'Busca un egreso por categoría o descripción.',
    },
    {
      id: 'payments-egresos-filters',
      target: '[data-tour="payments-filters"]',
      placement: 'bottom',
      title: 'Filtros',
      body: 'Filtra tus egresos por fecha y por estado.',
    },
    {
      id: 'payments-egresos-export',
      target: '[data-tour="payments-export"]',
      placement: 'left',
      title: 'Exportar información',
      body: 'Exporta tus egresos a CSV, con el filtro activo o todo el historial.',
    },
    {
      id: 'payments-egresos-table',
      target: '[data-tour="payments-egresos-table"]',
      placement: 'top',
      title: 'Egresos registrados',
      body: 'Aquí verás la tabla con todos tus egresos registrados. Haz clic en cualquiera para editarlo.',
    },

    // ── Resumen ───────────────────────────────────────────────────────────
    {
      id: 'payments-tab-resumen',
      target: '[data-tour="payments-tab-resumen"]',
      placement: 'bottom',
      title: 'Ahora vamos a Resumen',
      body: 'En Resumen ves el balance general de tu clínica, combinando ingresos y egresos.',
      onBeforeShow: () => setTab('resumen'),
    },
    {
      id: 'payments-resumen-period',
      target: '[data-tour="payments-period-filter"]',
      placement: 'bottom',
      title: 'Filtra por período',
      body: 'Elige el período que quieres ver reflejado en tu resumen general.',
    },
    {
      id: 'payments-resumen-summary',
      target: '[data-tour="payments-resumen-summary"]',
      placement: 'top',
      title: 'Balance neto del período',
      body: 'Estos 3 KPIs son para conocer el balance neto del período seleccionado: ingresos cobrados, egresos pagados y tu balance neto.',
    },
    {
      id: 'payments-pending-row',
      target: '[data-tour="payments-pending-row"]',
      placement: 'top',
      title: 'Pendientes',
      body: 'Abajo tendrás los pagos pendientes por cobrar y los egresos pendientes de pago.',
    },
    {
      id: 'payments-category-breakdown',
      target: '[data-tour="payments-category-breakdown"]',
      placement: 'top',
      title: 'Desglose por categoría',
      body: 'Y abajo, el desglose de tus egresos por categoría en el período seleccionado.',
    },
  ];
}
