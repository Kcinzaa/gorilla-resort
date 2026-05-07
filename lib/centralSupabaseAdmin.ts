import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedCentralClient: SupabaseClient | null = null;

export function getCentralSupabaseAdmin() {
  if (cachedCentralClient) return cachedCentralClient;

  const supabaseUrl =
    process.env.CENTRAL_SUPABASE_URL || process.env.RHINO_SUPABASE_URL;
  const serviceRoleKey =
    process.env.CENTRAL_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RHINO_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  cachedCentralClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedCentralClient;
}
