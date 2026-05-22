// Barrel file — re-exports all public types and template components.
// All implementation lives in menudesigntemplates_components/.
// External imports (e.g. `import { MenuPlanData } from './MenuDesignTemplates'`) continue to work unchanged.

export type {
  MealPortions,
  DayMeal,
  MenuDay,
  DomingoData,
  DomingoV2,
  ExchangeMeal,
  ExchangeMenuData,
  MenuRecommendations,
  MenuPlanData,
  MealKey,
  WeekDayKey,
} from './menudesigntemplates_components/menuTemplateTypes';

export { isDomingoV2 } from './menudesigntemplates_components/menuTemplateTypes';

export { MenuTemplateV1 } from './menudesigntemplates_components/MenuTemplateV1';
export { MenuTemplateV2 } from './menudesigntemplates_components/MenuTemplateV2';
export { MenuTemplateExchange } from './menudesigntemplates_components/MenuTemplateExchange';
