# Migración de botones de guardado

Objetivo: reemplazar toda la lógica de guardado dispersa por `<SaveButton>` + `useSave`.

## Archivos creados

| Archivo | Qué hace |
|---------|----------|
| `hooks/useSave.ts` | Hook con toda la lógica: bloqueo doble-click, loading, éxito, error |
| `components/SaveButton.tsx` | Botón visual estándar, usa `useSave` internamente |

---

## Patrón de migración (hacer esto en cada formulario)

### 1. Agregar el import
```tsx
import { SaveButton } from '../components/SaveButton'; // ajustar ruta según carpeta
```

### 2. Eliminar estos estados del componente
```tsx
// ELIMINAR:
const [isSaving, setIsSaving] = useState(false);
const [savedOk, setSavedOk] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);
const isSaving = useRef(false);
const savedTimer = useRef(null);
```

### 3. Convertir la función de guardado a async pura (sin setters de estado)
```tsx
// ANTES:
const handleSave = async () => {
  setIsSaving(true);
  try {
    await store.save(data);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  } catch(e) { ... }
  finally { setIsSaving(false); }
};

// DESPUÉS — solo la lógica, sin estado:
const handleSave = async () => {
  await store.save(data); // si falla, lanza el error — SaveButton lo captura
};
```

### 4. Reemplazar el botón
```tsx
// ANTES:
<button onClick={handleSave} disabled={isSaving}>
  <Save /> {isSaving ? 'Guardando...' : 'Guardar'}
</button>

// DESPUÉS:
<SaveButton onSave={handleSave} />
// o con label personalizado:
<SaveButton onSave={handleSave} label="Guardar evaluación" />
```

### 5. Quitar imports que ya no se usan
```tsx
// Probablemente ya no necesitas:
CheckCircle, Loader2 (si los usabas solo para el botón)
```

---

## Lista de formularios — estado de migración

### Simples (solo botón, sin complicaciones)
- [ ] `pages/Profile.tsx` — botón "Guardar Cambios", llama `supabaseService.updateUserProfile()`
- [ ] `pages/Payments.tsx` — botón de guardar factura
- [ ] `pages/Admin.tsx` — botón de guardar config

### Modales
- [ ] `components/calendar_components/CalendarAppointmentModal.tsx` — create/edit cita. Llama `store.addAppointment()` o `store.updateAppointment()`. Tiene callback `onSaved()` que debe seguir llamándose después del save.

### Formularios de paciente (tabs)
- [ ] `components/patient/SomatocartaForm.tsx` — llama `store.saveSomatotype()`
- [ ] `components/patient/BioimpedanciaForm.tsx` — llama `store.saveBioimpedancia()`. Tiene `isSaving` como ref + state (eliminar ambos).
- [ ] `components/patient/NewMeasurementForm.tsx` — llama `store.saveMeasurement()`
- [ ] `components/patient/LabsTab.tsx` — botón por archivo individual, `disabled` si no hay cambios. Mantener lógica `isDirty` pero reemplazar el botón.
- [ ] `components/patient/DietaryTab.tsx` — botón con detección de cambios (`hasChanges`). Mantener lógica de detección, reemplazar botón.
- [ ] `components/patient/ClinicalTab.tsx` — botón flotante + detección de cambios. Mantener `hasChanges`, reemplazar botón flotante.
- [ ] `components/patient/EvaluationDetail.tsx` — múltiples saves anidados (notas, preferencias, archivos). Usar `useSave` por separado para cada sección.

### Formularios con autosave (QUITAR autosave)
- [ ] `components/patient/DietaryForm.tsx` — **QUITAR** el `setTimeout` de autosave y el `isDirty`/`autosaveStatus`. Reemplazar por `<SaveButton>`. También quitar el segundo botón "Guardar" del footer (dejar solo uno arriba).

### Complejos (hacer al final)
- [ ] `components/patient/MenuAddRead.tsx` — el más complejo. Tiene botón sticky flotante + `hasUnsavedChanges`. Analizar antes de migrar.
- [ ] `pages/Menus.tsx` — múltiples secciones de configuración con guardado independiente.

---

## Notas importantes

**No tocar:**
- La lógica de UPSERT en `supabaseService.ts` — ya previene duplicados correctamente
- Los callbacks `onUpdate(patient)` / `onSaved()` — deben seguir llamándose dentro de `handleSave`
- La lógica de `EvaluationLink` — no tiene que ver con el guardado

**Sobre el autosave en DietaryForm:**
El `setTimeout` de 3 segundos se quita completo. Si el usuario escribe y cierra sin guardar, se pierde — eso es correcto y esperado para un botón explícito.

**Cuando el padre necesita saber si está guardando:**
Algunos formularios deshabilitan campos mientras guardan. En esos casos, importar `useSave` directamente en el padre:
```tsx
import { useSave } from '../../hooks/useSave';
const { save, isSaving } = useSave();
// ...
<input disabled={isSaving} />
<SaveButton onSave={() => save(handleSave)} />
```

---

## Orden sugerido para avanzar

1. Profile.tsx (el más simple — para validar el patrón)
2. CalendarAppointmentModal.tsx
3. Payments.tsx
4. SomatocartaForm.tsx
5. BioimpedanciaForm.tsx
6. NewMeasurementForm.tsx
7. LabsTab.tsx
8. DietaryTab.tsx
9. ClinicalTab.tsx
10. DietaryForm.tsx (quitar autosave)
11. EvaluationDetail.tsx
12. MenuAddRead.tsx
13. Menus.tsx (page)
14. Admin.tsx
