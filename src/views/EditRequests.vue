<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso, fmtDateTime } from '../utils/helpers'

const ledgerStore = useLedgerStore()
const authStore = useAuthStore()

const showReviewModal = ref(false)
const selectedRequest = ref<any>(null)
const submitting = ref(false)

const requests = computed(() => {
  const mine = authStore.role === 'treasurer'
  return ledgerStore.editRequests
    .filter(r => mine ? r.requested_by === (authStore.user?.user_metadata?.display || authStore.user?.email) : true)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const openReview = (r: any) => {
  selectedRequest.value = r
  showReviewModal.value = true
}

const handleApprove = async (id: string) => {
  submitting.value = true
  try {
    await ledgerStore.approveRequest(id)
    showReviewModal.value = false
  } catch (error: any) {
    alert("Failed to approve request: " + (error.message || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}

const handleReject = async (id: string) => {
  submitting.value = true
  try {
    await ledgerStore.rejectRequest(id)
    showReviewModal.value = false
  } catch (error: any) {
    alert("Failed to reject request: " + (error.message || 'Unknown error'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-container animate-fade-in">
    <header class="page-header">
      <h2 class="page-title">Edit requests</h2>
    </header>

    <div class="content-area">
      <p style="color: #6C757D; font-size: 0.85rem; margin-bottom: 16px;">
        {{ authStore.role === 'admin' 
          ? 'Review requests filed by the treasurer for corrections to recorded payments.' 
          : 'Requests you file here are sent to the admin to correct a payment entered in error.' }}
      </p>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Filed</th>
              <th>Student</th>
              <th>Payable</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Filed by</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests" :key="r.id">
              <td>{{ fmtDateTime(r.timestamp) }}</td>
              <td>
                {{ (() => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  const student = payment ? ledgerStore.students.find(s => s.id === payment.profile_ledger_id) : null
                  return student ? student.name : '—'
                })() }}
              </td>
              <td>
                {{ (() => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  const payable = payment ? ledgerStore.payables.find(pb => pb.id === payment.payable_id) : null
                  return payable ? payable.name : '—'
                })() }}
              </td>
              <td>
                {{ (() => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  return payment ? peso(payment.amount) : '—'
                })() }}
              </td>
              <td>{{ r.note }}</td>
              <td>
                <div style="font-weight: 600; color: #2B3B4E; margin-bottom: 4px;">{{ r.requested_by }}</div>
              </td>
              <td>
                <template v-if="r.status === 'pending'">
                  <button v-if="authStore.role === 'admin'" @click="openReview(r)" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 10px;">Review</button>
                  <span v-else style="color: #F08C00; font-size: 0.85rem;">Awaiting admin</span>
                </template>
                <span v-else style="color: #ADB5BD; font-size: 0.85rem;">Resolved</span>
              </td>
            </tr>
            
            <tr v-if="requests.length === 0">
              <td colspan="7" class="empty-state">
                No edit requests filed.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal && selectedRequest" class="modal-overlay">
      <div class="modal-content animate-scale-in">
        <header class="modal-header">
          <h3 class="modal-title">Review Edit Request</h3>
          <button class="btn-ghost" @click="showReviewModal = false">&times;</button>
        </header>
        
        <div class="modal-body">
          <p style="margin-bottom: 16px; color: #495057; font-size: 0.95rem;">
            <strong>Requested by:</strong> {{ selectedRequest.requested_by }}<br/>
            <strong>Reason:</strong> {{ selectedRequest.note }}
          </p>
          <div style="background: #FFF5F5; border: 1px solid #FFC9C9; color: #E03131; padding: 12px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 16px;">
            <strong>Warning:</strong> Approving this request will permanently delete the incorrect payment record. The Treasurer can then enter a new payment to correct the mistake.
          </div>
          
          <div class="modal-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" @click="handleReject(selectedRequest.id)" :disabled="submitting">Reject Request</button>
            <button class="btn" style="background: #E03131; color: white;" @click="handleApprove(selectedRequest.id)" :disabled="submitting">
              {{ submitting ? 'Processing...' : 'Approve & Delete Payment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
