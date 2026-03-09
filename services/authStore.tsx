import { AppUser, PagePermission, UserProfile } from '../types';

// ─── Seed Users (base) ────────────────────────────────────────────────────────

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

const NUTRICIONISTA2_PROFILE: UserProfile = {
  professionalTitle: 'Lic.',
  name: 'Carla Fernández',
  specialty: 'Nutrición Clínica',
  licenseNumber: '789012',
  email: 'nutri2@nutricrm.com',
  contactEmail: 'nutri2@nutricrm.com',
  phone: '+502 40000000',
  personalPhone: '+502 41111111',
  instagramHandle: 'nutri.carla',
  address: 'Ciudad de Guatemala',
  website: 'carlanutricion.com',
  avatar: '',
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

const SEED_USERS: AppUser[] = [
  {
    id: 'admin-001',
    email: 'admin@nutricrm.com',
    password: 'admin123',
    role: 'admin',
    profile: ADMIN_PROFILE,
    // linkCode se asigna automáticamente al cargar (ver ensureLinkCodes)
  } as any,
  {
    id: 'nutri-001',
    email: 'blancamoralesc96@gmail.com',
    password: 'nutri123',
    role: 'nutricionista',
    profile: NUTRICIONISTA_PROFILE,
    linkedReceptionistIds: [],
  } as any,
  {
    id: 'nutri-002',
    email: 'nutri2@nutricrm.com',
    password: 'nutri123',
    role: 'nutricionista',
    profile: NUTRICIONISTA2_PROFILE,
    linkedReceptionistIds: [],
  } as any,
  {
    id: 'recep-001',
    email: 'secretaria@nutricrm.com',
    password: 'recep123',
    role: 'recepcionista',
    profile: RECEPCIONISTA_PROFILE,
    linkedNutritionistIds: [],
  } as any,
];

// ─── Default Permissions ──────────────────────────────────────────────────────

export const DEFAULT_PERMISSIONS: PagePermission[] = [
  { pageId: 'main', label: 'Panel Principal (Nutricionista)', roles: ['admin', 'nutricionista'] },
  { pageId: 'main-receptionist', label: 'Panel Principal (Recepcionista)', roles: ['admin', 'recepcionista'] },
  { pageId: 'dashboard', label: 'Pacientes', roles: ['admin', 'nutricionista'] },
  { pageId: 'menus', label: 'Menús', roles: ['admin', 'nutricionista'] },
  { pageId: 'payments', label: 'Pagos', roles: ['admin', 'nutricionista'] },
  {
    pageId: 'calendar',
    label: 'Calendario',
    roles: ['admin', 'nutricionista', 'recepcionista'],
    modules: [
      {
        moduleId: 'calendar-selector',
        label: 'Selector de Calendario (elegir nutricionista)',
        roles: ['admin', 'recepcionista'],
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
        roles: ['admin', 'nutricionista', 'recepcionista'],
      },
      {
        moduleId: 'profile-vinculacion-recepcionistas',
        label: 'Vinculación con Recepcionistas',
        roles: ['admin', 'nutricionista'],
      },
      {
        moduleId: 'profile-vinculacion-nutricionistas',
        label: 'Vinculación con Nutricionistas',
        roles: ['admin', 'recepcionista'],
      },
    ],
  },
  { pageId: 'admin', label: 'Panel de Administración', roles: ['admin'] },
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'nutricrm_session_v1';
const PERMISSIONS_KEY = 'nutricrm_permissions_v1.1';
const USERS_KEY = 'nutricrm_users_v1';

// ─── Utils ───────────────────────────────────────────────────────────────────

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

const randomBase36 = (len: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const rolePrefixForLinkCode = (role: string) => {
  if (role === 'nutricionista') return 'NUTRI';
  if (role === 'recepcionista') return 'RECEP';
  if (role === 'admin') return 'ADMIN';
  return 'USER';
};

const generateLinkCode = (role: string) => `${rolePrefixForLinkCode(role)}-${randomBase36(6)}`;

const ensureLinkCodes = (users: AppUser[]): AppUser[] => {
  const used = new Set<string>();
  for (const u of users as any[]) {
    if (u.linkCode) used.add(u.linkCode);
  }

  const next = (users as any[]).map(u => {
    if (u.linkCode) return u;
    let code = generateLinkCode(u.role);
    while (used.has(code)) code = generateLinkCode(u.role);
    used.add(code);
    return { ...u, linkCode: code };
  });

  return next as AppUser[];
};

const mergePermissions = (stored: PagePermission[] | null, defaults: PagePermission[]): PagePermission[] => {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return defaults;

  const storedById = new Map(stored.map(p => [p.pageId, p]));

  const merged: PagePermission[] = defaults.map(defPage => {
    const stPage = storedById.get(defPage.pageId);
    if (!stPage) return defPage;

    const mergedRoles = uniq([...(stPage.roles ?? []), ...(defPage.roles ?? [])]);

    const defModules = defPage.modules ?? [];
    const stModules = stPage.modules ?? [];
    const stModulesById = new Map(stModules.map(m => [m.moduleId, m]));

    const mergedModules = defModules.map(defMod => {
      const stMod = stModulesById.get(defMod.moduleId);
      if (!stMod) return defMod;

      return {
        ...defMod,
        label: defMod.label,
        roles: uniq([...(stMod.roles ?? []), ...(defMod.roles ?? [])]),
      };
    });

    const defModuleIds = new Set(defModules.map(m => m.moduleId));
    const extraStoredModules = stModules.filter(m => !defModuleIds.has(m.moduleId));

    return { ...defPage, label: defPage.label, roles: mergedRoles, modules: [...mergedModules, ...extraStoredModules] };
  });

  const defPageIds = new Set(defaults.map(p => p.pageId));
  const extraStoredPages = stored.filter(p => !defPageIds.has(p.pageId));

  return [...merged, ...extraStoredPages];
};

const loadUsers = (): AppUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const base = raw ? (JSON.parse(raw) as AppUser[]) : SEED_USERS;
    const ensured = ensureLinkCodes(Array.isArray(base) && base.length > 0 ? base : SEED_USERS);
    localStorage.setItem(USERS_KEY, JSON.stringify(ensured));
    return ensured;
  } catch {
    const ensured = ensureLinkCodes(SEED_USERS);
    localStorage.setItem(USERS_KEY, JSON.stringify(ensured));
    return ensured;
  }
};

const saveUsers = (users: AppUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getUserById = (users: AppUser[], id: string) => users.find(u => u.id === id);
const getUserByLinkCode = (users: AppUser[], linkCode: string) =>
  (users as any[]).find(u => (u.linkCode || '').toUpperCase() === linkCode.toUpperCase());

// ─── Auth Store ──────────────────────────────────────────────────────────────

class AuthStore {
  private currentUser: AppUser | null = null;
  private permissions: PagePermission[] = [];
  private selectedNutritionistId: string | null = null;

  private users: AppUser[] = [];

  constructor() {
    this.users = loadUsers();

    // Restore session
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) this.currentUser = JSON.parse(raw);
    } catch {
      this.currentUser = null;
    }

    // Restore permissions + merge
    try {
      const raw = localStorage.getItem(PERMISSIONS_KEY);
      const stored = raw ? (JSON.parse(raw) as PagePermission[]) : null;
      this.permissions = mergePermissions(stored, DEFAULT_PERMISSIONS);
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(this.permissions));
    } catch {
      this.permissions = DEFAULT_PERMISSIONS;
    }
  }

  getAllUsers(): AppUser[] {
    return this.users;
  }

  private commitUsers(nextUsers: AppUser[]) {
    this.users = ensureLinkCodes(nextUsers);
    saveUsers(this.users);

    if (this.currentUser) {
      const refreshed = getUserById(this.users, this.currentUser.id);
      if (refreshed) {
        this.currentUser = refreshed;
        localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
      }
    }
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  login(email: string, password: string): AppUser | null {
    const user = this.users.find(u => u.email === email && u.password === password);
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

  // ── Permissions ─────────────────────────────────────────────────────────

  getPermissions(): PagePermission[] {
    return this.permissions;
  }

  updatePermissions(permissions: PagePermission[]): void {
    this.permissions = mergePermissions(permissions, DEFAULT_PERMISSIONS);
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(this.permissions));
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

  // ── Linked Users ─────────────────────────────────────────────────────────

  getLinkedNutritionists(): AppUser[] {
    if (this.currentUser?.role === 'admin') return this.users.filter(u => u.role === 'nutricionista');
    if (!this.currentUser?.linkedNutritionistIds) return [];
    return this.users.filter(u => u.role === 'nutricionista' && this.currentUser!.linkedNutritionistIds!.includes(u.id));
  }

  getLinkedReceptionists(): AppUser[] {
    if (!this.currentUser?.linkedReceptionistIds) return [];
    return this.users.filter(u => u.role === 'recepcionista' && this.currentUser!.linkedReceptionistIds!.includes(u.id));
  }

  // ── Vinculación por LINK CODE (no por ID) ────────────────────────────────

  linkReceptionistToNutritionistByCode(code: string): { ok: boolean; message: string } {
    const current = this.currentUser;
    if (!current || current.role !== 'nutricionista') return { ok: false, message: 'No autorizado.' };

    const receptionist = getUserByLinkCode(this.users, code.trim());
    if (!receptionist || receptionist.role !== 'recepcionista') {
      return { ok: false, message: 'Código inválido. No se encontró una recepcionista con ese código.' };
    }

    const nutri = getUserById(this.users, current.id);
    if (!nutri) return { ok: false, message: 'Usuario no encontrado.' };

    const already = (nutri.linkedReceptionistIds ?? []).includes(receptionist.id);
    if (already) return { ok: false, message: 'Esta recepcionista ya está vinculada.' };

    const nextUsers = this.users.map(u => {
      if (u.id === nutri.id) {
        return { ...u, linkedReceptionistIds: uniq([...(u.linkedReceptionistIds ?? []), receptionist.id]) };
      }
      if (u.id === receptionist.id) {
        return { ...u, linkedNutritionistIds: uniq([...(u.linkedNutritionistIds ?? []), nutri.id]) };
      }
      return u;
    });

    this.commitUsers(nextUsers);
    return { ok: true, message: `Recepcionista ${receptionist.profile.name} vinculada correctamente.` };
  }

  linkNutritionistToReceptionistByCode(code: string): { ok: boolean; message: string } {
    const current = this.currentUser;
    if (!current || current.role !== 'recepcionista') return { ok: false, message: 'No autorizado.' };

    const nutritionist = getUserByLinkCode(this.users, code.trim());
    if (!nutritionist || nutritionist.role !== 'nutricionista') {
      return { ok: false, message: 'Código inválido. No se encontró una nutricionista con ese código.' };
    }

    const recep = getUserById(this.users, current.id);
    if (!recep) return { ok: false, message: 'Usuario no encontrado.' };

    const already = (recep.linkedNutritionistIds ?? []).includes(nutritionist.id);
    if (already) return { ok: false, message: 'Esta nutricionista ya está vinculada.' };

    const nextUsers = this.users.map(u => {
      if (u.id === recep.id) {
        return { ...u, linkedNutritionistIds: uniq([...(u.linkedNutritionistIds ?? []), nutritionist.id]) };
      }
      if (u.id === nutritionist.id) {
        return { ...u, linkedReceptionistIds: uniq([...(u.linkedReceptionistIds ?? []), recep.id]) };
      }
      return u;
    });

    this.commitUsers(nextUsers);
    return { ok: true, message: `Nutricionista ${nutritionist.profile.name} vinculada correctamente.` };
  }

  unlinkReceptionistFromNutritionist(receptionistId: string): { ok: boolean; message: string } {
    const current = this.currentUser;
    if (!current || current.role !== 'nutricionista') return { ok: false, message: 'No autorizado.' };

    const nutri = getUserById(this.users, current.id);
    const recep = getUserById(this.users, receptionistId);
    if (!nutri || !recep || recep.role !== 'recepcionista') return { ok: false, message: 'Usuario no encontrado.' };

    const nextUsers = this.users.map(u => {
      if (u.id === nutri.id) {
        return { ...u, linkedReceptionistIds: (u.linkedReceptionistIds ?? []).filter(id => id !== receptionistId) };
      }
      if (u.id === recep.id) {
        return { ...u, linkedNutritionistIds: (u.linkedNutritionistIds ?? []).filter(id => id !== nutri.id) };
      }
      return u;
    });

    this.commitUsers(nextUsers);
    return { ok: true, message: `Recepcionista ${recep.profile.name} desvinculada.` };
  }

  unlinkNutritionistFromReceptionist(nutritionistId: string): { ok: boolean; message: string } {
    const current = this.currentUser;
    if (!current || current.role !== 'recepcionista') return { ok: false, message: 'No autorizado.' };

    const recep = getUserById(this.users, current.id);
    const nutri = getUserById(this.users, nutritionistId);
    if (!recep || !nutri || nutri.role !== 'nutricionista') return { ok: false, message: 'Usuario no encontrado.' };

    const nextUsers = this.users.map(u => {
      if (u.id === recep.id) {
        return { ...u, linkedNutritionistIds: (u.linkedNutritionistIds ?? []).filter(id => id !== nutritionistId) };
      }
      if (u.id === nutri.id) {
        return { ...u, linkedReceptionistIds: (u.linkedReceptionistIds ?? []).filter(id => id !== recep.id) };
      }
      return u;
    });

    this.commitUsers(nextUsers);
    return { ok: true, message: `Nutricionista ${nutri.profile.name} desvinculada.` };
  }

  // ── Calendar Selector ────────────────────────────────────────────────────

  getSelectedNutritionistId(): string | null {
    if (!this.selectedNutritionistId) {
      const linked = this.getLinkedNutritionists();
      return linked.length > 0 ? linked[0].id : null;
    }
    return this.selectedNutritionistId;
  }

  setSelectedNutritionistId(id: string): void {
    this.selectedNutritionistId = id;
  }

  // ── Profile update ───────────────────────────────────────────────────────

  updateCurrentUserProfile(profile: UserProfile): void {
    if (!this.currentUser) return;
    const nextUsers = this.users.map(u => (u.id === this.currentUser!.id ? { ...u, profile } : u));
    this.commitUsers(nextUsers);
  }

  getUserProfile(): UserProfile {
    return this.currentUser?.profile ?? NUTRICIONISTA_PROFILE;
  }
}

export const authStore = new AuthStore();