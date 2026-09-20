import { defineComponent } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { fmtDateTime } from '../utils/helpers'

export default defineComponent({
  name: 'AuditLog',
  setup() {
    const ledgerStore = useLedgerStore()

    return () => (
      <div class="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <header style={{ 
          background: 'white', 
          padding: '24px 32px',
          borderBottom: '1px solid #E9ECEF',
          display: 'flex',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#2B3B4E' }}>Audit log</h2>
        </header>

        <div style={{ padding: '32px' }}>
          <p style={{ color: '#6C757D', fontSize: '0.85rem', marginBottom: '16px' }}>
            Every edit, deletion, and approval performed in the ledger is recorded here permanently.
          </p>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F1F3F5', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6C757D', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>When</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>User</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem', color: '#495057' }}>
                {ledgerStore.auditLogs.map((log: any, idx: number) => (
                  <tr key={log.id} style={{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }}>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>{fmtDateTime(log.timestamp)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      {log.user} 
                      <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#F8F9FA', border: '1px solid #DEE2E6', borderRadius: '4px', marginLeft: '6px' }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: '#2B3B4E' }}>{log.action}</td>
                    <td style={{ padding: '16px 24px', color: '#6C757D' }}>{log.details}</td>
                  </tr>
                ))}
                
                {ledgerStore.auditLogs.length === 0 && (
                  <tr>
                    <td colspan="4" style={{ padding: '32px', textAlign: 'center', color: '#868E96', fontStyle: 'italic' }}>
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
})
