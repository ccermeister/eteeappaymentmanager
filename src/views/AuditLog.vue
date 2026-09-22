<script setup lang="ts">
import { useLedgerStore } from '../store/ledgerStore'
import { fmtDateTime } from '../utils/helpers'

const ledgerStore = useLedgerStore()
</script>

<template>
  <div class="page-container animate-fade-in">
    <header class="page-header">
      <h2 class="page-title">Audit log</h2>
    </header>

    <div class="content-area">
      <p style="color: #6C757D; font-size: 0.85rem; margin-bottom: 16px;">
        Every edit, deletion, and approval performed in the ledger is recorded here permanently.
      </p>

      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in ledgerStore.auditLogs" :key="log.id">
              <td>{{ fmtDateTime(log.timestamp) }}</td>
              <td>
                {{ log.user }} 
                <span style="font-size: 0.75rem; padding: 2px 6px; background: #F8F9FA; border: 1px solid #DEE2E6; border-radius: 4px; margin-left: 6px;">
                  {{ log.role }}
                </span>
              </td>
              <td style="font-weight: 500; color: #2B3B4E;">{{ log.action }}</td>
              <td style="color: #6C757D;">{{ log.details }}</td>
            </tr>
            
            <tr v-if="ledgerStore.auditLogs.length === 0">
              <td colspan="4" class="empty-state">
                No activity recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
