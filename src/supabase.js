import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://vplgvqltzibawwwpidwc.supabase.co"
const SUPABASE_KEY = "sb_publishable_17cPovLMFFjJdmX7CG-zew_MDXx5xip"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)