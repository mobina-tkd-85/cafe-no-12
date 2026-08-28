// Shared Supabase client, used by both the public site and the admin panel.
// Loaded as an ES module directly in the browser — no build step needed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { supabaseConfig } from "./supabase-config.js";

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
