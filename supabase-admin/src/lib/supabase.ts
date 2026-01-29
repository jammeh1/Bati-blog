import { createClient } from "@supabase/supabase-js";

// Initialize database client
const supabaseUrl = "https://ousrwhwfrwlrnheoavzk.supabase.co";
const supabaseKey = "sb_publishable_dhSHa8l9iac5n1k9q8zn2w_--Ft9DKh";

// Create client with extended properties for edge function calls
const supabase = createClient(supabaseUrl, supabaseKey) as ReturnType<
	typeof createClient
> & {
	supabaseUrl: string;
	supabaseKey: string;
};

// Attach URL and key for edge function calls
(supabase as any).supabaseUrl = supabaseUrl;
(supabase as any).supabaseKey = supabaseKey;

export { supabase };
