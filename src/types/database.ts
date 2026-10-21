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
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          display_name: string
          email: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string
          email: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          identifier_hash: string
          request_count: number
          scope: string
          window_started_at: string
        }
        Insert: {
          identifier_hash: string
          request_count: number
          scope: string
          window_started_at: string
        }
        Update: {
          identifier_hash?: string
          request_count?: number
          scope?: string
          window_started_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          order_reference: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          order_reference?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          order_reference?: string
          status?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          actor_id: string | null
          actor_name: string
          created_at: string
          event_type: string
          id: string
          next_value: Json | null
          order_id: string
          previous_value: Json | null
          source_key: string | null
          title: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          event_type: string
          id?: string
          next_value?: Json | null
          order_id: string
          previous_value?: Json | null
          source_key?: string | null
          title: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          event_type?: string
          id?: string
          next_value?: Json | null
          order_id?: string
          previous_value?: Json | null
          source_key?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          bucket: string
          created_at: string
          id: string
          kind: string
          mime_type: string
          object_path: string
          order_id: string
          order_item_id: string | null
          original_name: string
          size_bytes: number
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          kind: string
          mime_type: string
          object_path: string
          order_id: string
          order_item_id?: string | null
          original_name: string
          size_bytes: number
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string
          object_path?: string
          order_id?: string
          order_item_id?: string | null
          original_name?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_files_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          configuration: Json
          created_at: string
          id: string
          line_total_pence: number
          order_id: string
          position: number
          price_breakdown: Json
          quantity: number
          unit_total_pence: number
        }
        Insert: {
          configuration: Json
          created_at?: string
          id?: string
          line_total_pence: number
          order_id: string
          position: number
          price_breakdown: Json
          quantity: number
          unit_total_pence: number
        }
        Update: {
          configuration?: Json
          created_at?: string
          id?: string
          line_total_pence?: number
          order_id?: string
          position?: number
          price_breakdown?: Json
          quantity?: number
          unit_total_pence?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          author_id: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          order_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          additional_notes: string
          billing_address: Json
          cancellation_reason: string
          cancelled_at: string | null
          cancelled_by: string | null
          carrier: string
          checkout_access_token_hash: string
          configuration: Json | null
          created_at: string
          currency: string
          customer: Json
          delivery_address: Json
          delivery_pence: number
          dispatched_at: string | null
          fulfilment_status: string
          id: string
          order_notes: string
          paid_at: string | null
          payment_status: string
          price_breakdown: Json | null
          quantity: number | null
          reference: string
          special_instructions: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_pence: number
          total_pence: number
          tracking_reference: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          additional_notes?: string
          billing_address: Json
          cancellation_reason?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          carrier?: string
          checkout_access_token_hash: string
          configuration?: Json | null
          created_at?: string
          currency?: string
          customer: Json
          delivery_address: Json
          delivery_pence?: number
          dispatched_at?: string | null
          fulfilment_status?: string
          id: string
          order_notes?: string
          paid_at?: string | null
          payment_status?: string
          price_breakdown?: Json | null
          quantity?: number | null
          reference: string
          special_instructions?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_pence: number
          total_pence: number
          tracking_reference?: string
          updated_at?: string
          verification_status: string
        }
        Update: {
          additional_notes?: string
          billing_address?: Json
          cancellation_reason?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          carrier?: string
          checkout_access_token_hash?: string
          configuration?: Json | null
          created_at?: string
          currency?: string
          customer?: Json
          delivery_address?: Json
          delivery_pence?: number
          dispatched_at?: string | null
          fulfilment_status?: string
          id?: string
          order_notes?: string
          paid_at?: string | null
          payment_status?: string
          price_breakdown?: Json | null
          quantity?: number | null
          reference?: string
          special_instructions?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_pence?: number
          total_pence?: number
          tracking_reference?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount_pence: number
          created_at: string
          id: string
          order_id: string
          status: string
          stripe_checkout_session_id: string
          updated_at: string
        }
        Insert: {
          amount_pence: number
          created_at?: string
          id?: string
          order_id: string
          status?: string
          stripe_checkout_session_id: string
          updated_at?: string
        }
        Update: {
          amount_pence?: number
          created_at?: string
          id?: string
          order_id?: string
          status?: string
          stripe_checkout_session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_order_uploads: {
        Row: {
          bucket: string
          cart_item_id: string
          claimed_at: string | null
          created_at: string
          expires_at: string
          id: string
          kind: string
          mime_type: string
          object_path: string
          order_id: string | null
          order_item_id: string | null
          original_name: string
          session_hash: string
          size_bytes: number
        }
        Insert: {
          bucket: string
          cart_item_id: string
          claimed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          kind: string
          mime_type: string
          object_path: string
          order_id?: string | null
          order_item_id?: string | null
          original_name: string
          session_hash: string
          size_bytes: number
        }
        Update: {
          bucket?: string
          cart_item_id?: string
          claimed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          kind?: string
          mime_type?: string
          object_path?: string
          order_id?: string | null
          order_item_id?: string | null
          original_name?: string
          session_hash?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "pending_order_uploads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_order_uploads_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string | null
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_order_note: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_body: string
          p_order_id: string
        }
        Returns: string
      }
      admin_list_orders: {
        Args: {
          p_from?: string
          p_fulfilment_status?: string
          p_page?: number
          p_page_size?: number
          p_payment_status?: string
          p_query?: string
          p_to?: string
        }
        Returns: {
          billing_address: Json
          carrier: string
          created_at: string
          currency: string
          customer: Json
          delivery_address: Json
          delivery_pence: number
          fulfilment_status: string
          id: string
          order_notes: string
          payment_status: string
          reference: string
          subtotal_pence: number
          total_count: number
          total_pence: number
          tracking_reference: string
          verification_status: string
        }[]
      }
      admin_save_tracking: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_carrier: string
          p_order_id: string
          p_tracking_reference: string
        }
        Returns: boolean
      }
      admin_set_fulfilment: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_cancellation_reason?: string
          p_carrier?: string
          p_order_id: string
          p_status: string
          p_tracking_reference?: string
        }
        Returns: boolean
      }
      admin_set_verification: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_order_id: string
          p_status: string
        }
        Returns: boolean
      }
      apply_stripe_event: {
        Args: {
          p_attempt_status: string
          p_event_id: string
          p_event_type: string
          p_paid_at: string
          p_payment_intent_id: string
          p_payment_status: string
          p_session_id: string
        }
        Returns: boolean
      }
      check_api_rate_limit: {
        Args: {
          p_identifier_hash: string
          p_max_requests: number
          p_scope: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          retry_after_seconds: number
        }[]
      }
      claim_pending_order_upload: {
        Args: {
          p_order_id: string
          p_order_item_id: string
          p_session_hash: string
          p_upload_id: string
        }
        Returns: boolean
      }
      register_payment_attempt: {
        Args: {
          p_amount_pence: number
          p_order_id: string
          p_session_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
