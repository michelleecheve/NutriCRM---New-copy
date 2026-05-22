import React from 'react';
import { Calendar, ArrowUpDown } from 'lucide-react';
import { MenuPlanData, ExchangeMeal } from '../MenuDesignTemplates';
import { PortionsRecord } from '../../../types';
import { MenuTableHeaderSec3 } from './MenuTableHeaderSec3';
import { MenuTablePortionsSec3 } from './MenuTablePortionsSec3';
import { MenuWeeklyTableEditorSec3 } from './MenuWeeklyTableEditorSec3';
import { MenuPage2Sec3 } from './MenuPage2Sec3';
import { MenuPage3Sec3 } from './MenuPage3Sec3';
import { MenuExchangeEditorSec3 } from './MenuExchangeEditorSec3';

const DEFAULT_MEAL_ORDER = ['desayuno', 'refaccion1', 'almuerzo', 'refaccion2', 'cena'];
const DEFAULT_MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno', refaccion1: 'Refacción 1',
  almuerzo: 'Almuerzo', refaccion2: 'Refacción 2', cena: 'Cena',
};

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
  portions: PortionsRecord;
  visible?: boolean;
}

export const MenuEditSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData, portions, visible }) => {
  const menuType = menuPreviewData.menuType ?? 'semanal';
  const mealOrderKey = menuPreviewData.weeklyMenu.lunes.mealsOrder?.join(',') || 'default';

  function switchMenuType(type: 'semanal' | 'intercambio') {
    if (type === 'intercambio' && !menuPreviewData.exchangeMenu?.meals?.length) {
      // Initialize exchangeMenu from the weekly meal structure so ExchangePage renders immediately
      const order = menuPreviewData.weeklyMenu?.lunes?.mealsOrder || DEFAULT_MEAL_ORDER;
      const meals: ExchangeMeal[] = order.map(id => ({
        id,
        label: (menuPreviewData.weeklyMenu?.lunes as any)?.[id]?.label || DEFAULT_MEAL_LABELS[id] || id,
        examples: ['', ''],
      }));
      setMenuPreviewData({
        ...menuPreviewData,
        menuType: 'intercambio',
        exchangeMenu: { meals, note: '', hydration: '' },
      });
    } else {
      setMenuPreviewData({ ...menuPreviewData, menuType: type });
    }
  }

  return (
    <div className="space-y-3">
      {/* Tab switch */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de menú:</span>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => switchMenuType('semanal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              menuType === 'semanal'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-3 h-3 hidden sm:block" />
            Menú Semanal
          </button>
          <button
            onClick={() => switchMenuType('intercambio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              menuType === 'intercambio'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpDown className="w-3 h-3 hidden sm:block" />
            Intercambio de Alimentos
          </button>
        </div>
      </div>

      {menuType === 'semanal' ? (
        <>
          <MenuTableHeaderSec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
          <MenuTablePortionsSec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
            portions={portions}
          />
          <MenuWeeklyTableEditorSec3
            key={mealOrderKey}
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
            visible={visible}
          />
          <MenuPage2Sec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
          <MenuPage3Sec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
        </>
      ) : (
        <>
          <MenuTableHeaderSec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
          <MenuTablePortionsSec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
            portions={portions}
          />
          <MenuExchangeEditorSec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
          <MenuPage2Sec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
          <MenuPage3Sec3
            menuPreviewData={menuPreviewData}
            setMenuPreviewData={setMenuPreviewData}
          />
        </>
      )}
    </div>
  );
};
