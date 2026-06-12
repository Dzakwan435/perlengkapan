import { createClient as _createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Singleton — one client instance for the entire browser session
let client: ReturnType<typeof _createClient> | null = null;

export const createClient = () => {
  if (!client) {
    client = _createClient(supabaseUrl, supabaseKey);
  }
  return client;
};
