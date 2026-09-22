<script setup lang="ts">
import { computed } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { peso, getDeadlineInfo } from '../utils/helpers'

const ledgerStore = useLedgerStore()

const totalStudents = computed(() => ledgerStore.students.length)
const totalPayables = computed(() => ledgerStore.payables.length)

const totalExpected = computed(() => ledgerStore.payables.reduce((s, p) => s + Number(p.amount), 0))
const totalCollected = computed(() => ledgerStore.payments.filter(p => !p.deleted).reduce((s, p) => s + Number(p.amount), 0))
const outstanding = computed(() => Math.max(0, totalExpected.value - totalCollected.value))

// Group payables by name for the global overview table
const groupedPayables = computed(() => {
  const uniqueNames = Array.from(new Set(ledgerStore.payables.map((p: any) => p.name)))
  return uniqueNames.map(name => {
    const matchingPayables = ledgerStore.payables.filter((p: any) => p.name === name)
    const expected = matchingPayables.reduce((s: number, p: any) => s + Number(p.amount), 0)
    
    const collected = matchingPayables.reduce((s: number, p: any) => {
      const paymentsForP = ledgerStore.payments
        .filter((pymt: any) => pymt.payable_id === p.id && !pymt.deleted)
        .reduce((sum: number, pymt: any) => sum + Number(pymt.amount), 0)
      return s + paymentsForP
    }, 0)
    
    return { 
      name, 
      expected, 
      collected, 
      price: matchingPayables[0]?.amount, 
      deadline: matchingPayables[0]?.deadline 
    }
  })
})
</script>

<template>
  <div class="animate-fade-in dashboard-page">
    <div class="dashboard-header-area">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2B3B4E; margin: 0;">Dashboard</h2>
    </div>
    
    <div class="dashboard-content-area">
      <!-- Stat Row -->
      <div class="dashboard-stat-grid">
        <div class="stat-card">
          <div style="color: #868E96; font-size: 0.85rem; margin-bottom: 8px;">Students enrolled</div>
          <div style="font-size: 1.75rem; font-weight: 600; color: #2B3B4E;">{{ totalStudents }}</div>
        </div>
        
        <div class="stat-card">
          <div style="color: #868E96; font-size: 0.85rem; margin-bottom: 8px;">Active payables</div>
          <div style="font-size: 1.75rem; font-weight: 600; color: #2B3B4E;">{{ totalPayables }}</div>
        </div>
        
        <div class="stat-card">
          <div style="color: #868E96; font-size: 0.85rem; margin-bottom: 8px;">Total collected</div>
          <div style="font-size: 1.75rem; font-weight: 600; color: #2F9E44;">{{ peso(totalCollected) }}</div>
        </div>
        
        <div class="stat-card">
          <div style="color: #868E96; font-size: 0.85rem; margin-bottom: 8px;">Outstanding balance</div>
          <div style="font-size: 1.75rem; font-weight: 600; color: #E03131;">{{ peso(outstanding) }}</div>
        </div>
      </div>

      <!-- Ledger Area -->
      <div>
        <div class="section-title-row">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #2B3B4E; margin: 0;">Collections by payable</h3>
          <span style="font-size: 0.85rem; color: #6C757D;">Updates automatically as payables and payments are added</span>
        </div>
        
        <div class="table-card" style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; overflow-x: auto; width: 100%;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead style="background: #F1F3F5; font-size: 0.75rem; text-transform: uppercase; color: #6C757D; letter-spacing: 0.05em;">
              <tr>
                <th style="padding: 16px 24px; font-weight: 600; white-space: nowrap;">Payable</th>
                <th style="padding: 16px 24px; font-weight: 600; white-space: nowrap;">Price (Typical)</th>
                <th style="padding: 16px 24px; font-weight: 600; white-space: nowrap;">Deadline</th>
                <th style="padding: 16px 24px; font-weight: 600; white-space: nowrap;">Collected / Expected</th>
                <th style="padding: 16px 24px; font-weight: 600; white-space: nowrap;">Progress</th>
              </tr>
            </thead>
            <tbody style="font-size: 0.9rem; color: #495057;">
              <tr v-for="(p, idx) in groupedPayables" :key="p.name" :style="{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }">
                <td style="padding: 16px 24px; font-weight: 500; color: #2B3B4E; white-space: nowrap;">{{ p.name }}</td>
                <td style="padding: 16px 24px; white-space: nowrap;">{{ peso(p.price) }}</td>
                <td style="padding: 16px 24px; white-space: nowrap;">
                  <span :style="getDeadlineInfo(p.deadline).style">{{ getDeadlineInfo(p.deadline).label }}</span>
                </td>
                <td style="padding: 16px 24px; white-space: nowrap;">
                  <span style="font-weight: 500; color: #2B3B4E;">{{ peso(p.collected) }}</span> <span style="color: #ADB5BD;">/ {{ peso(p.expected) }}</span>
                </td>
                <td style="padding: 16px 24px; min-width: 140px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="flex: 1; height: 6px; background: #E9ECEF; border-radius: 3px; overflow: hidden;">
                      <div :style="{ width: `${Math.min(p.expected > 0 ? Math.round((p.collected / p.expected) * 100) : 0, 100)}%`, height: '100%', background: '#2B3B4E', borderRadius: '3px' }"></div>
                    </div>
                    <span style="font-size: 0.8rem; color: #6C757D; width: 32px;">{{ p.expected > 0 ? Math.round((p.collected / p.expected) * 100) : 0 }}%</span>
                  </div>
                </td>
              </tr>
              
              <tr v-if="groupedPayables.length === 0">
                <td colspan="5" style="padding: 32px; text-align: center; color: #868E96; font-style: italic;">
                  No payables yet. Assign one to a student from their profile page.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #F8F9FA;
}

.dashboard-header-area {
  padding: 32px 32px 0 32px;
}

.dashboard-content-area {
  padding: 32px;
}

.dashboard-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #E9ECEF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .dashboard-header-area {
    padding: 16px 20px 0 20px;
  }

  .dashboard-content-area {
    padding: 16px 20px;
  }

  .dashboard-stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    padding: 16px;
  }

  .section-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .dashboard-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
