
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olmmpwsdzkjqlpupwzdy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DhciqiCqNY-V3wFrhhwBBw_VvIXLoip';

export const supabase = createClient(supabaseUrl, supabaseKey);
