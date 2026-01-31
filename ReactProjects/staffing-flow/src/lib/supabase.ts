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
      shift_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_time: string;
          end_time: string;
          days_of_week: string[] | null;
          is_full_day: boolean;
          is_active: boolean;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['shift_templates']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['shift_templates']['Insert']>;
      };
      staffing_buffers: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          buffer_percentage: number;
          buffer_minimum_count: number | null;
          day_of_week: string | null;
          start_time: string | null;
          end_time: string | null;
          effective_date: string;
          end_date: string | null;
          is_active: boolean;
          organization_id: string;
          department_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["staffing_buffers"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["staffing_buffers"]["Insert"]>;
      };
      sla_windows: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          day_of_week: string;
          start_time: string;
          end_time: string;
          required_coverage_percentage: number;
          minimum_staff_count: number | null;
          priority: "low" | "medium" | "high" | "critical";
          effective_date: string;
          end_date: string | null;
          is_active: boolean;
          organization_id: string;
          department_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sla_windows"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["sla_windows"]["Insert"]>;
      };
      staffing_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          planned_headcount: number | null;
          current_assignments: number;
          unassigned_positions: number;
          demand_ids: string[] | null;
          staffing_buffer_ids: string[] | null;
          sla_window_ids: string[] | null;
          status: "draft" | "pending_approval" | "approved" | "scheduled" | "active" | "completed" | "archived";
          priority: "low" | "medium" | "high" | "critical";
          created_by: string | null;
          approved_by: string | null;
          approval_date: string | null;
          notes: string | null;
          internal_comments: string | null;
          organization_id: string;
          department_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["staffing_plans"]["Row"],
          "id" | "current_assignments" | "unassigned_positions" | "created_at" | "updated_at" | "approval_date"
        >;
        Update: Partial<Database["public"]["Tables"]["staffing_plans"]["Insert"]>;
      };
      staffing_plan_assignments: {
        Row: {
          id: string;
          staffing_plan_id: string;
          employee_id: string;
          organization_id: string;
          assignment_date: string;
          assignment_end_date: string | null;
          assigned_role: string | null;
          shift_template_id: string | null;
          status: "proposed" | "assigned" | "confirmed" | "active" | "completed" | "cancelled";
          confirmed_at: string | null;
          confirmed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["staffing_plan_assignments"]["Row"],
          "id" | "created_at" | "updated_at" | "confirmed_at"
        >;
        Update: Partial<Database["public"]["Tables"]["staffing_plan_assignments"]["Insert"]>;
      };
    };
  };
};

// Export typed supabase client
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;