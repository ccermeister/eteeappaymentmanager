<script setup lang="ts">
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso, getDeadlineInfo } from '../utils/helpers'

const ledgerStore = useLedgerStore()
const authStore = useAuthStore()

const totalCollectedForPayable = (payable_id: string) => {
  return ledgerStore.payments
    .filter(p => p.payable_id === payable_id && !p.deleted)
    .reduce((s, p) => s + Number(p.amount), 0)
}
</script>

<template>
  <div class="animate-fade-in" style="display: flex; flex-direction: column; height: 100%;">
    <header style="background: white; padding: 24px 32px; border-bottom: 1px solid #E9ECEF; display: flex; align-items: center; justify-content: space-between;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2B3B4E;">All Payables</h2>
    </header>

    <div style="padding: 32px;">
      <p style="color: #6C757D; font-size: 0.85rem; margin-bottom: 16px;">
        Master list of all payables assigned to students. To assign a new payable, visit the student's profile.
      </p>

      <p v-if="ledgerStore.payables.length === 0" style="color: #868E96; font-size: 0.9rem;">
        No payables assigned yet. Go to a student's profile to assign one.
      </p>
      
      <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
        <div v-for="p in ledgerStore.payables" :key="p.id" style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; padding: 24px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h4 style="font-size: 1.1rem; font-weight: 600; color: #2B3B4E; margin: 0;">{{ p.name }}</h4>
              <div style="color: #6C757D; font-size: 0.8rem; margin-top: 4px;">
                Assigned to: <span style="font-weight: 600; color: #2B3B4E;">{{ (() => {
                  const student = ledgerStore.students.find(s => s.id === p.profile_ledger_id)
                  return student ? student.name : 'Unknown'
                })() }}</span>
              </div>
            </div>
            <span style="font-weight: 700; font-size: 1.25rem; color: #2B3B4E;">{{ peso(p.amount) }}</span>
          </div>
          
          <div style="font-size: 0.85rem;">
            <span :style="{ ...getDeadlineInfo(p.deadline).style, background: '#F8F9FA', padding: '4px 8px', borderRadius: '4px' }">
              {{ getDeadlineInfo(p.deadline).label }}
            </span>
          </div>
          
          <div style="color: #6C757D; font-size: 0.85rem;">
            Collected: <span style="font-weight: 600; color: #2B3B4E;">{{ peso(totalCollectedForPayable(p.id)) }}</span> of {{ peso(p.amount) }} expected
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button v-if="authStore.can('edit')" style="flex: 1; background: transparent; border: 1px solid #DEE2E6; padding: 6px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; color: #495057;">Edit</button>
            <button v-if="authStore.can('delete')" @click="ledgerStore.deletePayable(p.id)" style="background: #FFF5F5; border: 1px solid #FFC9C9; color: #E03131; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer;">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
