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
  <div class="animate-fade-in" style="display: flex; flex-direction: column; height: 100%;">
    <header style="background: white; padding: 24px 32px; border-bottom: 1px solid #E9ECEF; display: flex; align-items: center;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2B3B4E;">Edit requests</h2>
    </header>

    <div style="padding: 32px;">
      <p style="color: #6C757D; font-size: 0.85rem; margin-bottom: 16px;">
        {{ authStore.role === 'admin' 
          ? 'Review requests filed by the treasurer for corrections to recorded payments.' 
          : 'Requests you file here are sent to the admin to correct a payment entered in error.' }}
      </p>

      <div style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #F1F3F5; font-size: 0.75rem; text-transform: uppercase; color: #6C757D; letter-spacing: 0.05em;">
            <tr>
              <th style="padding: 16px 24px; font-weight: 600;">Filed</th>
              <th style="padding: 16px 24px; font-weight: 600;">Student</th>
              <th style="padding: 16px 24px; font-weight: 600;">Payable</th>
              <th style="padding: 16px 24px; font-weight: 600;">Amount</th>
              <th style="padding: 16px 24px; font-weight: 600;">Reason</th>
              <th style="padding: 16px 24px; font-weight: 600;">Filed by</th>
              <th style="padding: 16px 24px; font-weight: 600;"></th>
            </tr>
          </thead>
          <tbody style="font-size: 0.9rem; color: #495057;">
            <tr v-for="(r, idx) in requests" :key="r.id" :style="{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }">
              <td style="padding: 16px 24px;">{{ fmtDateTime(r.timestamp) }}</td>
              <td style="padding: 16px 24px;">
                {{ (() => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  const student = payment ? ledgerStore.students.find(s => s.id === payment.profile_ledger_id) : null
                  return student ? student.name : '—'
                })() }}
              </td>
              <td style="padding: 16px 24px;">
                {{ (() => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  const payable = payment ? ledgerStore.payables.find(pb => pb.id === payment.payable_id) : null
                  return payable ? payable.name : '—'
                })() }}
              </td>
              <td style="padding: 16px 24px;">
                {{ (() => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  return payment ? peso(payment.amount) : '—'
                })() }}
              </td>
              <td style="padding: 16px 24px;">{{ r.note }}</td>
              <td style="padding: 16px 24px;">
                <div style="font-weight: 600; color: #2B3B4E; margin-bottom: 4px;">{{ r.requested_by }}</div>
              </td>
              <td style="padding: 16px 24px;">
                <template v-if="r.status === 'pending'">
                  <button v-if="authStore.role === 'admin'" @click="openReview(r)" style="background: transparent; border: 1px solid #DEE2E6; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">Review</button>
                  <span v-else style="color: #F08C00; font-size: 0.85rem;">Awaiting admin</span>
                </template>
                <span v-else style="color: #ADB5BD; font-size: 0.85rem;">Resolved</span>
              </td>
            </tr>
            
            <tr v-if="requests.length === 0">
              <td colspan="7" style="padding: 32px; text-align: center; color: #868E96; font-style: italic;">
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
