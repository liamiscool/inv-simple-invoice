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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_org: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      app_user: {
        Row: {
          bank_details: string | null
          company_address: string | null
          company_name: string | null
          created_at: string | null
          date_format: string | null
          default_currency: string | null
          full_name: string | null
          id: string
          onboarding_tour_completed: boolean | null
          onboarding_tour_completed_at: string | null
          onboarding_tour_skipped: boolean | null
          onboarding_tour_step: number | null
          operates_as_company: boolean | null
          org_id: string
          tax_id: string | null
        }
        Insert: {
          bank_details?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          date_format?: string | null
          default_currency?: string | null
          full_name?: string | null
          id: string
          onboarding_tour_completed?: boolean | null
          onboarding_tour_completed_at?: string | null
          onboarding_tour_skipped?: boolean | null
          onboarding_tour_step?: number | null
          operates_as_company?: boolean | null
          org_id: string
          tax_id?: string | null
        }
        Update: {
          bank_details?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          date_format?: string | null
          default_currency?: string | null
          full_name?: string | null
          id?: string
          onboarding_tour_completed?: boolean | null
          onboarding_tour_completed_at?: string | null
          onboarding_tour_skipped?: boolean | null
          onboarding_tour_step?: number | null
          operates_as_company?: boolean | null
          org_id?: string
          tax_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_user_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          company: string | null
          company_address: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          email: string | null
          id: string
          invoice_counter: number | null
          invoice_prefix: string | null
          legal_name: string | null
          name: string
          notes: string | null
          org_id: string
          tax_id: string | null
          use_custom_invoice_prefix: boolean | null
        }
        Insert: {
          company?: string | null
          company_address?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          invoice_counter?: number | null
          invoice_prefix?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          org_id: string
          tax_id?: string | null
          use_custom_invoice_prefix?: boolean | null
        }
        Update: {
          company?: string | null
          company_address?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          invoice_counter?: number | null
          invoice_prefix?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          tax_id?: string | null
          use_custom_invoice_prefix?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
      client_counter: {
        Row: {
          client_count: number | null
          org_id: string
          updated_at: string | null
        }
        Insert: {
          client_count?: number | null
          org_id: string
          updated_at?: string | null
        }
        Update: {
          client_count?: number | null
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_counter_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoice_counter: {
        Row: {
          client_id: string
          current_counter: number
          updated_at: string | null
          year: number
        }
        Insert: {
          client_id: string
          current_counter?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          client_id?: string
          current_counter?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_invoice_counter_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field: {
        Row: {
          created_at: string
          field_label: string
          field_name: string
          field_type: string
          id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          include_contact_name: boolean | null
          issue_date: string
          notes: string | null
          number: string
          org_id: string
          pdf_generated_at: string | null
          pdf_url: string | null
          status: string
          subtotal: number
          tax_total: number
          template_id: string
          total: number
        }
        Insert: {
          amount_paid?: number
          client_id: string
          created_at?: string | null
          currency: string
          due_date?: string | null
          id?: string
          include_contact_name?: boolean | null
          issue_date: string
          notes?: string | null
          number: string
          org_id: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status: string
          subtotal?: number
          tax_total?: number
          template_id: string
          total?: number
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          include_contact_name?: boolean | null
          issue_date?: string
          notes?: string | null
          number?: string
          org_id?: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          template_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_item: {
        Row: {
          description: string
          id: string
          invoice_id: string
          line_total: number
          position: number
          qty: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          position: number
          qty?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          position?: number
          qty?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_item_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment: {
        Row: {
          amount: number
          date: string
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
        }
        Insert: {
          amount: number
          date: string
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_subscription: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_subscription_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
      send_counter: {
        Row: {
          org_id: string
          sent_count: number
          updated_at: string | null
        }
        Insert: {
          org_id: string
          sent_count?: number
          updated_at?: string | null
        }
        Update: {
          org_id?: string
          sent_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "send_counter_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
      template: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          kind: string
          metadata: Json | null
          org_id: string | null
          preview_url: string | null
          spec: Json
          status: string | null
          title: string
          type: Database["public"]["Enums"]["template_type"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kind: string
          metadata?: Json | null
          org_id?: string | null
          preview_url?: string | null
          spec: Json
          status?: string | null
          title: string
          type?: Database["public"]["Enums"]["template_type"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string
          metadata?: Json | null
          org_id?: string | null
          preview_url?: string | null
          spec?: Json
          status?: string | null
          title?: string
          type?: Database["public"]["Enums"]["template_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "template_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "app_org"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      next_invoice_number: {
        Args: { p_org_id: string; p_client_id?: string }
        Returns: string
      }
    }
    Enums: {
      plan_type: "free" | "pro"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
      template_type: "curated" | "user_uploaded"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      plan_type: ["free", "pro"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      template_type: ["curated", "user_uploaded"],
    },
  },
} as const
