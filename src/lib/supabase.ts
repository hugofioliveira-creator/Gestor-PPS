/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id');

if (!isConfigured) {
  console.warn('Supabase não configurado. Defina as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.');
}

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-key'
);

export const hasSupabaseConfig = isConfigured;
