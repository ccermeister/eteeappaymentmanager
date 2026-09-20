import { defineComponent } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso, fmtDateTime } from '../utils/helpers'

export default defineComponent({
  name: 'EditRequests',
  setup() {
    const ledgerStore = useLedgerStore()
    const authStore = useAuthStore()

    const getRequests = () => {
      const mine = authStore.role === 'treasurer'
      return ledgerStore.editRequests
        .filter(r => mine ? r.requestedBy === (authStore.user?.user_metadata?.display || authStore.user?.email) : true)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    return () => (
      <div class="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <header style={{ 
          background: 'white', 
          padding: '24px 32px',
          borderBottom: '1px solid #E9ECEF',
          display: 'flex',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#2B3B4E' }}>Edit requests</h2>
        </header>

        <div style={{ padding: '32px' }}>
          <p style={{ color: '#6C757D', fontSize: '0.85rem', marginBottom: '16px' }}>
            {authStore.role === 'admin' 
              ? 'Review requests filed by the treasurer for corrections to recorded payments.' 
              : 'Requests you file here are sent to the admin to correct a payment entered in error.'}
          </p>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#F1F3F5', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6C757D', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Filed</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Student</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Payable</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Reason</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Filed by</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}></th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem', color: '#495057' }}>
                {getRequests().map((r: any, idx: number) => {
                  const payment = ledgerStore.payments.find(p => p.id === r.payment_id)
                  const student = payment ? ledgerStore.students.find(s => s.id === payment.profile_ledger_id) : null
                  const payable = payment ? ledgerStore.payables.find(pb => pb.id === payment.payable_id) : null
                  
                  return (
                    <tr key={r.id} style={{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }}>
                      <td style={{ padding: '16px 24px' }}>{fmtDateTime(r.timestamp)}</td>
                      <td style={{ padding: '16px 24px' }}>{student ? student.name : '—'}</td>
                      <td style={{ padding: '16px 24px' }}>{payable ? payable.name : '—'}</td>
                      <td style={{ padding: '16px 24px' }}>{payment ? peso(payment.amount) : '—'}</td>
                      <td style={{ padding: '16px 24px' }}>{r.note}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, color: '#2B3B4E', marginBottom: '4px' }}>{r.requested_by}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {r.status === 'pending' ? (
                          authStore.role === 'admin' ? (
                            <button style={{ background: 'transparent', border: '1px solid #DEE2E6', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Review</button>
                          ) : (
                            <span style={{ color: '#F08C00', fontSize: '0.85rem' }}>Awaiting admin</span>
                          )
                        ) : (
                          <span style={{ color: '#ADB5BD', fontSize: '0.85rem' }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                
                {getRequests().length === 0 && (
                  <tr>
                    <td colspan="7" style={{ padding: '32px', textAlign: 'center', color: '#868E96', fontStyle: 'italic' }}>
                      No edit requests filed.
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
