import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { supabase } from '../utils/supabase'

export const useLedgerStore = defineStore('ledger', {
  state: () => ({
    students: [] as any[],
    payables: [] as any[],
    payments: [] as any[],
    auditLogs: [] as any[],
    editRequests: [] as any[],
    loading: false,
    error: null as string | null
  }),
  actions: {
    async fetchLedgerData() {
      const authStore = useAuthStore()
      if (!authStore.session?.access_token) return
      
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
          supabase.from('profile_ledger').select('*').order('date_added', { ascending: false }),
          supabase.from('payables').select('*').order('date_added', { ascending: false }),
          supabase.from('transaction_records').select('*').order('date', { ascending: false }),
          supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }),
          supabase.from('edit_requests').select('*').order('timestamp', { ascending: false })
        ])

        if (err1) throw err1
        if (err2) throw err2
        if (err3) throw err3
        if (err4) throw err4
        if (err5) throw err5

        this.students = students || []
        this.payables = payables || []
        this.payments = payments || []
        this.auditLogs = auditLogs || []
        this.editRequests = editRequests || []
      } catch (err: any) {
        console.error('Failed to fetch ledger data:', err)
        this.error = err.message || 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },

    async addAuditLog(action: string, details: string) {
      const authStore = useAuthStore()
      const log = {
        user: authStore.user?.user_metadata?.display || authStore.user?.email || 'Unknown',
        role: authStore.role,
        action,
        details,
      }
      
      const { data, error } = await supabase.from('audit_logs').insert(log).select().single()
      if (error) console.error("Error adding audit log:", error)
      if (data) this.auditLogs.unshift(data)
    },

    async addStudent(name: string, course: string, contact_number: string) {
      const { data, error } = await supabase.from('profile_ledger').insert({
        name,
        course,
        contact_number
      }).select().single()
      
      if (error) throw error
      if (data) {
        this.students.unshift(data)
        await this.addAuditLog("Created student", `Added profile for "${name}"`)
      }
    },
    
    async editStudent(id: string, name: string, course: string, contact_number: string) {
      const { data, error } = await supabase.from('profile_ledger').update({
        name,
        course,
        contact_number
      }).eq('id', id).select().single()
      
      if (error) throw error
      if (data) {
        const index = this.students.findIndex(s => s.id === id)
        if (index !== -1) this.students[index] = data
        await this.addAuditLog("Edited student", `Updated profile for "${name}"`)
      }
    },

    async deleteStudent(id: string) {
      const student = this.students.find(s => s.id === id)
      if (!student) return
      
      const { error } = await supabase.from('profile_ledger').delete().eq('id', id)
      if (error) throw error
      
      this.students = this.students.filter(s => s.id !== id)
      await this.addAuditLog("Deleted student", `Removed profile for "${student.name}"`)
    },

    async addPayable(profile_ledger_id: string, name: string, amount: number, deadline: string) {
      const { data, error } = await supabase.from('payables').insert({
        profile_ledger_id,
        name,
        amount,
        deadline: deadline || null
      }).select().single()
      
      if (error) throw error
      if (data) {
        this.payables.unshift(data)
        await this.addAuditLog("Created payable", `Added "${name}" for ₱${amount}`)
      }
    },
    
    async deletePayable(id: string) {
      const payable = this.payables.find(p => p.id === id)
      if (!payable) return
      
      const { error } = await supabase.from('payables').delete().eq('id', id)
      if (error) throw error
      
      this.payables = this.payables.filter(p => p.id !== id)
      await this.addAuditLog("Deleted payable", `Removed "${payable.name}"`)
    },

    async recordPayment(profile_ledger_id: string, payable_id: string, amount: number, method: 'full' | 'partial', note: string) {
      const authStore = useAuthStore()
      const { data, error } = await supabase.from('transaction_records').insert({
        profile_ledger_id,
        payable_id,
        amount,
        method,
        note,
        recorded_by: authStore.user?.email || 'Unknown'
      }).select().single()
      
      if (error) throw error
      if (data) {
        this.payments.unshift(data)
        await this.addAuditLog("Recorded payment", `Recorded ₱${amount} payment for student ${profile_ledger_id}`)
      }
    },
    
    studentTotalDue(profile_ledger_id: string) {
      return this.payables.filter(p => p.profile_ledger_id === profile_ledger_id).reduce((s, p) => s + Number(p.amount), 0)
    },
    
    studentTotalPaid(profile_ledger_id: string) {
      return this.payments.filter(p => p.profile_ledger_id === profile_ledger_id && !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
    }
  }
})
