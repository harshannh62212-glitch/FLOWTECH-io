// FlowTech Supabase Client Integration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock-flowtech.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'mock-anon-key-flowtech-2026';

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('[Supabase] Initialized successfully with credentials');
  } catch (err) {
    console.warn('[Supabase] Initialization error, falling back to mock mode:', err.message);
  }
} else {
  console.log('[Supabase] Running in local/mock mode (Configure SUPABASE_URL and SUPABASE_ANON_KEY on Render/Vercel)');
}

module.exports = { supabase, SUPABASE_URL };
