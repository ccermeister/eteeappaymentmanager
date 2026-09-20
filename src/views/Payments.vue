<script setup lang="ts">
import { useLedgerStore } from '../store/ledgerStore'

const ledgerStore = useLedgerStore()

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)
}
</script>

<template>
  <div class="animate-fade-in">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h3>Payments Register</h3>
      <button class="btn btn-primary">+ Record Payment</button>
    </div>

    <div class="card glass table-wrapper" style="padding: 0;">
      <div v-if="ledgerStore.payments.length === 0" style="padding: 48px; text-align: center; color: var(--text-secondary);">
        No payments recorded yet.
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>Date</th>
            <th>Student ID</th>
            <th>Amount</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in ledgerStore.payments" :key="payment.id">
            <td>{{ new Date(payment.date).toLocaleDateString() }}</td>
            <td>{{ payment.studentId }}</td>
            <td style="font-weight: 600; color: var(--success);">{{ formatCurrency(payment.amount) }}</td>
            <td><span style="font-family: monospace; opacity: 0.8;">{{ payment.reference || 'N/A' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
