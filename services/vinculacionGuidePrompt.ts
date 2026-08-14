// Bandera de una sola vez para el flujo "Agregar nutricionistas": el botón del
// panel principal de la recepcionista la enciende antes de navegar a Perfil, y
// el bloque de Vinculación con Nutricionistas la consume al montarse para
// abrirse solo y arrancar su guía. sessionStorage (no localStorage) porque solo
// debe sobrevivir esa navegación puntual, no quedar pegada entre sesiones.
const FLAG_KEY = 'nutriflow_open_vinculacion_nutri_guide';

export function requestVinculacionNutriGuide(): void {
  sessionStorage.setItem(FLAG_KEY, '1');
}

export function consumeVinculacionNutriGuideRequest(): boolean {
  const requested = sessionStorage.getItem(FLAG_KEY) === '1';
  if (requested) sessionStorage.removeItem(FLAG_KEY);
  return requested;
}
