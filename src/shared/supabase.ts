import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY가 없습니다. .env.example을 .env.local로 복사해 값을 채우세요.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
