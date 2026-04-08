import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🔥 เพิ่มบรรทัดนี้เพื่อเช็คใน Terminal
console.log("DB Config Check:", {
    url: supabaseUrl ? "Found" : "NOT FOUND",
    key: supabaseAnonKey ? "Found" : "NOT FOUND"
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Error: Supabase URL or Key is missing! Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);