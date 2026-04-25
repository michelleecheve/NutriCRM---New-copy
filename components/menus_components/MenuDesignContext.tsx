import { createContext, useContext } from 'react';
import type { VisualThemeConfig } from '../../types';

interface MenuDesignOverride {
  visualTheme?: VisualThemeConfig;
}

export const MenuDesignOverrideContext = createContext<MenuDesignOverride | null>(null);

export function useDesignOverride(): MenuDesignOverride | null {
  return useContext(MenuDesignOverrideContext);
}
