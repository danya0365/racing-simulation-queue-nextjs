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
          current_queue_id: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: number
          status: Database["public"]["Enums"]["machine_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_queue_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: number
          status?: Database["public"]["Enums"]["machine_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_queue_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: number
          status?: Database["public"]["Enums"]["machine_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_machines_current_queue"
            columns: ["current_queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
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
      queues: {
        Row: {
          booking_time: string
          created_at: string | null
          customer_id: string
          duration: number
          id: string
          machine_id: string
          notes: string | null
          position: number
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string | null
        }
        Insert: {
          booking_time?: string
          created_at?: string | null
          customer_id: string
          duration?: number
          id?: string
          machine_id: string
          notes?: string | null
          position?: number
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string | null
        }
        Update: {
          booking_time?: string
          created_at?: string | null
          customer_id?: string
          duration?: number
          id?: string
          machine_id?: string
          notes?: string | null
          position?: number
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queues_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queues_machine_id_fkey"
            columns: ["machine_id"]
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
        Args: { username: string; full_name?: string; avatar_url?: string }
        Returns: string
      }
      get_active_profile: {
        Args: Record<PropertyKey, never>
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
      }
      get_active_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_profile_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_auth_user_by_id: {
        Args: { p_id: string }
        Returns: Json
      }
      get_paginated_users: {
        Args: { p_page?: number; p_limit?: number }
        Returns: Json
      }
      get_private_url: {
        Args: { bucket: string; object_path: string; expires_in?: number }
        Returns: string
      }
      get_profile_role: {
        Args: { profile_id: string }
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      get_user_profiles: {
        Args: Record<PropertyKey, never>
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
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_moderator_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mask_phone: {
        Args: { p_phone: string }
        Returns: string
      }
      migrate_profile_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rpc_cancel_queue_guest: {
        Args: { p_queue_id: string; p_customer_id: string }
        Returns: boolean
      }
      rpc_create_booking: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_machine_id: string
          p_duration: number
          p_notes?: string
        }
        Returns: Json
      }
      rpc_get_active_and_recent_queues: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          machine_id: string
          customer_id: string
          customer_name: string
          customer_phone: string
          machine_name: string
          booking_time: string
          duration: number
          status: Database["public"]["Enums"]["queue_status"]
          queue_position: number
          notes: string
          created_at: string
          updated_at: string
        }[]
      }
      rpc_get_active_machines: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          machine_position: number
          status: Database["public"]["Enums"]["machine_status"]
          is_active: boolean
        }[]
      }
      rpc_get_all_customers_admin: {
        Args: Record<PropertyKey, never>
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
      }
      rpc_get_backend_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_machines: number
          available_machines: number
          occupied_machines: number
          maintenance_machines: number
          total_queues: number
          waiting_queues: number
          playing_queues: number
          completed_queues: number
          cancelled_queues: number
        }[]
      }
      rpc_get_machine_dashboard_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          machine_id: string
          waiting_count: number
          playing_count: number
          estimated_wait_minutes: number
          next_position: number
        }[]
      }
      rpc_get_my_queue_status: {
        Args: { p_queue_ids: string[] }
        Returns: {
          id: string
          machine_id: string
          customer_id: string
          machine_name: string
          customer_name: string
          customer_phone: string
          booking_time: string
          duration: number
          status: string
          queue_position: number
          queue_ahead: number
          estimated_wait_minutes: number
        }[]
      }
      rpc_get_queue_details: {
        Args: { p_queue_id: string }
        Returns: {
          id: string
          machine_id: string
          customer_id: string
          machine_name: string
          customer_name: string
          customer_phone_masked: string
          booking_time: string
          duration: number
          status: Database["public"]["Enums"]["queue_status"]
          queue_position: number
          notes: string
          created_at: string
          updated_at: string
        }[]
      }
      rpc_get_today_queues: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          customer_name: string
          customer_phone_masked: string
          machine_name: string
          booking_time: string
          duration: number
          status: Database["public"]["Enums"]["queue_status"]
          queue_position: number
        }[]
      }
      rpc_reset_machine_queue: {
        Args: { p_machine_id: string }
        Returns: Json
      }
      rpc_search_queues_by_phone: {
        Args: { p_phone: string }
        Returns: {
          booking_time: string
          created_at: string | null
          customer_id: string
          duration: number
          id: string
          machine_id: string
          notes: string | null
          position: number
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string | null
        }[]
      }
      rpc_update_queue_status_admin: {
        Args: {
          p_queue_id: string
          p_status: Database["public"]["Enums"]["queue_status"]
        }
        Returns: boolean
      }
      set_profile_active: {
        Args: { profile_id: string }
        Returns: boolean
      }
      set_profile_role: {
        Args: {
          target_profile_id: string
          new_role: Database["public"]["Enums"]["profile_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      machine_status: "available" | "occupied" | "maintenance"
      profile_role: "user" | "moderator" | "admin"
      queue_status: "waiting" | "playing" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      machine_status: ["available", "occupied", "maintenance"],
      profile_role: ["user", "moderator", "admin"],
      queue_status: ["waiting", "playing", "completed", "cancelled"],
    },
  },
} as const

