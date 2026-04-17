import { createClient } from '@supabase/supabase-js';
import { supabaseHealthService } from './supabaseHealthService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

async function monitoredFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  try {
    const response = await fetch(input, init);
    if (response.status >= 500) {
      supabaseHealthService.reportHttpError(response.status, url);
    }
    return response;
  } catch (error) {
    supabaseHealthService.reportNetworkError(error, url);
    throw error;
  }
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  { global: { fetch: monitoredFetch } }
);
