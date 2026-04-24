/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && 
                   supabaseAnonKey && 
                   supabaseUrl.startsWith('http') &&
                   !supabaseUrl.includes('your-project-id') &&
                   supabaseAnonKey !== 'your-anon-key');

if (!isConfigured) {
  console.warn('Supabase não configurado ou URL inválido. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.');
}

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder'
);

export const hasSupabaseConfig = isConfigured;
