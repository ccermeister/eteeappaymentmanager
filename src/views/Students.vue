<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso } from '../utils/helpers'

const ledgerStore = useLedgerStore()
const authStore = useAuthStore()
const search = ref('')

// Add Student Modal state
const showAddModal = ref(false)
const submitting = ref(false)
const form = ref({ name: '', course: '', contact_number: '' })

// Pay Modal state
const showPayModal = ref(false)
const selectedStudent = ref<any>(null)
const payForm = ref({ payable_id: '', amount: '', note: '' })
const paying = ref(false)

const filteredStudents = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return ledgerStore.students
  return ledgerStore.students.filter(s => 
    s.name.toLowerCase().includes(q) || (s.course && s.course.toLowerCase().includes(q))
  )
})

const getStudentUnpaidPayables = (studentId: string) => {
  const sPayables = ledgerStore.payables.filter(p => p.profile_ledger_id === studentId || p.student_id === studentId)
  return sPayables.map(p => {
    const paidAmt = ledgerStore.payments
      .filter(pm => (pm.profile_ledger_id === studentId || pm.student_id === studentId) && pm.payable_id === p.id && !pm.deleted)
      .reduce((sum, pm) => sum + Number(pm.amount), 0)
    const remaining = Math.max(0, p.amount - paidAmt)
    return { ...p, paidAmt, remaining }
  }).filter(p => p.remaining > 0)
}

const hasUnpaidPayables = (studentId: string) => {
  return getStudentUnpaidPayables(studentId).length > 0
}

const availablePayables = computed(() => {
  if (!selectedStudent.value) return []
  return getStudentUnpaidPayables(selectedStudent.value.id)
})

const openPayModal = (student: any) => {
  selectedStudent.value = student
  const unpaid = getStudentUnpaidPayables(student.id)
  const defaultPayable = unpaid[0]
  payForm.value = {
    payable_id: defaultPayable ? defaultPayable.id : '',
    amount: defaultPayable ? String(defaultPayable.remaining) : '',
    note: ''
  }
  showPayModal.value = true
}

watch(() => payForm.value.payable_id, (newPayableId) => {
  if (newPayableId && selectedStudent.value) {
    const p = availablePayables.value.find(item => item.id === newPayableId)
    if (p) {
      payForm.value.amount = String(p.remaining)
    }
  }
})

