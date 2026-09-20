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
      profile_ledger: {
        Row: {
          id: string
          name: string
          course: string | null
          contact_number: string | null
          date_added: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          course?: string | null
          contact_number?: string | null
          date_added?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          course?: string | null
          contact_number?: string | null
          date_added?: string
          deleted_at?: string | null
        }
      }
      payables: {
        Row: {
          id: string
          profile_ledger_id: string
          name: string
          amount: number
          deadline: string | null
          date_added: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          profile_ledger_id: string
          name: string
          amount: number
          deadline?: string | null
          date_added?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          profile_ledger_id?: string
          name?: string
          amount?: number
          deadline?: string | null
          date_added?: string
          deleted_at?: string | null
        }
      }
      transaction_records: {
        Row: {
          id: string
          payable_id: string | null
          profile_ledger_id: string
          amount: number
          method: string
          note: string | null
          recorded_by: string | null
          date: string
          deleted: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          payable_id?: string | null
          profile_ledger_id: string
          amount: number
          method: string
          note?: string | null
          recorded_by?: string | null
          date?: string
          deleted?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: string
          payable_id?: string | null
          profile_ledger_id?: string
          amount?: number
          method?: string
          note?: string | null
          recorded_by?: string | null
          date?: string
          deleted?: boolean
          deleted_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user: string
          role: string
          action: string
          details: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user: string
          role: string
          action: string
          details?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user?: string
          role?: string
          action?: string
          details?: string | null
          timestamp?: string
        }
      }
      edit_requests: {
        Row: {
          id: string
          payment_id: string
          status: string
          requested_by: string
          note: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          payment_id: string
          status?: string
          requested_by: string
          note?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          payment_id?: string
          status?: string
          requested_by?: string
          note?: string | null
          timestamp?: string
        }
      }
    }
    Views: {
      student_ledger_totals: {
        Row: {
          profile_ledger_id: string
          total_due: number
          total_paid: number
        }
      }
    }
    Functions: {
      [key: string]: never
    }
    Enums: {
      [key: string]: never
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}
