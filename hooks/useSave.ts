import { useState, useRef, useCallback } from 'react';

export interface UseSaveReturn {
  save: (fn: () => Promise<void>) => Promise<void>;
  isSaving: boolean;
  savedOk: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSave(): UseSaveReturn {
  const [isSaving, setIsSaving]   = useState(false);
  const [savedOk, setSavedOk]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const lockRef  = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (fn: () => Promise<void>) => {
    if (lockRef.current) return; // bloquea double-submit
    lockRef.current = true;
    setIsSaving(true);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      await fn();
      setSavedOk(true);
      timerRef.current = setTimeout(() => setSavedOk(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
      lockRef.current = false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { save, isSaving, savedOk, error, clearError };
}
