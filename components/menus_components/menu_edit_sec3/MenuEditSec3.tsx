import React from 'react';
import { MenuPlanData } from '../MenuDesignTemplates';
import { PortionsRecord } from '../../../types';
import { MenuTableHeaderSec3 } from './MenuTableHeaderSec3';
import { MenuTablePortionsSec3 } from './MenuTablePortionsSec3';
import { MenuWeeklyTableEditorSec3 } from './MenuWeeklyTableEditorSec3';
import { MenuPage2Sec3 } from './MenuPage2Sec3';

interface Props {
  menuPreviewData: MenuPlanData;
  setMenuPreviewData: (d: MenuPlanData) => void;
  portions: PortionsRecord;
  visible?: boolean;
}

export const MenuEditSec3: React.FC<Props> = ({ menuPreviewData, setMenuPreviewData, portions, visible }) => {
  // key forces MenuWeeklyTableEditorSec3 to remount when meal structure changes
  const mealOrderKey = menuPreviewData.weeklyMenu.lunes.mealsOrder?.join(',') || 'default';

  return (
    <div className="space-y-3">
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
    </div>
  );
};
