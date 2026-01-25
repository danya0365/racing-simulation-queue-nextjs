export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          business_timezone: string
          created_at: string | null
          customer_id: string
          duration_minutes: number
          end_at: string
          id: string
          is_cross_midnight: boolean | null
          local_date: string | null
          local_end_date: string | null
          local_end_time: string | null
          local_start_time: string | null
          machine_id: string
          notes: string | null
          start_at: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          business_timezone?: string
          created_at?: string | null
          customer_id: string
          duration_minutes?: number
          end_at: string
          id?: string
          is_cross_midnight?: boolean | null
          local_date?: string | null
          local_end_date?: string | null
          local_end_time?: string | null
          local_start_time?: string | null
          machine_id: string
          notes?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          business_timezone?: string
          created_at?: string | null
          customer_id?: string
          duration_minutes?: number
          end_at?: string
          id?: string
          is_cross_midnight?: boolean | null
          local_date?: string | null
          local_end_date?: string | null
          local_end_time?: string | null
          local_start_time?: string | null
          machine_id?: string
          notes?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_vip: boolean
          last_visit: string | null
          name: string
          notes: string | null
          phone: string
          profile_id: string | null
          total_play_time: number
          updated_at: string | null
          visit_count: number
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean
          last_visit?: string | null
          name: string
          notes?: string | null
          phone: string
          profile_id?: string | null
          total_play_time?: number
          updated_at?: string | null
          visit_count?: number
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean
          last_visit?: string | null
          name?: string
          notes?: string | null
          phone?: string
          profile_id?: string | null
          total_play_time?: number
          updated_at?: string | null
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          description: string | null
          hourly_rate: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: number
          status: Database["public"]["Enums"]["machine_status"]
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: number
          status?: Database["public"]["Enums"]["machine_status"]
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: number
          status?: Database["public"]["Enums"]["machine_status"]
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["profile_role"]
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          profile_id: string
          role?: Database["public"]["Enums"]["profile_role"]
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["profile_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          auth_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_login: string | null
          login_count: number
          phone: string | null
          preferences: Json
          privacy_settings: Json
          social_links: Json | null
          updated_at: string | null
          username: string | null
          verification_status: string
        }
        Insert: {
          address?: string | null
          auth_id: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          login_count?: number
          phone?: string | null
          preferences?: Json
          privacy_settings?: Json
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string
        }
        Update: {
          address?: string | null
          auth_id?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          login_count?: number
          phone?: string | null
          preferences?: Json
          privacy_settings?: Json
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_name: string
          end_time: string | null
          estimated_end_time: string | null
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          queue_id: string | null
          start_time: string
          station_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_name: string
          end_time?: string | null
          estimated_end_time?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          queue_id?: string | null
          start_time?: string
          station_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_name?: string
          end_time?: string | null
          estimated_end_time?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          queue_id?: string | null
          start_time?: string
          station_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "walk_in_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      walk_in_queue: {
        Row: {
          called_at: string | null
          created_at: string | null
          customer_id: string
          id: string
          joined_at: string
          notes: string | null
          party_size: number
          preferred_machine_id: string | null
          preferred_station_type: string | null
          queue_number: number
          seated_at: string | null
          status: Database["public"]["Enums"]["walk_in_status"]
          updated_at: string | null
        }
        Insert: {
          called_at?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          joined_at?: string
          notes?: string | null
          party_size?: number
          preferred_machine_id?: string | null
          preferred_station_type?: string | null
          queue_number: number
          seated_at?: string | null
          status?: Database["public"]["Enums"]["walk_in_status"]
          updated_at?: string | null
        }
        Update: {
          called_at?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          joined_at?: string
          notes?: string | null
          party_size?: number
          preferred_machine_id?: string | null
          preferred_station_type?: string | null
          queue_number?: number
          seated_at?: string | null
          status?: Database["public"]["Enums"]["walk_in_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "walk_in_queue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_in_queue_preferred_machine_id_fkey"
            columns: ["preferred_machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_profile: {
        Args: { avatar_url?: string; full_name?: string; username: string }
        Returns: string
      }
      get_active_profile: {
        Args: never
        Returns: {
          address: string | null
          auth_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_login: string | null
          login_count: number
          phone: string | null
          preferences: Json
          privacy_settings: Json
          social_links: Json | null
          updated_at: string | null
          username: string | null
          verification_status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_profile_id: { Args: never; Returns: string }
      get_active_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_auth_user_by_id: { Args: { p_id: string }; Returns: Json }
      get_paginated_users: {
        Args: { p_limit?: number; p_page?: number }
        Returns: Json
      }
      get_private_url: {
        Args: { bucket: string; expires_in?: number; object_path: string }
        Returns: string
      }
      get_profile_role: {
        Args: { profile_id: string }
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_user_profiles: {
        Args: never
        Returns: {
          address: string | null
          auth_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          last_login: string | null
          login_count: number
          phone: string | null
          preferences: Json
          privacy_settings: Json
          social_links: Json | null
          updated_at: string | null
          username: string | null
          verification_status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_moderator_or_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      mask_phone: { Args: { p_phone: string }; Returns: string }
      migrate_profile_roles: { Args: never; Returns: undefined }
      rpc_call_queue_customer: { Args: { p_queue_id: string }; Returns: Json }
      rpc_cancel_booking: {
        Args: { p_booking_id: string; p_customer_id?: string }
        Returns: Json
      }
      rpc_cancel_walk_in_queue: {
        Args: { p_customer_id?: string; p_queue_id: string }
        Returns: Json
      }
      rpc_checkin_booking: { Args: { p_booking_id: string }; Returns: Json }
      rpc_create_booking: {
        Args: {
          p_customer_id?: string
          p_customer_name: string
          p_customer_phone: string
          p_duration_minutes: number
          p_local_date: string
          p_local_start_time: string
          p_machine_id: string
          p_notes?: string
          p_timezone?: string
        }
        Returns: Json
      }
      rpc_end_session: {
        Args: { p_session_id: string; p_total_amount?: number }
        Returns: Json
      }
      rpc_get_active_and_recent_queues: {
        Args: never
        Returns: {
          booking_time: string
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          duration: number
          id: string
          machine_id: string
          machine_name: string
          notes: string
          queue_position: number
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
        }[]
      }
      rpc_get_active_machines: {
        Args: never
        Returns: {
          description: string
          hourly_rate: number
          id: string
          is_active: boolean
          machine_position: number
          name: string
          status: Database["public"]["Enums"]["machine_status"]
          type: string
        }[]
      }
      rpc_get_active_sessions: {
        Args: never
        Returns: {
          customer_name: string
          duration_minutes: number
          estimated_end_time: string
          payment_status: string
          session_id: string
          source_type: string
          start_time: string
          station_id: string
          station_name: string
        }[]
      }
      rpc_get_all_customers_admin: {
        Args: never
        Returns: {
          created_at: string | null
          email: string | null
          id: string
          is_vip: boolean
          last_visit: string | null
          name: string
          notes: string | null
          phone: string
          profile_id: string | null
          total_play_time: number
          updated_at: string | null
          visit_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      rpc_get_backend_dashboard_stats: {
        Args: never
        Returns: {
          available_machines: number
          cancelled_queues: number
          completed_queues: number
          maintenance_machines: number
          occupied_machines: number
          playing_queues: number
          total_machines: number
          total_queues: number
          waiting_queues: number
        }[]
      }
      rpc_get_backend_stats: { Args: never; Returns: Json }
      rpc_get_booking_logs: {
        Args: { p_booking_ids: string[] }
        Returns: {
          action: string
          booking_id: string
          recorded_at: string
        }[]
      }
      rpc_get_bookings_by_machine_date: {
        Args: { p_customer_id?: string; p_date: string; p_machine_id: string }
        Returns: {
          booking_id: string
          business_timezone: string
          created_at: string
          customer_name: string
          customer_phone: string
          duration_minutes: number
          end_at: string
          is_cross_midnight: boolean
          is_owner: boolean
          local_date: string
          local_end_time: string
          local_start_time: string
          machine_id: string
          start_at: string
          status: string
        }[]
      }
      rpc_get_bookings_schedule: {
        Args: {
          p_customer_id?: string
          p_date: string
          p_machine_id: string
          p_timezone?: string
        }
        Returns: {
          booking_id: string
          customer_name: string
          customer_phone: string
          duration_minutes: number
          end_at: string
          is_cross_midnight: boolean
          is_owner: boolean
          local_end_time: string
          local_start_time: string
          start_at: string
          status: string
          total_price: number
        }[]
      }
      rpc_get_my_bookings: {
        Args: { p_customer_id: string }
        Returns: {
          booking_id: string
          business_timezone: string
          created_at: string
          customer_name: string
          customer_phone: string
          duration_minutes: number
          end_at: string
          is_cross_midnight: boolean
          local_date: string
          local_end_time: string
          local_start_time: string
          machine_id: string
          machine_name: string
          start_at: string
          status: string
          total_price: number
        }[]
      }
      rpc_get_my_queue_status: {
        Args: { p_queue_ids: string[] }
        Returns: {
          booking_time: string
          customer_id: string
          customer_name: string
          customer_phone: string
          duration: number
          estimated_wait_minutes: number
          id: string
          machine_id: string
          machine_name: string
          queue_ahead: number
          queue_position: number
          status: string
        }[]
      }
      rpc_get_my_walk_in_queue: {
        Args: { p_customer_id: string }
        Returns: {
          called_at: string
          customer_name: string
          customer_phone: string
          estimated_wait_minutes: number
          joined_at: string
          notes: string
          party_size: number
          preferred_machine_name: string
          preferred_station_type: string
          queue_id: string
          queue_number: number
          queues_ahead: number
          status: string
        }[]
      }
      rpc_get_session_stats: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      rpc_get_today_sessions: {
        Args: never
        Returns: {
          customer_name: string
          duration_minutes: number
          end_time: string
          payment_status: string
          session_id: string
          source_type: string
          start_time: string
          station_id: string
          station_name: string
          total_amount: number
        }[]
      }
      rpc_get_waiting_queue: {
        Args: never
        Returns: {
          customer_name: string
          customer_phone_masked: string
          joined_at: string
          party_size: number
          preferred_machine_name: string
          preferred_station_type: string
          queue_id: string
          queue_number: number
          status: string
          wait_time_minutes: number
        }[]
      }
      rpc_get_walk_in_queue_stats: { Args: never; Returns: Json }
      rpc_is_booking_slot_available: {
        Args: {
          p_duration_minutes: number
          p_local_date: string
          p_local_start_time: string
          p_machine_id: string
          p_timezone?: string
        }
        Returns: boolean
      }
      rpc_join_walk_in_queue: {
        Args: {
          p_customer_id?: string
          p_customer_name: string
          p_customer_phone: string
          p_notes?: string
          p_party_size?: number
          p_preferred_machine_id?: string
          p_preferred_station_type?: string
        }
        Returns: Json
      }
      rpc_log_booking: {
        Args: { p_action: string; p_booking_id: string }
        Returns: Json
      }
      rpc_start_session: {
        Args: {
          p_booking_id?: string
          p_customer_name: string
          p_estimated_duration_minutes?: number
          p_notes?: string
          p_queue_id?: string
          p_station_id: string
        }
        Returns: Json
      }
      rpc_update_session_payment: {
        Args: {
          p_payment_status: Database["public"]["Enums"]["payment_status"]
          p_session_id: string
        }
        Returns: Json
      }
      set_profile_active: { Args: { profile_id: string }; Returns: boolean }
      set_profile_role: {
        Args: {
          new_role: Database["public"]["Enums"]["profile_role"]
          target_profile_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "completed"
        | "cancelled"
        | "checked_in"
      machine_status: "available" | "occupied" | "maintenance"
      payment_status: "unpaid" | "paid" | "partial"
      profile_role: "user" | "moderator" | "admin"
      queue_status: "waiting" | "playing" | "completed" | "cancelled"
      walk_in_status: "waiting" | "called" | "seated" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "cancelled",
        "checked_in",
      ],
      machine_status: ["available", "occupied", "maintenance"],
      payment_status: ["unpaid", "paid", "partial"],
      profile_role: ["user", "moderator", "admin"],
      queue_status: ["waiting", "playing", "completed", "cancelled"],
      walk_in_status: ["waiting", "called", "seated", "cancelled"],
    },
  },
} as const

