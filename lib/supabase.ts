import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = 'https://snoifqkhvilrsomkdihb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNub2lmcWtodmlscnNvbWtkaWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTExNTQsImV4cCI6MjA3NjUyNzE1NH0.titIw-QjR5gjm4ZKOI34MnMsBQM6AB3E5MRb7s4gmSQ';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
