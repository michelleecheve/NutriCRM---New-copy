import { supabase } from './supabase';

export interface StorageSaved {
  chart?: {
    range?: 'ytd' | '3m' | '6m' | '12m';
    type?: 'bars' | 'line' | 'both';
    showExpenses?: boolean;
    tooltipShowExpenses?: boolean;
    tooltipShowNeto?: boolean;
    tooltipShowCitas?: boolean;
  };
  dashboard?: {
    filterStatus?: string[];
    sortOrder?: 'ultimo' | 'reciente' | 'alfabetico';
    searchTerm?: string;
    lastSelectedOrder?: string[];
  };
  calendar?: {
    view?: 'month' | 'week';
    statusFilter?: string[];
  };
  menus?: {
    configOpen?: boolean;
    sections?: Record<string, boolean>;
    locked?: boolean;
    bannerPinned?: boolean;
  };
  onboarding?: {
    active?: boolean;
    currentChapter?: number;
    currentStepIndex?: number;
    chaptersCompleted?: number[];
    chaptersSkipped?: number[];
    chaptersStarted?: number[];
    demoPatientId?: string | null;
    demoPatientName?: string;
    examplePatientId?: string | null;
    examplePatientSeeded?: boolean;
    finishedAt?: string;
    lastSeenVersion?: number;
    pageGuidesEnabled?: boolean;
    formGuidesEnabled?: boolean;
    welcomeDismissedForever?: boolean;
  };
}

const LOCAL_KEY = 'nutriflow_prefs_v1';

function deepGet(obj: any, path: string, fallback: any): any {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return fallback;
    cur = cur[p];
  }
  return cur ?? fallback;
}

function deepSet(obj: any, path: string, value: any): any {
  const parts = path.split('.');
  const result = { ...obj };
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = { ...(cur[parts[i]] ?? {}) };
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return result;
}

function deepMerge(base: any, override: any): any {
  if (!override || typeof override !== 'object') return base ?? {};
  const result = { ...(base ?? {}) };
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key])
    ) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

class PrefsService {
  private cache: StorageSaved = {};
  private userId: string | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private unloadFlushAttached = false;

  // Adelanta el guardado pendiente (sin esperar los 800ms del debounce) cuando el
  // usuario cambia de pestaña o cierra el navegador, para no perder el último cambio.
  private attachUnloadFlush(): void {
    if (this.unloadFlushAttached) return;
    this.unloadFlushAttached = true;
    const flushNow = () => {
      if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
      this.flushToDB();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushNow();
    });
    window.addEventListener('pagehide', flushNow);
  }

  // Called synchronously before components mount — reads localStorage so useState initializers work
  initSync(userId: string): void {
    this.userId = userId;
    this.attachUnloadFlush();
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY}_${userId}`);
      if (raw) {
        this.cache = JSON.parse(raw);
        return;
      }
      // First time with new system — migrate from old individual keys
      this.cache = this.migrateFromLegacy(userId);
      if (Object.keys(this.cache).length > 0) {
        this.persistLocal();
      }
    } catch {
      this.cache = {};
    }
  }

  private migrateFromLegacy(userId: string): StorageSaved {
    const cache: StorageSaved = {};

    try {
      const raw = localStorage.getItem(`nutriflow_chart_config_v1_${userId}`);
      if (raw) {
        const d = JSON.parse(raw);
        cache.chart = {
          range: d.chartRange,
          type: d.chartType,
          showExpenses: d.showExpenses,
          tooltipShowExpenses: d.tooltipShowExpenses,
          tooltipShowNeto: d.tooltipShowNeto,
          tooltipShowCitas: d.tooltipShowCitas,
        };
      }
    } catch {}

    try {
      const raw = localStorage.getItem(`nutriflow_dashboard_filters_v1_${userId}`);
      if (raw) {
        const d = JSON.parse(raw);
        cache.dashboard = {
          filterStatus: d.filterStatus,
          sortOrder: d.sortOrder,
          searchTerm: d.searchTerm,
        };
      }
    } catch {}

    try {
      const raw = localStorage.getItem(`nutriflow_last_selected_v1_${userId}`);
      if (raw) {
        cache.dashboard = { ...cache.dashboard, lastSelectedOrder: JSON.parse(raw) };
      }
    } catch {}

    try {
      const raw = localStorage.getItem(`nutriflow_cal_view_v1_${userId}`)
        ?? localStorage.getItem('nutriflow_cal_view_v1');
      if (raw) {
        cache.calendar = { view: raw === 'week' ? 'week' : 'month' };
      }
    } catch {}

    try {
      const raw = localStorage.getItem('nutriflow_menu_section_config');
      if (raw !== null) {
        cache.menus = { ...cache.menus, configOpen: raw === 'true' };
      }
    } catch {}

    try {
      const raw = localStorage.getItem('nutriflow_menu_locked');
      if (raw !== null) {
        cache.menus = { ...cache.menus, locked: raw === 'true' };
      }
    } catch {}

    try {
      const raw = localStorage.getItem('nutriflow_banner_pinned');
      if (raw !== null) {
        cache.menus = { ...cache.menus, bannerPinned: raw !== 'false' };
      }
    } catch {}

    try {
      const sections: Record<string, boolean> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('nutriflow_menu_section_') && key !== 'nutriflow_menu_section_config') {
          const sectionKey = key.replace('nutriflow_menu_section_', '');
          sections[sectionKey] = localStorage.getItem(key) === 'true';
        }
      }
      if (Object.keys(sections).length > 0) {
        cache.menus = { ...cache.menus, sections };
      }
    } catch {}

    return cache;
  }

  // Called after the main store fetches from DB — syncs DB values into cache
  async loadFromDB(userId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('storage_saved')
        .eq('id', userId)
        .single();
      if (data?.storage_saved && Object.keys(data.storage_saved).length > 0) {
        this.cache = deepMerge(this.cache, data.storage_saved);
        this.persistLocal();
      }
    } catch {
      // localStorage remains the fallback
    }
  }

  get<T>(path: string, fallback: T): T {
    return deepGet(this.cache, path, fallback) as T;
  }

  set(path: string, value: any): void {
    this.cache = deepSet(this.cache, path, value);
    this.persistLocal();
    this.scheduleSave();
  }

  private persistLocal(): void {
    if (!this.userId) return;
    try {
      localStorage.setItem(`${LOCAL_KEY}_${this.userId}`, JSON.stringify(this.cache));
    } catch {}
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushToDB(), 800);
  }

  async flushToDB(): Promise<void> {
    if (!this.userId || this.userId === 'guest') return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ storage_saved: this.cache })
        .eq('id', this.userId);
      if (error) console.error('prefsService: error guardando storage_saved en Supabase:', error);
    } catch (err) {
      console.error('prefsService: excepción guardando storage_saved en Supabase:', err);
    }
  }

  reset(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.cache = {};
    this.userId = null;
  }
}

export const prefsService = new PrefsService();
