import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hxqkaxoengupamwgbjza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cWtheG9lbmd1cGFtd2dianphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODExNTksImV4cCI6MjA2MTM1NzE1OX0.kyNfsM-9kmN2DmRPmpnPuwqpMndYBqQrBkAtL8LvMHM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 