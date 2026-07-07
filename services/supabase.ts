import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knopoetvssfyxmvggqei.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-lTSqONdT5KgK3D2d8102Q_8t9yXYbe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
