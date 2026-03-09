// ─── authStore.ts ─────────────────────────────────────────────────────────────
// Maneja sesión, roles y permisos. 
// El store.ts existente NO se toca — sigue manejando patients, invoices, etc.
// ──────────────────────────────────────────────────────────────────────────────

import { AppUser, UserRole, PagePermission, UserProfile } from '../types';

// ─── Mock Users ───────────────────────────────────────────────────────────────

const NUTRICIONISTA_PROFILE: UserProfile = {
  professionalTitle: 'Lic.',
  name: 'Blanca Morales',
  specialty: 'Nutricionista Deportiva',
  licenseNumber: '123456',
  email: 'blancamoralesc96@gmail.com',
  contactEmail: 'blancamoralesc96@gmail.com',
  phone: '+502 30508872',
  personalPhone: '+502 50178353',
  instagramHandle: 'blancamoorales',
  address: 'Edificio Medika 10, Clínica Vascure Nivel 12 - 1211, 6a Avenida 04-01, Zona 10, Ciudad de Guatemala',
  website: 'blancamoralesnutricion.com',
  avatar: 'https://user3047.na.imgto.link/public/20260225/isotipo-beige-fondo-verde-circular.avif',
  timezone: 'UTC-06:00',
};

const RECEPCIONISTA_PROFILE: UserProfile = {
  name: 'María López',
  specialty: 'Recepcionista',
  email: 'secretaria@nutricrm.com',
  contactEmail: 'secretaria@nutricrm.com',
  phone: '+502 30508872',
  personalPhone: '+502 55667788',
  address: 'Edificio Medika 10, Zona 10, Ciudad de Guatemala',
  avatar: '',
  timezone: 'UTC-06:00',
};

const ADMIN_PROFILE: UserProfile = {
  name: 'Admin NutriCRM',
  specialty: 'Administrador',
  email: 'admin@nutricrm.com',
  contactEmail: 'admin@nutricrm.com',
  phone: '',
  avatar: '',
  timezone: 'UTC-06:00',
};

export const MOCK_USERS: AppUser[] = [
  {
    id: 'admin-001',
    email: 'admin@nutricrm.com',
    password: 'admin123',
    role: 'admin',
    profile: ADMIN_PROFILE,
  },
  {
    id: 'nutri-001',
    email: 'blancamoralesc96@gmail.com',
    password: 'nutri123',
    role: 'nutricionista',
    profile: NUTRICIONISTA_PROFILE,
    linkedReceptionistIds: ['recep-001'],
  },
  {
    id: 'recep-001',
    email: 'secretaria@nutricrm.com',
    password: 'recep123',
    role: 'recepcionista',
    profile: RECEPCIONISTA_PROFILE,
    linkedNutritionistIds: ['nutri-001'],
  },
];

// ─── Default Permissions ──────────────────────────────────────────────────────

