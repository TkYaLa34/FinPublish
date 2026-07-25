import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isMock =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-supabase-project') ||
  supabaseAnonKey.includes('your-supabase-anon-key');

// Safe, fallback client
let supabaseClient: any;

if (isMock) {
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async (credentials: any) => ({
        data: {
          user: { id: 'mock-user-id', email: credentials.email },
          session: { access_token: 'mock-token' },
        },
        error: null,
      }),
      signUp: async (credentials: any) => ({
        data: {
          user: { id: 'mock-user-id', email: credentials.email },
          session: null,
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback: any) => {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
