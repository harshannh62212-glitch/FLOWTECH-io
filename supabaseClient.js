// FlowTech Supabase Client Integration with Real Credentials
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aebntdjjniirnwthtwlx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYm50ZGpqbmlpcm53dGh0d2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NzIwNTYsImV4cCI6MjA5ODQ0ODA1Nn0.la5aH5b2Tb5cj5yfVEWHhPKU4_ieCWydEPWH8V81eIg';

let supabase = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log(`[Supabase] Active connection to ${SUPABASE_URL}`);
} catch (err) {
  console.warn('[Supabase] Client init warning:', err.message);
}

module.exports = { supabase, SUPABASE_URL, SUPABASE_ANON_KEY };
