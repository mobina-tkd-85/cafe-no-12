// ---------------------------------------------------------------------------
// Supabase configuration
//
// Get these two values from: Supabase Dashboard → your project →
// Project Settings → API.
//
// NOTE: The "anon" (public) key is safe to keep in your public repo — it's
// designed to be used from the browser. Your data is protected by the
// Row Level Security (RLS) policies you run from schema.sql, not by hiding
// this key. Full explanation: https://supabase.com/docs/guides/api/api-keys
// ---------------------------------------------------------------------------

export const supabaseConfig = {
  url: "https://dzujvugheoukdkboqtdt.supabase.co/rest/v1/", // e.g. https://xxxxxxxxxxxx.supabase.co
  anonKey: "sb_publishable_zIfEfODRSgwhkjRE3UEX1A_7hq7px3Z",
};
