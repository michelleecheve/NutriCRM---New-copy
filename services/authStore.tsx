import { AppUser, PagePermission, UserProfile, UserRole } from '../types';
import { store } from './store';
import { supabase } from './supabase';

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
      {
        moduleId: 'profile-ai-config',
        label: 'Configurador de IA (AI Configurator)',
        roles: ['admin', 'nutricionista'],
      },
    ],
  },
  { pageId: 'admin', label: 'Panel de Administración', roles: ['admin'] },
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'nutricrm_session_v1';
const PERMISSIONS_KEY = 'nutricrm_permissions_v1.1';

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
      return { ...defMod, label: defMod.label, roles: uniq([...(stMod.roles ?? []), ...(defMod.roles ?? [])]) };
    });
    const defModuleIds = new Set(defModules.map(m => m.moduleId));
    const extraStoredModules = stModules.filter(m => !defModuleIds.has(m.moduleId));
    return { ...defPage, label: defPage.label, roles: mergedRoles, modules: [...mergedModules, ...extraStoredModules] };
  });
  const defPageIds = new Set(defaults.map(p => p.pageId));
  const extraStoredPages = stored.filter(p => !defPageIds.has(p.pageId));
  return [...merged, ...extraStoredPages];
};

// ─── Mapper helper ────────────────────────────────────────────────────────────

const mapProfileToAppUser = (p: any): AppUser => ({
  id: p.id,
  email: p.email || '',
  role: p.role as UserRole,
  linkCode: p.link_code || '',
  linkedReceptionistIds: p.linked_receptionist_ids || [],
  linkedNutritionistIds: p.linked_nutritionist_ids || [],
  profile: {
    name:              p.name               || '',
    email:             p.email              || '',
    timezone:          p.timezone           || 'UTC-06:00',
    specialty:         p.specialty          || '',
    avatar:            p.avatar             || '',
    professionalTitle: p.professional_title || '',
    licenseNumber:     p.license_number     || '',
    phone:             p.phone              || '',
    personalPhone:     p.personal_phone     || '',
    contactEmail:      p.contact_email      || '',
    instagramHandle:   p.instagram_handle   || '',
    website:           p.website            || '',
    address:           p.address            || '',
  } as any,
});

// ─── Auth Store ──────────────────────────────────────────────────────────────

// Listeners para que App.tsx pueda reaccionar cuando la sesión termina de cargar
type AuthListener = () => void;

class AuthStore {
  private currentUser: AppUser | null = null;
  private permissions: PagePermission[] = [];
  private _linkedNutritionistsCache: AppUser[] | null = null;
  private selectedNutritionistId: string | null = null;
  public isLoading: boolean = true;
  private listeners: AuthListener[] = [];
  private recoveryListeners: AuthListener[] = [];

  // Permite a componentes suscribirse a cambios de auth
  onAuthReady(fn: AuthListener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  // Permite a App.tsx saber cuando llega un token de recuperación de contraseña
  onPasswordRecovery(fn: AuthListener): () => void {
    this.recoveryListeners.push(fn);
    return () => { this.recoveryListeners = this.recoveryListeners.filter(l => l !== fn); };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }

  private notifyRecovery() {
    this.recoveryListeners.forEach(fn => fn());
  }

  constructor() {
    // Restaurar sesión inmediatamente desde localStorage para evitar flash
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) this.currentUser = JSON.parse(raw) as AppUser;
    } catch {
      this.currentUser = null;
    }

