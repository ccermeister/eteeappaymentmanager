<script setup lang="ts">
import { useLedgerStore } from '../store/ledgerStore'
import { fmtDateTime } from '../utils/helpers'

const ledgerStore = useLedgerStore()
</script>

<template>
  <div class="animate-fade-in" style="display: flex; flex-direction: column; height: 100%;">
    <header style="background: white; padding: 24px 32px; border-bottom: 1px solid #E9ECEF; display: flex; align-items: center;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #2B3B4E;">Audit log</h2>
    </header>

    <div style="padding: 32px;">
      <p style="color: #6C757D; font-size: 0.85rem; margin-bottom: 16px;">
        Every edit, deletion, and approval performed in the ledger is recorded here permanently.
      </p>

      <div style="background: white; border-radius: 8px; border: 1px solid #E9ECEF; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #F1F3F5; font-size: 0.75rem; text-transform: uppercase; color: #6C757D; letter-spacing: 0.05em;">
            <tr>
              <th style="padding: 16px 24px; font-weight: 600;">When</th>
              <th style="padding: 16px 24px; font-weight: 600;">User</th>
              <th style="padding: 16px 24px; font-weight: 600;">Action</th>
              <th style="padding: 16px 24px; font-weight: 600;">Details</th>
            </tr>
          </thead>
          <tbody style="font-size: 0.9rem; color: #495057;">
            <tr v-for="(log, idx) in ledgerStore.auditLogs" :key="log.id" :style="{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }">
              <td style="padding: 16px 24px; white-space: nowrap;">{{ fmtDateTime(log.timestamp) }}</td>
              <td style="padding: 16px 24px;">
                {{ log.user }} 
                <span style="font-size: 0.75rem; padding: 2px 6px; background: #F8F9FA; border: 1px solid #DEE2E6; border-radius: 4px; margin-left: 6px;">
                  {{ log.role }}
                </span>
              </td>
              <td style="padding: 16px 24px; font-weight: 500; color: #2B3B4E;">{{ log.action }}</td>
              <td style="padding: 16px 24px; color: #6C757D;">{{ log.details }}</td>
            </tr>
            
            <tr v-if="ledgerStore.auditLogs.length === 0">
              <td colspan="4" style="padding: 32px; text-align: center; color: #868E96; font-style: italic;">
                No activity recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
