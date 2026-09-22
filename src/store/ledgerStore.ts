import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

export const useLedgerStore = defineStore('ledger', () => {
  const students = ref<any[]>([])
  const payables = ref<any[]>([])
  const payments = ref<any[]>([])
  const auditLogs = ref<any[]>([])
  const requests = ref<any[]>([])

  const batchPayableTemplates = ref<Array<{ name: string; amount: number; deadline: string }>>([])

  const loadBatchTemplates = () => {
    try {
      const saved = localStorage.getItem('eteeap_batch_payables')
      if (saved) {
        batchPayableTemplates.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error loading batch payable templates:', e)
    }
  }

  const fetchLedgerData = async () => {
    loadBatchTemplates()
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
    }).select()
    
    if (error) throw error
    const newStudent = (data && data.length > 0) ? data[0] : { id: crypto.randomUUID(), name, course, contact_number }
    students.value.push(newStudent)

    // Auto-assign all batch payables to newly created student
    for (const t of batchPayableTemplates.value) {
      try {
        await addPayable(newStudent.id, t.name, t.amount, t.deadline)
      } catch (err) {
        console.error(`Failed to assign default payable ${t.name} to new student:`, err)
      }
    }
  }

  const addPayable = async (profile_ledger_id: string, name: string, amount: number, deadline: string) => {
    // deadline might be empty string from prompt, so only include it if it's not empty
    const payload: any = { profile_ledger_id, name, amount }
    if (deadline && deadline.trim() !== '') {
      payload.deadline = deadline
    }

    const { data, error } = await supabase.from('payables').insert(payload).select()
    
    if (error) throw error
    const newPayable = (data && data.length > 0) ? data[0] : { id: crypto.randomUUID(), ...payload }
    payables.value.push(newPayable)
  }

  const addPayableToAllStudents = async (name: string, amount: number, deadline: string) => {
    // 1. Save template for current and future students
    const existingIdx = batchPayableTemplates.value.findIndex(t => t.name.toLowerCase() === name.toLowerCase())
    if (existingIdx !== -1) {
      batchPayableTemplates.value[existingIdx] = { name, amount, deadline }
    } else {
      batchPayableTemplates.value.push({ name, amount, deadline })
    }
    localStorage.setItem('eteeap_batch_payables', JSON.stringify(batchPayableTemplates.value))

    // 2. Assign to all current students
    for (const student of students.value) {
      const alreadyHas = payables.value.some(p => p.profile_ledger_id === student.id && p.name.toLowerCase() === name.toLowerCase())
      if (!alreadyHas) {
        await addPayable(student.id, name, amount, deadline)
      }
    }
  }

  const recordPayment = async (profile_ledger_id: string, payable_id: string, amount: number, method: string, note: string) => {
    const { data, error } = await supabase.from('transaction_records').insert({
      profile_ledger_id, payable_id, amount, method, note
    }).select()
    
    if (error) throw error
    const newPayment = (data && data.length > 0) ? data[0] : { id: crypto.randomUUID(), profile_ledger_id, payable_id, amount, method, note, date: new Date().toISOString() }
    payments.value.unshift(newPayment)
  }

  const getStudent = (id: string) => students.value.find(s => s.id === id)

  const updateStudent = async (id: string, name: string, course: string, contact_number: string) => {
    const { data, error } = await supabase.from('profile_ledger').update({ name, course, contact_number }).eq('id', id).select()
    if (error) throw error
    const updated = (data && data.length > 0) ? data[0] : { id, name, course, contact_number }
    const idx = students.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      students.value[idx] = { ...students.value[idx], ...updated }
    }
  }

  const deleteStudent = async (id: string) => {
    // 1. Find all payables belonging to this student
    const studentPayableList = payables.value.filter(p => p.profile_ledger_id === id || p.student_id === id)
    const payableIds = studentPayableList.map(p => p.id)

    // 2. Find all payments for this student or student's payables
    const studentPaymentList = payments.value.filter(p => p.profile_ledger_id === id || payableIds.includes(p.payable_id))
    const paymentIds = studentPaymentList.map(p => p.id)

    // 3. Delete edit requests in Supabase
    if (paymentIds.length > 0) {
      await supabase.from('edit_requests').delete().in('payment_id', paymentIds)
    }

    // 4. Delete transaction records (payments) in Supabase
    if (paymentIds.length > 0) {
      await supabase.from('transaction_records').delete().in('id', paymentIds)
    }
    await supabase.from('transaction_records').delete().eq('profile_ledger_id', id)

    // 5. Delete payables in Supabase
    if (payableIds.length > 0) {
      await supabase.from('payables').delete().in('id', payableIds)
    }
    await supabase.from('payables').delete().eq('profile_ledger_id', id)

    // 6. Delete student from profile_ledger in Supabase
    const { error } = await supabase.from('profile_ledger').delete().eq('id', id)
    if (error) throw error

    // 7. Update local reactive store
    students.value = students.value.filter(s => s.id !== id)
    payables.value = payables.value.filter(p => p.profile_ledger_id !== id && p.student_id !== id)
    payments.value = payments.value.filter(p => p.profile_ledger_id !== id && !payableIds.includes(p.payable_id))
    requests.value = requests.value.filter(r => !paymentIds.includes(r.payment_id))
  }

  const deletePayable = async (id: string) => {
    // 1. Find payments associated with this payable
    const payablePayments = payments.value.filter(p => p.payable_id === id)
    const paymentIds = payablePayments.map(p => p.id)

    // 2. Delete edit requests for these payments in Supabase
    if (paymentIds.length > 0) {
      await supabase.from('edit_requests').delete().in('payment_id', paymentIds)
    }

    // 3. Delete transaction records in Supabase
    await supabase.from('transaction_records').delete().eq('payable_id', id)

    // 4. Delete payable in Supabase
    const { error } = await supabase.from('payables').delete().eq('id', id)
    if (error) throw error

    // 5. Update local store
    payables.value = payables.value.filter(p => p.id !== id)
    payments.value = payments.value.filter(p => p.payable_id !== id)
    requests.value = requests.value.filter(r => !paymentIds.includes(r.payment_id))
  }

  const updatePayable = async (id: string, name: string, amount: number, deadline: string) => {
    const payload: any = { name, amount }
    if (deadline && deadline.trim() !== '') {
      payload.deadline = deadline
    } else {
      payload.deadline = null
    }

    const { data, error } = await supabase.from('payables').update(payload).eq('id', id).select()
    if (error) throw error
    const updated = (data && data.length > 0) ? data[0] : { id, ...payload }
    const idx = payables.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      payables.value[idx] = { ...payables.value[idx], ...updated }
    }
  }

  const deletePayment = async (id: string) => {
    // 1. Delete associated edit requests in Supabase
    await supabase.from('edit_requests').delete().eq('payment_id', id)

    // 2. Delete transaction record in Supabase
    const { error } = await supabase.from('transaction_records').delete().eq('id', id)
    if (error) throw error

    // 3. Update local store
    payments.value = payments.value.filter(p => p.id !== id)
    requests.value = requests.value.filter(r => r.payment_id !== id)
  }

  const requestEdit = async (targetId: string, reason: string) => {
    const { data, error } = await supabase.from('edit_requests').insert({
      payment_id: targetId, note: reason, status: 'pending'
    }).select()
    if (error) throw error
    const newReq = (data && data.length > 0) ? data[0] : { id: crypto.randomUUID(), payment_id: targetId, note: reason, status: 'pending', timestamp: new Date().toISOString() }
    requests.value.unshift(newReq)
  }

  const approveRequest = async (id: string) => {
    const request = requests.value.find(r => r.id === id)
    if (request && request.payment_id) {
      await deletePayment(request.payment_id)
    }
    
    const { data, error } = await supabase.from('edit_requests').update({ status: 'approved' }).eq('id', id).select()
    if (error) throw error
    const updated = (data && data.length > 0) ? data[0] : { id, status: 'approved' }
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      requests.value[idx] = { ...requests.value[idx], ...updated }
    }
  }

  const rejectRequest = async (id: string) => {
    const { data, error } = await supabase.from('edit_requests').update({ status: 'rejected' }).eq('id', id).select()
    if (error) throw error
    const updated = (data && data.length > 0) ? data[0] : { id, status: 'rejected' }
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      requests.value[idx] = { ...requests.value[idx], ...updated }
    }
  }

  return {
    students, payables, payments, auditLogs, requests, editRequests: requests, batchPayableTemplates,
    fetchLedgerData, studentTotalPaid, studentTotalDue, studentPayables, studentPayments,
    addStudent, addPayable, addPayableToAllStudents, recordPayment, getStudent,
    deletePayable, updatePayable, updateStudent, deleteStudent, deletePayment,
    approveRequest, rejectRequest, requestEdit
  }
})