    // Verificar/actualizar con Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        this.handleSupabaseSession(session);
      } else {
        this.currentUser = null;
        localStorage.removeItem(SESSION_KEY);
        this.isLoading = false;
        this.notifyListeners();
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.notifyRecovery();
        return;
      }
      if (session) {
        this.handleSupabaseSession(session);
      } else {
        this.currentUser = null;
        localStorage.removeItem(SESSION_KEY);
        this.isLoading = false;
        this.notifyListeners();
      }
    });

    try {
      const raw = localStorage.getItem(PERMISSIONS_KEY);
      const stored = raw ? (JSON.parse(raw) as PagePermission[]) : null;
      this.permissions = mergePermissions(stored, DEFAULT_PERMISSIONS);
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(this.permissions));
    } catch {
      this.permissions = DEFAULT_PERMISSIONS;
    }
  }

  async handleSupabaseSession(session: any) {
    this.isLoading = true;
    this.notifyListeners();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const user: AppUser = {
      id:                    session.user.id,
      email:                 session.user.email || '',
      role:                  (profile?.role as UserRole) || 'nutricionista',
      linkCode:              profile?.link_code || '',
      linkedReceptionistIds: profile?.linked_receptionist_ids || [],
      linkedNutritionistIds: profile?.linked_nutritionist_ids || [],
      profile: {
        name:              profile?.name               || session.user.user_metadata?.name || 'Usuario',
        email:             session.user.email          || '',
        timezone:          profile?.timezone            || 'UTC-06:00',
        specialty:         profile?.specialty           || '',
        avatar:            profile?.avatar              || '',
        professionalTitle: profile?.professional_title  || 'Lic.',
        licenseNumber:     profile?.license_number      || '',
        phone:             profile?.phone               || '',
        personalPhone:     profile?.personal_phone      || '',
        contactEmail:      profile?.contact_email       || '',
        instagramHandle:   profile?.instagram_handle    || '',
        website:           profile?.website             || '',
        address:           profile?.address             || '',
      } as any,
    };

    this.currentUser = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    await store.initForUser(user.id);
    this.isLoading = false;
    this.notifyListeners();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<AppUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  // Esperar a que handleSupabaseSession termine
  await this.handleSupabaseSession(data.session);
  return this.currentUser;
  }

  async signUp(email: string, password: string, name: string, role: UserRole, timezone: string, avatar?: string): Promise<{ ok: boolean; message?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) return { ok: false, message: error.message };
    if (!data.user) return { ok: false, message: 'Error al crear el usuario.' };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, name, role, timezone, avatar: avatar || '', email }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { ok: false, message: 'Error al crear el perfil de usuario.' };
    }
    return { ok: true };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.selectedNutritionistId = null;
    localStorage.removeItem(SESSION_KEY);
    await store.initForUser('guest');
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

  // ── Linked Users ──────────────────────────────────────────────────────────

  async getLinkedReceptionists() {
    const current = this.currentUser;
    if (!current) return [];
    const { data: links } = await supabase
      .from('profile_links')
      .select('receptionist_id')
      .eq('nutritionist_id', current.id);
    if (!links) return [];
    const ids = links.map((l: any) => l.receptionist_id);
    if (!ids.length) return [];
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)
      .eq('role', 'recepcionista');
    return data || [];
  }

  async getLinkedNutritionists(): Promise<AppUser[]> {
    if (this._linkedNutritionistsCache !== null) return this._linkedNutritionistsCache;
    const current = this.currentUser;
    if (!current) return [];
    // 1. Buscar los nutritionist_id donde el receptionist_id es el usuario actual
    const { data: links, error } = await supabase
      .from('profile_links')
      .select('nutritionist_id')
      .eq('receptionist_id', current.id);
    if (error || !links) return [];
    const ids = links.map((l: any) => l.nutritionist_id);
    if (ids.length === 0) { this._linkedNutritionistsCache = []; return []; }
    // 2. Traer los perfiles de esos IDs sólo si son nutricionistas
    const { data, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)
      .eq('role', 'nutricionista');
    if (profErr || !data) return [];
    const result = data.map(mapProfileToAppUser);
    this._linkedNutritionistsCache = result;
    return result;
  }

  clearLinkedNutritionistsCache() {
    this._linkedNutritionistsCache = null;
  }

  // ── Vinculación ───────────────────────────────────────────────────────────

  async linkReceptionistToNutritionistByCode(code: string) {
    const current = this.currentUser;
    if (!current || current.role !== 'nutricionista') return { ok: false, message: 'No autorizado.' };
    // Buscar recepcionista por código
    const { data: recep, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('link_code', code.trim().toUpperCase())
      .eq('role', 'recepcionista')
      .single();
    if (error || !recep) return { ok: false, message: 'Código inválido.' };
    // CREAR vínculo N:M
    const { error: linkError } = await supabase
      .from('profile_links')
      .insert([{ nutritionist_id: current.id, receptionist_id: recep.id }]);
    if (linkError && linkError.code === '23505') return { ok: false, message: 'Ya está vinculada.' };
    if (linkError) return { ok: false, message: 'Error inesperado.' };
    return { ok: true, message: `Recepcionista ${recep.name} vinculada correctamente.` };
  }

  async linkNutritionistToReceptionistByCode(code: string) {
    const current = this.currentUser;
    if (!current || current.role !== 'recepcionista') return { ok: false, message: 'No autorizado.' };
    const { data: nutri, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('link_code', code.trim().toUpperCase())
      .eq('role', 'nutricionista')
      .single();
    if (error || !nutri) return { ok: false, message: 'Código inválido.' };
    const { error: linkError } = await supabase
      .from('profile_links')
      .insert([{ nutritionist_id: nutri.id, receptionist_id: current.id }]);
    if (linkError && linkError.code === '23505') return { ok: false, message: 'Ya está vinculada.' };
    if (linkError) return { ok: false, message: 'Error inesperado.' };
    this.clearLinkedNutritionistsCache();
    return { ok: true, message: `Nutricionista ${nutri.name} vinculada correctamente.` };
  }

  async unlinkReceptionistFromNutritionist(receptionistId: string): Promise<{ ok: boolean; message: string }> {
    const current = this.currentUser;
    if (!current || current.role !== 'nutricionista') return { ok: false, message: 'No autorizado.' };
    const { error } = await supabase
      .from('profile_links')
      .delete()
      .eq('nutritionist_id', current.id)
      .eq('receptionist_id', receptionistId);
    if (error) return { ok: false, message: 'Error al desvincular.' };
    return { ok: true, message: 'Recepcionista desvinculada correctamente.' };
  }

  async unlinkNutritionistFromReceptionist(nutritionistId: string): Promise<{ ok: boolean; message: string }> {
    const current = this.currentUser;
    if (!current || current.role !== 'recepcionista') return { ok: false, message: 'No autorizado.' };
    const { error } = await supabase
      .from('profile_links')
      .delete()
      .eq('nutritionist_id', nutritionistId)
      .eq('receptionist_id', current.id);
    if (error) return { ok: false, message: 'Error al desvincular.' };
    this.clearLinkedNutritionistsCache();
    return { ok: true, message: 'Nutricionista desvinculada correctamente.' };
  }

  async generateAndSaveLinkCode(): Promise<string> {
  if (!this.currentUser) throw new Error('No usuario autenticado');
  // 1. Generar el código bonito (NUTRI-, RECEP-)
  const prefix = this.currentUser.role === 'recepcionista' ? 'RECEP' : 'NUTRI';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `${prefix}-${random}`;
  // 2. Guardar el código en el perfil en DB
  await supabase
    .from('profiles')
    .update({ link_code: code })
    .eq('id', this.currentUser.id);
  // 3. Refrescar el usuario actual (opcional pero recomendable)
  this.currentUser.linkCode = code;
  localStorage.setItem('nutricrm_session_v1', JSON.stringify(this.currentUser));
  return code;
}

  // ── Calendar Selector ─────────────────────────────────────────────────────

  getSelectedNutritionistId(): string | null {
    return this.selectedNutritionistId;
  }

  setSelectedNutritionistId(id: string): void {
    this.selectedNutritionistId = id;
  }

  // ── Profile update ────────────────────────────────────────────────────────

  async updateCurrentUserProfile(profile: UserProfile): Promise<void> {
    if (!this.currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        name:               profile.name,
        professional_title: profile.professionalTitle,
        specialty:          profile.specialty,
        license_number:     profile.licenseNumber,
        timezone:           profile.timezone,
        avatar:             profile.avatar,
        phone:              profile.phone,
        personal_phone:     profile.personalPhone,
        contact_email:      profile.contactEmail,
        instagram_handle:   profile.instagramHandle,
        website:            profile.website,
        address:            profile.address,
      })
      .eq('id', this.currentUser.id);
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    this.currentUser = { ...this.currentUser, profile };
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
  }

  getUserProfile(): UserProfile {
    return this.currentUser?.profile ?? ({} as UserProfile);
  }
}

export const authStore = new AuthStore();