export const DEFAULT_PERMISSIONS: PagePermission[] = [
  {
    pageId: 'main',
    label: 'Panel Principal (Nutricionista)',
    roles: ['admin', 'nutricionista'],
  },
  {
    pageId: 'main-receptionist',
    label: 'Panel Principal (Recepcionista)',
    roles: ['admin', 'recepcionista'],
  },
  {
    pageId: 'dashboard',
    label: 'Pacientes',
    roles: ['admin', 'nutricionista'],
  },
  {
    pageId: 'menus',
    label: 'Menús',
    roles: ['admin', 'nutricionista'],
  },
  {
    pageId: 'payments',
    label: 'Pagos',
    roles: ['admin', 'nutricionista'],
  },
  {
    pageId: 'calendar',
    label: 'Calendario',
    roles: ['admin', 'nutricionista', 'recepcionista'],
    modules: [
      {
        moduleId: 'calendar-selector',
        label: 'Selector de Calendario (elegir nutricionista)',
        roles: ['recepcionista'],
      },
    ],
  },
  {
    pageId: 'profile',
    label: 'Configuración / Perfil',
    roles: ['admin', 'nutricionista', 'recepcionista'],
    modules: [
      {
        moduleId: 'profile-nutri-fields',
        label: 'Campos profesionales (Título, Especialidad, Colegiado, Instagram, Web)',
        roles: ['admin', 'nutricionista'],
      },
      {
        moduleId: 'profile-sistema',
        label: 'Configuración de Sistema (Zona Horaria)',
        roles: ['admin', 'nutricionista'],
      },
      {
        moduleId: 'profile-vinculacion',
        label: 'Vinculación con Recepcionistas',
        roles: ['admin', 'nutricionista'],
      },
    ],
  },
  {
    pageId: 'admin',
    label: 'Panel de Administración',
    roles: ['admin'],
  },
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'nutricrm_session_v1';
const PERMISSIONS_KEY = 'nutricrm_permissions_v1';

// ─── Auth Store Class ─────────────────────────────────────────────────────────

class AuthStore {
  private currentUser: AppUser | null = null;
  private permissions: PagePermission[] = [];
  private selectedNutritionistId: string | null = null;

  constructor() {
    // Restore session from localStorage
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) this.currentUser = JSON.parse(raw);
    } catch { this.currentUser = null; }

    // Restore permissions (admin may have customized them)
    try {
      const raw = localStorage.getItem(PERMISSIONS_KEY);
      this.permissions = raw ? JSON.parse(raw) : DEFAULT_PERMISSIONS;
    } catch { this.permissions = DEFAULT_PERMISSIONS; }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  login(email: string, password: string): AppUser | null {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) return null;
    this.currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  logout(): void {
    this.currentUser = null;
    this.selectedNutritionistId = null;
    localStorage.removeItem(SESSION_KEY);
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // ── Permissions ───────────────────────────────────────────────────────────

  getPermissions(): PagePermission[] {
    return this.permissions;
  }

  updatePermissions(permissions: PagePermission[]): void {
    this.permissions = permissions;
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  canAccessPage(pageId: string): boolean {
    if (!this.currentUser) return false;
    const page = this.permissions.find(p => p.pageId === pageId);
    if (!page) return false;
    return page.roles.includes(this.currentUser.role);
  }

  canAccessModule(pageId: string, moduleId: string): boolean {
    if (!this.currentUser) return false;
    const page = this.permissions.find(p => p.pageId === pageId);
    if (!page?.modules) return false;
    const mod = page.modules.find(m => m.moduleId === moduleId);
    if (!mod) return false;
    return mod.roles.includes(this.currentUser.role);
  }

  // ── Linked Users ──────────────────────────────────────────────────────────

  getLinkedNutritionists(): AppUser[] {
    if (!this.currentUser?.linkedNutritionistIds) return [];
    return MOCK_USERS.filter(u =>
      u.role === 'nutricionista' &&
      this.currentUser!.linkedNutritionistIds!.includes(u.id)
    );
  }

  getLinkedReceptionists(): AppUser[] {
    if (!this.currentUser?.linkedReceptionistIds) return [];
    return MOCK_USERS.filter(u =>
      u.role === 'recepcionista' &&
      this.currentUser!.linkedReceptionistIds!.includes(u.id)
    );
  }

  // ── Calendar Selector (recepcionista) ─────────────────────────────────────

  getSelectedNutritionistId(): string | null {
    // Default to first linked nutritionist
    if (!this.selectedNutritionistId) {
      const linked = this.getLinkedNutritionists();
      return linked.length > 0 ? linked[0].id : null;
    }
    return this.selectedNutritionistId;
  }

  setSelectedNutritionistId(id: string): void {
    this.selectedNutritionistId = id;
  }

  // ── Profile update (for current user) ────────────────────────────────────

  updateCurrentUserProfile(profile: UserProfile): void {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, profile };
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
    // Also update in MOCK_USERS in memory
    const idx = MOCK_USERS.findIndex(u => u.id === this.currentUser!.id);
    if (idx !== -1) MOCK_USERS[idx] = this.currentUser;
  }

  // Helper: get profile of current user (compatible with existing store usage)
  getUserProfile(): UserProfile {
    return this.currentUser?.profile ?? NUTRICIONISTA_PROFILE;
  }
}

export const authStore = new AuthStore();