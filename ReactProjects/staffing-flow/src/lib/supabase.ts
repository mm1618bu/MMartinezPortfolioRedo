import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'staffing-flow-web',
    },
  },
});

// Type-safe database query helper
export type Database = {
  public: {
    Tables: {
      // Add your table types here
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'viewer';
          organization_id: string;
          team_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['users']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      staff: {
        Row: {
          id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          department_id: string;
          position: string;
          hire_date: string;
          status: 'active' | 'inactive' | 'on_leave' | 'terminated';
          hourly_rate: number | null;
          weekly_hours: number;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['staff']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
      };
      schedules: {
        Row: {
          id: string;
          staff_id: string;
          start_time: string;
          end_time: string;
          position: string;
          notes: string | null;
          status: 'draft' | 'published' | 'archived';
          created_by: string;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['schedules']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>;
      };
      time_off: {
        Row: {
          id: string;
          staff_id: string;
          type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'bereavement' | 'jury_duty';
          start_date: string;
          end_date: string;
          total_days: number;
          reason: string | null;
          status: 'pending' | 'approved' | 'denied' | 'cancelled';
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['time_off']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['time_off']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          manager_id: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['departments']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['organizations']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      sites: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string;
          timezone: string;
          is_active: boolean;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['sites']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['sites']['Insert']>;
      };
    };
  };
};

// Export typed supabase client
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;
