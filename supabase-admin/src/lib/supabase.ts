import { createClient } from "@supabase/supabase-ts";

// Initialize database client
const supabaseUrl = "https://ousrwhwfrwlrnheoavzk.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c3J3aHdmcndscm5oZW9hdnprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3Mzk1OTUsImV4cCI6MjA4NDMxNTU5NX0.bsmClz_bzvYTyo0VjnhgOB3Z5qbA0L3WJb8dmBLgLt0";

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
