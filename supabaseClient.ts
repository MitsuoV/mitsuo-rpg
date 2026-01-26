import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukumwwpezlgqkvspsuwj.supabase.co';
const supabaseAnonKey = 'sb_publishable_uL3WzgxFVmfBFsxp54q-GA_YDQ_VA_i';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);