const handleAddStudent = async (e: Event) => {
  e.preventDefault()
  submitting.value = true
  try {
    await ledgerStore.addStudent(form.value.name, form.value.course, form.value.contact_number)
    showAddModal.value = false
    form.value = { name: '', course: '', contact_number: '' }
  } catch (error: any) {
    console.error('Add student failed:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    alert("Failed to add student: " + (error.message || 'Unknown error'));
  } finally {
    submitting.value = false
  }
}

const handleRecordPayment = async (e: Event) => {
  e.preventDefault()
  if (!selectedStudent.value || !payForm.value.payable_id || !payForm.value.amount) {
    return alert("Please select a payable and enter an amount.")
  }

  const payable = availablePayables.value.find(p => p.id === payForm.value.payable_id)
  if (!payable) return alert("Selected payable not found.")

  const amount = Number(payForm.value.amount)
  if (isNaN(amount) || amount <= 0) return alert("Please enter a valid payment amount.")
  if (amount > payable.remaining) return alert(`Payment amount cannot exceed remaining balance (${peso(payable.remaining)}).`)

  const method = amount >= payable.remaining ? 'full' : 'partial'
  paying.value = true

  try {
    await ledgerStore.recordPayment(
      selectedStudent.value.id,
      payable.id,
      amount,
      method,
      payForm.value.note || ''
    )
    showPayModal.value = false
    alert(`Payment of ${peso(amount)} recorded successfully for ${selectedStudent.value.name}!`)
  } catch (error: any) {
    alert("Failed to record payment: " + (error.message || 'Unknown error'))
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="page-container animate-fade-in">
    <header class="page-header">
      <h2 class="page-title">Students</h2>
      <button v-if="authStore.can('create')" class="btn btn-primary" @click="showAddModal = true">
        + Add student
      </button>
    </header>

    <div class="content-area">
      <div class="toolbar">
        <input 
          type="text" 
          class="search-input"
          v-model="search"
          placeholder="Search by name or course..." 
        />
        <span class="record-count">
          {{ ledgerStore.students.length }} students on record
        </span>
      </div>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Paid</th>
              <th>Total due</th>
              <th>Status</th>
              <th>Progress</th>
              <th v-if="authStore.can('pay')">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredStudents.length === 0">
              <td :colspan="authStore.can('pay') ? 6 : 5" class="empty-state">
                No students match yet.
              </td>
            </tr>
            <tr v-for="student in filteredStudents" :key="student.id">
              <td>
                <RouterLink :to="`/students/${student.id}`" class="link-primary">
                  {{ student.name }}
                </RouterLink>
                <div class="text-subtitle">{{ student.course }}</div>
              </td>
              <td>
                {{ (() => {
                  const paid = ledgerStore.studentTotalPaid(student.id)
                  return peso(paid)
                })() }}
              </td>
              <td>
                {{ (() => {
                  const due = ledgerStore.studentTotalDue(student.id)
                  return peso(due)
                })() }}
              </td>
              <td>
                <span :class="`status-badge ${(() => {
                  const due = ledgerStore.studentTotalDue(student.id)
                  const paid = ledgerStore.studentTotalPaid(student.id)
                  return due === 0 ? 'status-none' : (paid >= due ? 'status-cleared' : 'status-balance')
                })()}`">
                  {{ (() => {
                    const due = ledgerStore.studentTotalDue(student.id)
                    const paid = ledgerStore.studentTotalPaid(student.id)
                    return due === 0 ? 'No balance' : (paid >= due ? 'Cleared' : 'Has balance')
                  })() }}
                </span>
              </td>
              <td>
                <template v-if="ledgerStore.studentTotalDue(student.id) > 0">
                  <div class="progress-wrapper">
                    <div class="progress-track">
                      <div 
                        :class="`progress-fill ${ledgerStore.studentTotalPaid(student.id) >= ledgerStore.studentTotalDue(student.id) ? 'cleared' : 'balance'}`" 
                        :style="{ width: `${Math.min(100, Math.round((ledgerStore.studentTotalPaid(student.id) / ledgerStore.studentTotalDue(student.id)) * 100))}%` }"
                      ></div>
                    </div>
                    <span class="progress-pct">{{ Math.round((ledgerStore.studentTotalPaid(student.id) / ledgerStore.studentTotalDue(student.id)) * 100) }}%</span>
                  </div>
                </template>
                <span v-else class="text-light">—</span>
              </td>
              <td v-if="authStore.can('pay')">
                <button 
                  v-if="hasUnpaidPayables(student.id)" 
                  @click="openPayModal(student)" 
                  style="background: #2B3B4E; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;"
                >
                  Pay
                </button>
                <span v-else-if="ledgerStore.studentTotalDue(student.id) > 0" style="font-size: 0.75rem; color: #2F9E44; font-weight: 600;">
                  Cleared
                </span>
                <span v-else style="font-size: 0.75rem; color: #ADB5BD;">
                  No payables
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Student Modal -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content animate-scale-in">
        <header class="modal-header">
          <h3 class="modal-title">Add student</h3>
          <button class="btn-ghost" @click="showAddModal = false">&times;</button>
        </header>
        
        <form class="modal-body" @submit="handleAddStudent">
          <div class="form-group">
            <label class="form-label">Full name</label>
            <input required v-model="form.name" type="text" class="form-input" placeholder="e.g. Jane Doe" />
          </div>
          <div class="form-group">
            <label class="form-label">Course (Program)</label>
            <input v-model="form.course" type="text" class="form-input" placeholder="e.g. BSIT" />
          </div>
          <div class="form-group">
            <label class="form-label">Contact number (optional)</label>
            <input v-model="form.contact_number" type="text" class="form-input" placeholder="e.g. 09123456789" />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Adding...' : 'Add student' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Pay Modal -->
    <div v-if="showPayModal" class="modal-overlay">
      <div class="modal-content animate-scale-in" style="max-width: 460px;">
        <header class="modal-header">
          <div>
            <h3 class="modal-title" style="margin: 0;">Record Payment</h3>
            <p style="margin: 4px 0 0; font-size: 0.85rem; color: #6C757D;">
              Student: <strong>{{ selectedStudent?.name }}</strong>
            </p>
          </div>
          <button class="btn-ghost" @click="showPayModal = false">&times;</button>
        </header>
        
        <form class="modal-body" @submit="handleRecordPayment">
          <div class="form-group">
            <label class="form-label">Select Payable to Pay</label>
            <select v-model="payForm.payable_id" class="form-input" required style="appearance: auto;">
              <option value="" disabled>-- Choose a payable --</option>
              <option v-for="payable in availablePayables" :key="payable.id" :value="payable.id">
                {{ payable.name }} — Remaining: {{ peso(payable.remaining) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Amount (₱)</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              v-model="payForm.amount" 
              class="form-input" 
              placeholder="0.00" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Note (Optional)</label>
            <input 
              type="text" 
              v-model="payForm.note" 
              class="form-input" 
              placeholder="e.g. Paid via GCash / Cash" 
            />
          </div>

          <div class="modal-actions" style="margin-top: 24px;">
            <button type="button" class="btn btn-secondary" @click="showPayModal = false" :disabled="paying">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="paying">
              {{ paying ? 'Recording...' : 'Record Payment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
