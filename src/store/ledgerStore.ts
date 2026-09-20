import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { supabase } from '../utils/supabase'
import type { Database } from '../types/database.types'

type Student = Database['public']['Tables']['profile_ledger']['Row']
type Payable = Database['public']['Tables']['payables']['Row']
type Payment = Database['public']['Tables']['transaction_records']['Row']
type AuditLog = Database['public']['Tables']['audit_logs']['Row']
type EditRequest = Database['public']['Tables']['edit_requests']['Row']

export const useLedgerStore = defineStore('ledger', {
  state: () => ({
    students: [] as Student[],
    payables: [] as Payable[],
    payments: [] as Payment[],
    auditLogs: [] as AuditLog[],
    editRequests: [] as EditRequest[],
    loading: false,
    isFetching: false,
    error: null as string | null
  }),
  getters: {
    // We compute totals in a map to make lookups O(1) in the UI
    totals(state) {
      const map = new Map<string, { due: number; paid: number }>()
      
      // Calculate dues
      for (const p of state.payables) {
        if (p.deleted_at) continue;
        const current = map.get(p.profile_ledger_id) || { due: 0, paid: 0 }
        current.due += Number(p.amount)
        map.set(p.profile_ledger_id, current)
      }
      
      // Calculate paids
      for (const pay of state.payments) {
        if (pay.deleted || pay.deleted_at) continue;
        const current = map.get(pay.profile_ledger_id) || { due: 0, paid: 0 }
        current.paid += Number(pay.amount)
        map.set(pay.profile_ledger_id, current)
      }
      
      return map
    },
    studentTotalDue: (state) => {
      return (profile_ledger_id: string) => {
        // In a real app we might rely on the SQL view, but for optimistic UI updates we can use this getter
        const totals = state.payables
          .filter(p => p.profile_ledger_id === profile_ledger_id && !p.deleted_at)
          .reduce((sum, p) => sum + Number(p.amount), 0)
        return totals;
      }
    },
    studentTotalPaid: (state) => {
      return (profile_ledger_id: string) => {
        const totals = state.payments
          .filter(p => p.profile_ledger_id === profile_ledger_id && !p.deleted && !p.deleted_at)
          .reduce((sum, p) => sum + Number(p.amount), 0)
        return totals;
      }
    }
  },
  actions: {
    async fetchLedgerData() {
      const authStore = useAuthStore()
      if (!authStore.session?.access_token) return
      
      if (this.isFetching) return;
      this.isFetching = true;
      this.loading = true
      this.error = null
      
      try {
        const [
          { data: students, error: err1 },
          { data: payables, error: err2 },
          { data: payments, error: err3 },
          { data: auditLogs, error: err4 },
          { data: editRequests, error: err5 }
        ] = await Promise.all([
          (supabase as any).from('profile_ledger').select('*').order('date_added', { ascending: false }),
          (supabase as any).from('payables').select('*').order('date_added', { ascending: false }),
          (supabase as any).from('transaction_records').select('*').order('date', { ascending: false }),
          (supabase as any).from('audit_logs').select('*').order('timestamp', { ascending: false }),
          (supabase as any).from('edit_requests').select('*').order('timestamp', { ascending: false })
        ])

        if (err1) throw err1
        if (err2) throw err2
        if (err3) throw err3
        if (err4) throw err4
        if (err5) throw err5

        this.students = (students as Student[] | null)?.filter(s => !s.deleted_at) || []
        this.payables = (payables as Payable[] | null)?.filter(p => !p.deleted_at) || []
        this.payments = (payments as Payment[] | null)?.filter(p => !p.deleted && !p.deleted_at) || []
        this.auditLogs = auditLogs || []
        this.editRequests = editRequests || []
      } catch (err: any) {
        console.error('Failed to fetch ledger data:', err)
        this.error = err.message || 'Unknown error occurred'
        throw err;
      } finally {
        this.loading = false
        this.isFetching = false
      }
    },
    async addStudent(name: string, course: string, contact_number: string) {
      try {
        const { data, error } = await (supabase as any).from('profile_ledger').insert({
          name,
          course,
          contact_number
        }).select().maybeSingle()
        
        if (error) throw error
        if (data) {
          this.students.unshift(data)
        }
      } catch (err: any) {
        console.error('Error adding student:', err);
        throw err;
      }
    },
    
    async editStudent(id: string, name: string, course: string, contact_number: string) {
      try {
        const { data, error } = await (supabase as any).from('profile_ledger').update({
          name,
          course,
          contact_number
        }).eq('id', id).select().maybeSingle()
        
        if (error) throw error
        if (data) {
          const index = this.students.findIndex(s => s.id === id)
          if (index !== -1) this.students[index] = data
        }
      } catch (err: any) {
        console.error('Error editing student:', err);
        throw err;
      }
    },
    async deleteStudent(id: string) {
      const student = this.students.find(s => s.id === id)
      if (!student) return
      
      try {
        // Soft delete
        const { error } = await (supabase as any).from('profile_ledger').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().maybeSingle()
        if (error) throw error
        
        // Remove from local array or mark as deleted
        this.students = this.students.filter(s => s.id !== id)
      } catch (err: any) {
        console.error('Error deleting student:', err);
        throw err;
      }
    },

    async addPayable(profile_ledger_id: string, name: string, amount: number, deadline: string) {
      try {
        const { data, error } = await (supabase as any).from('payables').insert({
          profile_ledger_id,
          name,
          amount,
          deadline: deadline || null
        }).select().maybeSingle()
        
        if (error) throw error
        if (data) {
          this.payables.unshift(data)
        }
      } catch (err: any) {
        console.error('Error adding payable:', err);
        throw err;
      }
    },
    
    async deletePayable(id: string) {
      const payable = this.payables.find(p => p.id === id)
      if (!payable) return
      
      try {
        // Soft delete
        const { error } = await (supabase as any).from('payables').update({ deleted_at: new Date().toISOString() }).eq('id', id)
        if (error) throw error
        
        this.payables = this.payables.filter(p => p.id !== id)
      } catch (err: any) {
        console.error('Error deleting payable:', err);
        throw err;
      }
    },

    async recordPayment(profile_ledger_id: string, payable_id: string, amount: number, method: 'full' | 'partial', note: string) {
      try {
        // We no longer manually pass recorded_by; the DB trigger/default handles it via auth.uid()
        const { data, error } = await (supabase as any).from('transaction_records').insert({
          profile_ledger_id,
          payable_id,
          amount,
          method,
          note
        }).select().maybeSingle()
        
        if (error) throw error
        if (data) {
          this.payments.unshift(data)
        }
      } catch (err: any) {
        console.error('Error recording payment:', err);
        throw err;
      }
    }
    // These legacy actions are now replaced by getters, keeping them as empty methods or returning getters for backward compatibility if needed.
    // However, since we added getters with the same name, we should remove them here.
  }
})
