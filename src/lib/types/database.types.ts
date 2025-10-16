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
          email: string | null
          company_address: string | null
          tax_id: string | null
          legal_name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          company?: string | null
          email?: string | null
          company_address?: string | null
          tax_id?: string | null
          legal_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          company?: string | null
          email?: string | null
          company_address?: string | null
          tax_id?: string | null
          legal_name?: string | null
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
          include_contact_name: boolean
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
          include_contact_name?: boolean
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
          include_contact_name?: boolean
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
          stripe_subscription_id: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          stripe_subscription_id: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          stripe_subscription_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string | null
        }
      }
      send_counter: {
        Row: {
          id: string
          org_id: string
          count: number
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          count?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          count?: number
          created_at?: string | null
        }
      }
      template: {
        Row: {
          id: string
          org_id: string
          name: string
          spec: Json
          is_curated: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          spec: Json
          is_curated?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          spec?: Json
          is_curated?: boolean
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
