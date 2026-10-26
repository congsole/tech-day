export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      host_handover_rejections: {
        Row: {
          created_at: string
          handover_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handover_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          handover_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_handover_rejections_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "host_handovers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_handover_rejections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_handovers: {
        Row: {
          accepted_by: string | null
          created_at: string
          from_host_id: string
          id: string
          meal_id: string
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["handover_status"]
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          from_host_id: string
          id?: string
          meal_id: string
          reason: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["handover_status"]
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          from_host_id?: string
          id?: string
          meal_id?: string
          reason?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["handover_status"]
        }
        Relationships: [
          {
            foreignKeyName: "host_handovers_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_handovers_from_host_id_fkey"
            columns: ["from_host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_handovers_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_members: {
        Row: {
          confirmed_at: string | null
          joined_at: string
          meal_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          joined_at?: string
          meal_id: string
          user_id?: string
        }
        Update: {
          confirmed_at?: string | null
          joined_at?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_members_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          cancel_reason: string | null
          capacity: number
          created_at: string
          host_id: string
          id: string
          memo: string | null
          menu_url: string | null
          order_time: string
          place: string | null
          restaurant_name: string | null
          status: Database["public"]["Enums"]["meal_status"]
          title: string
          type: Database["public"]["Enums"]["meal_type"]
        }
        Insert: {
          cancel_reason?: string | null
          capacity: number
          created_at?: string
          host_id?: string
          id?: string
          memo?: string | null
          menu_url?: string | null
          order_time: string
          place?: string | null
          restaurant_name?: string | null
          status?: Database["public"]["Enums"]["meal_status"]
          title: string
          type: Database["public"]["Enums"]["meal_type"]
        }
        Update: {
          cancel_reason?: string | null
          capacity?: number
          created_at?: string
          host_id?: string
          id?: string
          memo?: string | null
          menu_url?: string | null
          order_time?: string
          place?: string | null
          restaurant_name?: string | null
          status?: Database["public"]["Enums"]["meal_status"]
          title?: string
          type?: Database["public"]["Enums"]["meal_type"]
        }
        Relationships: [
          {
            foreignKeyName: "meals_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          meal_id: string
        }
        Insert: {
          author_id?: string
          content: string
          created_at?: string
          id?: string
          meal_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          meal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          name: string
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          name: string
          price: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          name?: string
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_meal_id_user_id_fkey"
            columns: ["meal_id", "user_id"]
            isOneToOne: false
            referencedRelation: "meal_members"
            referencedColumns: ["meal_id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_host_handover: {
        Args: { p_handover_id: string }
        Returns: undefined
      }
      cancel_meal: {
        Args: { p_meal_id: string; p_reason: string }
        Returns: undefined
      }
      confirm_order: { Args: { p_meal_id: string }; Returns: undefined }
      expire_host_handovers: { Args: never; Returns: undefined }
      get_meal_member_emails: {
        Args: { p_meal_id: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      is_meal_member: { Args: { p_meal_id: string }; Returns: boolean }
      is_meal_open: { Args: { p_meal_id: string }; Returns: boolean }
      mark_meal_ordered: { Args: { p_meal_id: string }; Returns: undefined }
      reject_host_handover: {
        Args: { p_handover_id: string }
        Returns: undefined
      }
      request_host_handover: {
        Args: { p_meal_id: string; p_reason: string }
        Returns: undefined
      }
      resolve_host_handover: {
        Args: { p_handover_id: string }
        Returns: undefined
      }
      start_due_orders: { Args: never; Returns: undefined }
      start_settlement: { Args: { p_meal_id: string }; Returns: undefined }
      update_order_time: {
        Args: { p_meal_id: string; p_order_time: string }
        Returns: undefined
      }
    }
    Enums: {
      handover_status: "pending" | "accepted" | "failed"
      meal_status:
        | "recruiting"
        | "ordering"
        | "ordered"
        | "settling"
        | "canceled"
      meal_type: "dine" | "delivery"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      handover_status: ["pending", "accepted", "failed"],
      meal_status: [
        "recruiting",
        "ordering",
        "ordered",
        "settling",
        "canceled",
      ],
      meal_type: ["dine", "delivery"],
    },
  },
} as const
