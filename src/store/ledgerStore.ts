import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export const useLedgerStore = defineStore('ledger', () => {
  const students = ref<any[]>([])
  const payables = ref<any[]>([])
  const payments = ref<any[]>([])
  const auditLogs = ref<any[]>([])
  const requests = ref<any[]>([])

  const fetchLedgerData = async () => {
    const [studentsRes, payablesRes, paymentsRes, requestsRes, auditRes] = await Promise.all([
      supabase.from('profile_ledger').select('*').order('name'),
      supabase.from('payables').select('*'),
      supabase.from('transaction_records').select('*').order('date', { ascending: false }),
      supabase.from('edit_requests').select('*').order('timestamp', { ascending: false }),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false })
    ])
    
    if (studentsRes.data) students.value = studentsRes.data
    if (payablesRes.data) payables.value = payablesRes.data
    if (paymentsRes.data) payments.value = paymentsRes.data
    if (requestsRes.data) requests.value = requestsRes.data
    if (auditRes.data) auditLogs.value = auditRes.data
  }

  const studentTotalPaid = (studentId: string) => {
    const studentPayables = payables.value.filter(p => p.student_id === studentId || p.profile_ledger_id === studentId)
    const payableIds = studentPayables.map(p => p.id)
    return payments.value
      .filter(p => payableIds.includes(p.payable_id))
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }

  const studentTotalDue = (studentId: string) => {
    return payables.value
      .filter(p => p.student_id === studentId || p.profile_ledger_id === studentId)
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }

  const studentPayables = (studentId: string) => {
    return payables.value.filter(p => p.student_id === studentId || p.profile_ledger_id === studentId)
  }

  const studentPayments = (studentId: string) => {
    const sPayables = payables.value.filter(p => p.student_id === studentId || p.profile_ledger_id === studentId).map(p => p.id)
    return payments.value.filter(p => sPayables.includes(p.payable_id))
  }

  const addStudent = async (name: string, course: string, contact_number: string) => {
    const { data, error } = await supabase.from('profile_ledger').insert({
      name, course, contact_number
    }).select().single()
    
    if (error) throw error
    if (data) students.value.push(data)
  }

  const addPayable = async (profile_ledger_id: string, name: string, amount: number, deadline: string) => {
    // deadline might be empty string from prompt, so only include it if it's not empty
    const payload: any = { profile_ledger_id, name, amount }
    if (deadline && deadline.trim() !== '') {
      payload.deadline = deadline
    }

    const { data, error } = await supabase.from('payables').insert(payload).select().single()
    
    if (error) throw error
    if (data) payables.value.push(data)
  }

  const recordPayment = async (profile_ledger_id: string, payable_id: string, amount: number, method: string, note: string) => {
    const { data, error } = await supabase.from('transaction_records').insert({
      profile_ledger_id, payable_id, amount, method, note
    }).select().single()
    
    if (error) throw error
    if (data) payments.value.unshift(data)
  }

  const getStudent = (id: string) => students.value.find(s => s.id === id)

  const updateStudent = async (id: string, name: string, course: string, contact_number: string) => {
    const { data, error } = await supabase.from('profile_ledger').update({ name, course, contact_number }).eq('id', id).select().single()
    if (error) throw error
    if (data) {
      const idx = students.value.findIndex(s => s.id === id)
      if (idx !== -1) students.value[idx] = data
    }
  }

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from('profile_ledger').delete().eq('id', id)
    if (error) throw error
    students.value = students.value.filter(s => s.id !== id)
  }

  const deletePayable = async (id: string) => {
    const { error } = await supabase.from('payables').delete().eq('id', id)
    if (error) throw error
    payables.value = payables.value.filter(p => p.id !== id)
  }

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from('transaction_records').delete().eq('id', id)
    if (error) throw error
    payments.value = payments.value.filter(p => p.id !== id)
  }

  const requestEdit = async (targetType: string, targetId: string, reason: string) => {
    const { data, error } = await supabase.from('edit_requests').insert({
      payment_id: targetId, note: reason, status: 'pending'
    }).select().single()
    if (error) throw error
    if (data) requests.value.unshift(data)
  }

  const approveRequest = async (id: string) => {
    const request = requests.value.find(r => r.id === id)
    if (request && request.payment_id) {
      await deletePayment(request.payment_id)
    }
    
    const { data, error } = await supabase.from('edit_requests').update({ status: 'approved' }).eq('id', id).select().single()
    if (error) throw error
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) requests.value[idx] = data
  }

  const rejectRequest = async (id: string) => {
    const { data, error } = await supabase.from('edit_requests').update({ status: 'rejected' }).eq('id', id).select().single()
    if (error) throw error
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) requests.value[idx] = data
  }

  return {
    students, payables, payments, auditLogs, requests, editRequests: requests,
    fetchLedgerData, studentTotalPaid, studentTotalDue, studentPayables, studentPayments,
    addStudent, addPayable, recordPayment, getStudent,
    deletePayable, updateStudent, deleteStudent, deletePayment,
    approveRequest, rejectRequest, requestEdit
  }
})
