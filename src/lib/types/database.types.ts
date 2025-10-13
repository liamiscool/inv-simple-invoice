export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_org: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string | null
        }
      }
      app_user: {
        Row: {
          id: string
          org_id: string
          full_name: string | null
          default_currency: string | null
          company_name: string | null
          company_address: string | null
          tax_id: string | null
          bank_details: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          org_id: string
          full_name?: string | null
          default_currency?: string | null
          company_name?: string | null
          company_address?: string | null
          tax_id?: string | null
          bank_details?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          full_name?: string | null
          default_currency?: string | null
          company_name?: string | null
          company_address?: string | null
          tax_id?: string | null
          bank_details?: string | null
          created_at?: string | null
        }
      }
      client: {
        Row: {
          id: string
          org_id: string
          name: string
          company: string | null
          company_address: string | null
          email: string | null
          currency: string | null
          legal_name: string | null
          tax_id: string | null
          notes: string | null
          deleted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          company?: string | null
          company_address?: string | null
          email?: string | null
          currency?: string | null
          legal_name?: string | null
          tax_id?: string | null
          notes?: string | null
          deleted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          company?: string | null
          company_address?: string | null
          email?: string | null
          currency?: string | null
          legal_name?: string | null
          tax_id?: string | null
          notes?: string | null
          deleted_at?: string | null
          created_at?: string | null
        }
      }
      template: {
        Row: {
          id: string
          org_id: string | null
          title: string
          kind: 'curated' | 'uploaded'
          spec: Json
          preview_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id?: string | null
          title: string
          kind: 'curated' | 'uploaded'
          spec: Json
          preview_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string | null
          title?: string
          kind?: 'curated' | 'uploaded'
          spec?: Json
          preview_url?: string | null
          created_at?: string | null
        }
      }
      invoice: {
        Row: {
          id: string
          org_id: string
          client_id: string
          template_id: string
          number: string
          issue_date: string
          due_date: string | null
          currency: string
          status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void'
          notes: string | null
          subtotal: number
          tax_total: number
          total: number
          amount_paid: number
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          client_id: string
          template_id: string
          number: string
          issue_date: string
          due_date?: string | null
          currency: string
          status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void'
          notes?: string | null
          subtotal?: number
          tax_total?: number
          total?: number
          amount_paid?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          client_id?: string
          template_id?: string
          number?: string
          issue_date?: string
          due_date?: string | null
          currency?: string
          status?: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void'
          notes?: string | null
          subtotal?: number
          tax_total?: number
          total?: number
          amount_paid?: number
          created_at?: string | null
        }
      }
      invoice_item: {
        Row: {
          id: string
          invoice_id: string
          position: number
          description: string
          qty: number
          unit_price: number
          tax_rate: number
          line_total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          position: number
          description: string
          qty?: number
          unit_price?: number
          tax_rate?: number
          line_total?: number
        }
        Update: {
          id?: string
          invoice_id?: string
          position?: number
          description?: string
          qty?: number
          unit_price?: number
          tax_rate?: number
          line_total?: number
        }
      }
      invoice_payment: {
        Row: {
          id: string
          invoice_id: string
          date: string
          amount: number
          method: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          date: string
          amount: number
          method?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          date?: string
          amount?: number
          method?: string | null
          notes?: string | null
        }
      }
      plan_subscription: {
        Row: {
          id: string
          org_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: 'free' | 'pro_monthly' | 'pro_yearly'
          status: 'active' | 'canceled' | 'incomplete' | 'past_due'
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan: 'free' | 'pro_monthly' | 'pro_yearly'
          status: 'active' | 'canceled' | 'incomplete' | 'past_due'
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'free' | 'pro_monthly' | 'pro_yearly'
          status?: 'active' | 'canceled' | 'incomplete' | 'past_due'
          created_at?: string | null
        }
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
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      next_invoice_number: {
        Args: { p_org_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}