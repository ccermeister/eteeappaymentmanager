<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso, fmtDate, getDeadlineInfo, getStatusPill } from '../utils/helpers'

const route = useRoute()
const router = useRouter()
const ledgerStore = useLedgerStore()
const authStore = useAuthStore()

const studentId = route.params.id as string
const student = computed(() => ledgerStore.students.find(s => s.id === studentId))

const activeTab = ref('summary')

const studentPayables = computed(() => ledgerStore.payables.filter(p => p.profile_ledger_id === studentId))

const due = computed(() => ledgerStore.studentTotalDue(studentId))
const paid = computed(() => ledgerStore.studentTotalPaid(studentId))
const pct = computed(() => due.value > 0 ? Math.round((paid.value / due.value) * 100) : 0)

const payments = computed(() => 
  ledgerStore.payments
    .filter(p => p.profile_ledger_id === studentId && !p.deleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const handleAddPayable = async () => {
  const name = window.prompt("Enter payable name (e.g. Tuition Fee):")
  if (!name) return
  const amountStr = window.prompt("Enter amount:")
  if (!amountStr) return
  const amount = Number(amountStr)
  if (isNaN(amount)) return alert("Invalid amount")
  const deadline = window.prompt("Enter deadline (YYYY-MM-DD) or leave blank:")
  await ledgerStore.addPayable(studentId, name, amount, deadline || "")
}

const printHistory = () => {
  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow || !student.value) return
  
  const total = paid.value
  const rows = payments.value.map(payment => {
    const payable = ledgerStore.payables.find(item => item.id === payment.payable_id)
    return `<tr>
      <td>${fmtDate(payment.date)}</td>
      <td>${payable?.name || "(payable removed)"}</td>
      <td class="amount">${peso(payment.amount)}</td>
      <td>${payment.method === "full" ? "Full" : "Partial"}</td>
      <td>${payment.recordedBy || "—"}</td>
      <td>${payment.note || "—"}</td>
    </tr>`
  }).join("") || `<tr><td colspan="6" class="empty">No payments recorded yet.</td></tr>`
  
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Payment history - ${student.value.name}</title>
    <style>
      @page{size:A4;margin:16mm}
      *{box-sizing:border-box}body{margin:0;padding:40px;color:#1D2129;font:13px Arial,sans-serif}
      header{border-bottom:2px solid #35505E;padding-bottom:18px;margin-bottom:24px}
      .eyebrow{color:#667085;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 8px}
      h1{font-size:25px;margin:0 0 6px}p{margin:4px 0;color:#667085}.summary{display:flex;gap:36px;margin:0 0 20px}.summary strong{display:block;color:#1D2129;font-size:18px;margin-top:4px}
      table{border-collapse:collapse;width:100%}th{text-align:left;background:#F0F2F5;color:#667085;font-size:11px;font-weight:600;padding:10px;border-bottom:1px solid #D2D6DC}td{padding:11px 10px;border-bottom:1px solid #E4E6EA}td.amount{font-weight:600;text-align:right}.empty{text-align:center;color:#667085;padding:30px}
      @media print{body{padding:0}}
    </style></head><body>
    <header><p class="eyebrow">ETEEAP student collections</p><h1>${student.value.name}</h1><p>${student.value.course || "No course on file"}</p></header>
    <div class="summary"><div>Total payments<strong>${payments.value.length}</strong></div><div>Total collected<strong>${peso(total)}</strong></div></div>
    <table><thead><tr><th>Date</th><th>Payable</th><th>Amount</th><th>Type</th><th>Recorded by</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`)
  printWindow.document.close()
  printWindow.addEventListener("load", () => {
    printWindow.focus()
    printWindow.print()
  })
}
</script>

<template>
  <div v-if="!student" style="color: #6C757D; padding: 32px;">Student not found.</div>
  
  <div v-else class="animate-fade-in" style="display: flex; flex-direction: column; height: 100%;">
    <header style="background: white; padding: 24px 32px; border-bottom: 1px solid #E9ECEF; display: flex; align-items: center; justify-content: space-between;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2B3B4E;">Student profile</h2>
      <button v-if="authStore.can('create')" @click="handleAddPayable" style="background: #2B3B4E; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
        + Add payable
      </button>
    </header>

    <div style="padding: 32px;">
      <a @click="router.back()" style="cursor: pointer; color: #868E96; font-size: 0.85rem; margin-bottom: 16px; display: inline-block; text-decoration: none;">&larr; Back to students</a>
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
        <div>
          <h3 style="font-size: 1.75rem; color: #2B3B4E; margin-bottom: 4px;">{{ student.name }}</h3>
          <p style="color: #6C757D; font-size: 0.95rem; margin-bottom: 16px;">
            {{ student.course || "No course on file" }} {{ student.contact_number ? " · " + student.contact_number : "" }}
          </p>
          
          <div style="width: 280px; height: 6px; background: #E9ECEF; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
            <div :style="{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#2B3B4E', transition: 'width 0.3s ease' }"></div>
          </div>
          <p style="font-size: 0.85rem; color: #6C757D;">
            <span style="color: #2B3B4E; font-weight: 600;">{{ peso(paid) }}</span> paid of {{ peso(due) }} total ({{ pct }}%)
          </p>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button v-if="activeTab === 'history'" @click="printHistory" style="background: white; border: 1px solid #DEE2E6; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; color: #495057;">Print PDF</button>
          <button v-if="authStore.can('edit')" style="background: white; border: 1px solid #DEE2E6; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; color: #495057;">Edit profile</button>
          <button v-if="authStore.can('delete')" style="background: #FFF5F5; border: 1px solid #FFC9C9; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; color: #E03131;">Delete</button>
        </div>
      </div>

      <div style="display: flex; gap: 24px; border-bottom: 1px solid #E9ECEF; margin-bottom: 24px;">
        <button 
          @click="activeTab = 'summary'"
          :style="{ padding: '12px 4px', background: 'none', border: 'none', borderBottom: activeTab === 'summary' ? '2px solid #2B3B4E' : '2px solid transparent', color: activeTab === 'summary' ? '#2B3B4E' : '#868E96', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }"
        >
          Payables summary
        </button>
        <button 
          @click="activeTab = 'history'"
          :style="{ padding: '12px 4px', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid #2B3B4E' : '2px solid transparent', color: activeTab === 'history' ? '#2B3B4E' : '#868E96', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }"
        >
          Payment history
        </button>
      </div>

      <div v-if="activeTab === 'summary'" style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #F1F3F5; font-size: 0.75rem; text-transform: uppercase; color: #6C757D; letter-spacing: 0.05em;">
            <tr>
              <th style="padding: 16px 24px; font-weight: 600;">Payable</th>
              <th style="padding: 16px 24px; font-weight: 600;">Price</th>
              <th style="padding: 16px 24px; font-weight: 600;">Paid</th>
              <th style="padding: 16px 24px; font-weight: 600;">Remaining</th>
              <th style="padding: 16px 24px; font-weight: 600;">Status</th>
              <th style="padding: 16px 24px; font-weight: 600;">Deadline</th>
              <th style="padding: 16px 24px; font-weight: 600;"></th>
            </tr>
          </thead>
          <tbody style="font-size: 0.9rem; color: #495057;">
            <tr v-for="(pb, idx) in studentPayables" :key="pb.id" :style="{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }">
              <td style="padding: 16px 24px; font-weight: 500; color: #2B3B4E;">{{ pb.name }}</td>
              <td style="padding: 16px 24px;">{{ peso(pb.amount) }}</td>
              <td style="padding: 16px 24px;">
                {{ (() => {
                  const paidAmt = ledgerStore.payments.filter(p => p.profile_ledger_id === studentId && p.payable_id === pb.id && !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
                  return peso(paidAmt)
                })() }}
              </td>
              <td style="padding: 16px 24px;">
                {{ (() => {
                  const paidAmt = ledgerStore.payments.filter(p => p.profile_ledger_id === studentId && p.payable_id === pb.id && !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
                  return peso(Math.max(0, pb.amount - paidAmt))
                })() }}
              </td>
              <td style="padding: 16px 24px;">
                <span :style="(() => {
                  const paidAmt = ledgerStore.payments.filter(p => p.profile_ledger_id === studentId && p.payable_id === pb.id && !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
                  const statusVal = paidAmt >= pb.amount ? 'paid' : (paidAmt > 0 ? 'partial' : 'unpaid')
                  return {
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    background: statusVal === 'paid' ? '#EBFBEE' : (statusVal === 'partial' ? '#FFF9DB' : '#FFF5F5'), 
                    color: statusVal === 'paid' ? '#2F9E44' : (statusVal === 'partial' ? '#F08C00' : '#E03131')
                  }
                })()">
                  {{ (() => {
                    const paidAmt = ledgerStore.payments.filter(p => p.profile_ledger_id === studentId && p.payable_id === pb.id && !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
                    const statusVal = paidAmt >= pb.amount ? 'paid' : (paidAmt > 0 ? 'partial' : 'unpaid')
                    return getStatusPill(statusVal).label
                  })() }}
                </span>
              </td>
              <td style="padding: 16px 24px;">
                <span :style="{ ...getDeadlineInfo(pb.deadline).style, fontSize: '0.85rem' }">{{ getDeadlineInfo(pb.deadline).label }}</span>
              </td>
              <td style="padding: 16px 24px;">
                <button v-if="authStore.can('pay') && (() => {
                  const paidAmt = ledgerStore.payments.filter(p => p.profile_ledger_id === studentId && p.payable_id === pb.id && !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
                  return paidAmt < pb.amount
                })()" style="background: #2B3B4E; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Pay</button>
              </td>
            </tr>
            <tr v-if="studentPayables.length === 0">
              <td colspan="7" style="padding: 32px; text-align: center; color: #868E96; font-style: italic;">No payables assigned to this student yet.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #F1F3F5; font-size: 0.75rem; text-transform: uppercase; color: #6C757D; letter-spacing: 0.05em;">
            <tr>
              <th style="padding: 16px 24px; font-weight: 600;">Date</th>
              <th style="padding: 16px 24px; font-weight: 600;">Payable</th>
              <th style="padding: 16px 24px; font-weight: 600;">Amount</th>
              <th style="padding: 16px 24px; font-weight: 600;">Type</th>
              <th style="padding: 16px 24px; font-weight: 600;">Recorded by</th>
              <th style="padding: 16px 24px; font-weight: 600;">Note</th>
              <th style="padding: 16px 24px; font-weight: 600;"></th>
            </tr>
          </thead>
          <tbody style="font-size: 0.9rem; color: #495057;">
            <tr v-for="(p, idx) in payments" :key="p.id" :style="{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }">
              <td style="padding: 16px 24px;">{{ fmtDate(p.date) }}</td>
              <td style="padding: 16px 24px;">
                {{ (() => {
                  const payable = ledgerStore.payables.find(pb => pb.id === p.payable_id)
                  return payable?.name || "(removed)"
                })() }}
              </td>
              <td style="padding: 16px 24px; font-weight: 600; color: #2F9E44;">{{ peso(p.amount) }}</td>
              <td style="padding: 16px 24px;">{{ p.method === 'full' ? 'Full' : 'Partial' }}</td>
              <td style="padding: 16px 24px;">{{ p.recordedBy }}</td>
              <td style="padding: 16px 24px;">{{ p.note || '—' }}</td>
              <td style="padding: 16px 24px;">
                <div v-if="authStore.can('delete')" style="display: flex; gap: 8px;">
                  <button style="background: transparent; border: 1px solid #DEE2E6; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Edit</button>
                  <button style="background: #FFF5F5; border: 1px solid #FFC9C9; color: #E03131; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Del</button>
                </div>
                <template v-else-if="authStore.can('requestEdit')">
                  <span v-if="ledgerStore.editRequests.find(r => r.paymentId === p.id && r.status === 'pending')" style="font-size: 0.75rem; color: #ADB5BD;">Edit requested</span>
                  <button v-else style="background: transparent; border: 1px solid #DEE2E6; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Request edit</button>
                </template>
              </td>
            </tr>
            <tr v-if="payments.length === 0">
              <td colspan="7" style="padding: 32px; text-align: center; color: #868E96; font-style: italic;">No payments recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
