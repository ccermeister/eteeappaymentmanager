<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso, getDeadlineInfo } from '../utils/helpers'

const ledgerStore = useLedgerStore()
const authStore = useAuthStore()

const showAddModal = ref(false)
const form = ref({ student_id: '', name: '', amount: '', deadline: '' })
const submitting = ref(false)

const showEditModal = ref(false)
const editForm = ref({ id: '', name: '', amount: '', deadline: '' })

const searchQuery = ref('')
const sortKey = ref('deadline')
const sortOrder = ref('asc')

const totalCollectedForPayable = (payable_id: string) => {
  return ledgerStore.payments
    .filter(p => p.payable_id === payable_id && !p.deleted)
    .reduce((s, p) => s + Number(p.amount), 0)
}

const filteredPayables = computed(() => {
  let res = ledgerStore.payables.map(p => {
    const student = ledgerStore.students.find(s => s.id === p.profile_ledger_id)
    return {
      ...p,
      studentName: student ? student.name : 'Unknown',
      collected: totalCollectedForPayable(p.id)
    }
  })

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(p => p.name.toLowerCase().includes(q) || p.studentName.toLowerCase().includes(q))
  }

  return res.sort((a, b) => {
    let valA, valB
    if (sortKey.value === 'name') { valA = a.name; valB = b.name }
    else if (sortKey.value === 'student') { valA = a.studentName; valB = b.studentName }
    else if (sortKey.value === 'amount') { valA = Number(a.amount); valB = Number(b.amount) }
    else if (sortKey.value === 'collected') { valA = a.collected; valB = b.collected }
    else if (sortKey.value === 'deadline') { valA = a.deadline || '9999-12-31'; valB = b.deadline || '9999-12-31' }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const setSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const handleAddPayable = async () => {
  if (!form.value.student_id || !form.value.name || !form.value.amount) {
    return alert('Please fill in all required fields.')
  }
  
  submitting.value = true
  try {
    if (form.value.student_id === 'ALL_STUDENTS') {
      await ledgerStore.addPayableToAllStudents(form.value.name.trim(), Number(form.value.amount), form.value.deadline)
    } else {
      await ledgerStore.addPayable(form.value.student_id, form.value.name.trim(), Number(form.value.amount), form.value.deadline)
    }
    showAddModal.value = false
    form.value = { student_id: '', name: '', amount: '', deadline: '' }
  } catch (error: any) {
    alert("Failed to add payable: " + (error.message || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}

const handlePay = async (payable: any) => {
  const remaining = Math.max(0, payable.amount - payable.collected)
  
  const amountStr = window.prompt(`Enter amount to pay for ${payable.name} (Remaining: ₱${remaining}):`)
  if (!amountStr) return
  const amount = Number(amountStr)
  if (isNaN(amount) || amount <= 0) return alert("Invalid amount")
  
  if (amount > remaining) {
    return alert("Payment exceeds remaining balance.")
  }

  const method = amount >= remaining ? 'full' : 'partial'
  const note = window.prompt("Enter note (optional):")
  
  try {
    await ledgerStore.recordPayment(payable.profile_ledger_id, payable.id, amount, method, note || "")
    alert("Payment recorded successfully!")
  } catch (error: any) {
    alert("Failed to record payment: " + (error.message || 'Unknown error'))
  }
}

const openEdit = (payable: any) => {
  editForm.value = { 
    id: payable.id, 
    name: payable.name, 
    amount: payable.amount, 
    deadline: payable.deadline || '' 
  }
  showEditModal.value = true
}

const handleEditPayable = async () => {
  if (!editForm.value.name || !editForm.value.amount) {
    return alert('Please fill in all required fields.')
  }
  submitting.value = true
  try {
    await ledgerStore.updatePayable(editForm.value.id, editForm.value.name, Number(editForm.value.amount), editForm.value.deadline)
    showEditModal.value = false
  } catch (error: any) {
    alert("Failed to update payable: " + (error.message || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this payable?")) return
  try {
    await ledgerStore.deletePayable(id)
  } catch (error: any) {
    alert("Failed to delete payable: " + (error.message || 'Unknown error'))
  }
}
</script>

<template>
  <div class="animate-fade-in" style="display: flex; flex-direction: column; height: 100%;">
    <header style="background: white; padding: 24px 32px; border-bottom: 1px solid #E9ECEF; display: flex; align-items: center; justify-content: space-between;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2B3B4E;">All Payables</h2>
      <button v-if="authStore.can('create')" class="btn btn-primary" @click="showAddModal = true">
        + Add Payable
      </button>
    </header>

    <div style="padding: 32px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <p style="color: #6C757D; font-size: 0.85rem; margin: 0;">
          Master list of all payables assigned to students.
        </p>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search payables or students..." 
          class="form-input" 
          style="width: 300px; padding: 8px 12px; font-size: 0.9rem;"
        />
      </div>

      <p v-if="ledgerStore.payables.length === 0" style="color: #868E96; font-size: 0.9rem;">
        No payables assigned yet. Click "Add Payable" to assign one.
      </p>
      
      <div v-else style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #F1F3F5; font-size: 0.75rem; text-transform: uppercase; color: #6C757D; letter-spacing: 0.05em; user-select: none;">
            <tr>
              <th style="padding: 16px 24px; font-weight: 600; cursor: pointer;" @click="setSort('name')">
                Payable Name <span v-if="sortKey==='name'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th style="padding: 16px 24px; font-weight: 600; cursor: pointer;" @click="setSort('student')">
                Student <span v-if="sortKey==='student'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th style="padding: 16px 24px; font-weight: 600; cursor: pointer;" @click="setSort('amount')">
                Amount <span v-if="sortKey==='amount'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th style="padding: 16px 24px; font-weight: 600; cursor: pointer;" @click="setSort('collected')">
                Collected <span v-if="sortKey==='collected'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th style="padding: 16px 24px; font-weight: 600; cursor: pointer;" @click="setSort('deadline')">
                Deadline <span v-if="sortKey==='deadline'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th style="padding: 16px 24px; font-weight: 600;"></th>
            </tr>
          </thead>
          <tbody style="font-size: 0.9rem; color: #495057;">
            <tr v-for="(p, idx) in filteredPayables" :key="p.id" :style="{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }">
              <td style="padding: 16px 24px; font-weight: 500; color: #2B3B4E;">{{ p.name }}</td>
              <td style="padding: 16px 24px; color: #495057;">{{ p.studentName }}</td>
              <td style="padding: 16px 24px;">{{ peso(p.amount) }}</td>
              <td style="padding: 16px 24px;">
                <span style="font-weight: 600; color: #2B3B4E;">{{ peso(p.collected) }}</span>
                <span style="color: #ADB5BD; font-size: 0.75rem; margin-left: 4px;">({{ Math.round((p.collected/p.amount)*100) }}%)</span>
              </td>
              <td style="padding: 16px 24px;">
                <span :style="{ ...getDeadlineInfo(p.deadline).style, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }">
                  {{ getDeadlineInfo(p.deadline).label }}
                </span>
              </td>
              <td style="padding: 16px 24px;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                  <button v-if="authStore.can('pay') && p.collected < p.amount" @click="handlePay(p)" style="background: #2B3B4E; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Pay</button>
                  <button v-if="authStore.can('edit')" @click="openEdit(p)" style="background: transparent; border: 1px solid #DEE2E6; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; color: #495057;">Edit</button>
                  <button v-if="authStore.can('delete') || (authStore.role === 'treasurer' && p.collected === 0)" @click="handleDelete(p.id)" style="background: #FFF5F5; border: 1px solid #FFC9C9; color: #E03131; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredPayables.length === 0">
              <td colspan="6" style="padding: 32px; text-align: center; color: #868E96; font-style: italic;">
                No payables found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Add Payable Modal -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content animate-scale-in">
        <header class="modal-header">
          <h3 class="modal-title">Assign a Payable</h3>
          <button class="btn-ghost" @click="showAddModal = false">&times;</button>
        </header>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select Student</label>
            <select v-model="form.student_id" class="form-input" style="appearance: auto;">
              <option value="" disabled>-- Choose a student --</option>
              <option value="ALL_STUDENTS" style="font-weight: 600; color: #2B3B4E;">
                All Students (Current & Future)
              </option>
              <option v-for="student in ledgerStore.students" :key="student.id" :value="student.id">
                {{ student.name }} ({{ student.course }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Payable Name</label>
            <input type="text" v-model="form.name" class="form-input" placeholder="e.g. Graduation Fee" />
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₱)</label>
            <input type="number" v-model="form.amount" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">Deadline (Optional)</label>
            <input type="date" v-model="form.deadline" class="form-input" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showAddModal = false" :disabled="submitting">Cancel</button>
            <button class="btn btn-primary" @click="handleAddPayable" :disabled="submitting">
              {{ submitting ? 'Assigning...' : 'Assign Payable' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Payable Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content animate-scale-in">
        <header class="modal-header">
          <h3 class="modal-title">Edit Payable</h3>
          <button class="btn-ghost" @click="showEditModal = false">&times;</button>
        </header>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Payable Name</label>
            <input type="text" v-model="editForm.name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₱)</label>
            <input type="number" v-model="editForm.amount" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Deadline (Optional)</label>
            <input type="date" v-model="editForm.deadline" class="form-input" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showEditModal = false" :disabled="submitting">Cancel</button>
            <button class="btn btn-primary" @click="handleEditPayable" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
