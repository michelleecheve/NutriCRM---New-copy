export interface PageGuideStep {
  id: string;
  /** selector(es) CSS del elemento a resaltar. Un array resalta la unión de varios elementos a la vez. Omitir para una tarjeta sin spotlight. */
  target?: string | string[];
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  standalonePosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** texto del botón de avanzar de este paso — default 'Siguiente' (usar 'Finalizar' en el último paso) */
  nextLabel?: string;
  /** si se define, el paso se renderiza como tarjeta ilustrada (diagrama de hoja) en vez del tooltip estándar — ver MenuIllustratedStepCard */
  illustration?: 'hoja1' | 'hoja2' | 'hoja3';
  /** se ejecuta al mostrar este paso — para expandir un panel colapsado antes de resaltarlo */
  onBeforeShow?: () => void;
  /** si se define, este paso no muestra el botón "Siguiente": espera a que el usuario haga click en el selector indicado (el elemento real de la app) para avanzar solo */
  waitForClickTarget?: string;
  /** si es true junto con waitForClickTarget, además del click real muestra el botón "Siguiente" como respaldo (ej. cuando el elemento esperado podría ya no estar visible porque la usuaria adelantó ese paso) */
  waitForClickShowManualNext?: boolean;
}
