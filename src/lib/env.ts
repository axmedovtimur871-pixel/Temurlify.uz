// Public values are safe in the browser (Supabase anon/publishable key is
// protected by row level security). Never import server-only secrets here.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
