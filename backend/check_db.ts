import dotenv from 'dotenv';
dotenv.config();

import { supabase } from './src/config/supabaseClient';

async function check() {
  console.log('--- checking users ---');
  const r1 = await supabase.from('users').select('*');
  console.log('users data:', r1.data, 'error:', r1.error);

  console.log('--- checking progress ---');
  const r2 = await supabase.from('progress').select('*');
  console.log('progress data:', r2.data, 'error:', r2.error);

  console.log('--- checking profiles ---');
  const r3 = await supabase.from('profiles').select('*');
  console.log('profiles data:', r3.data, 'error:', r3.error);
}

check();
