import { createClient } from '@supabase/supabase-js';

// Fallback dummy strings mimic a valid URL and token layout to prevent any compilation crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://temporary-build-bypass.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
