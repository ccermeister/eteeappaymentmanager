import { defineComponent } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { peso, getDeadlineInfo } from '../utils/helpers'

export default defineComponent({
  name: 'DashboardOverview',
  setup() {
    const ledgerStore = useLedgerStore()

    return () => {
      const totalStudents = ledgerStore.students.length
      const totalPayables = ledgerStore.payables.length
      
      const totalExpected = ledgerStore.payables.reduce((s, p) => s + Number(p.amount), 0)
      const totalCollected = ledgerStore.payments.filter(p => !p.deleted).reduce((s, p) => s + Number(p.amount), 0)
      const outstanding = Math.max(0, totalExpected - totalCollected)

      // Group payables by name for the global overview table
      const uniqueNames = Array.from(new Set(ledgerStore.payables.map((p: any) => p.name)))
      const groupedPayables = uniqueNames.map(name => {
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

      return (
        <div class="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8F9FA' }}>
          <div style={{ padding: '32px 32px 0 32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#2B3B4E', margin: 0 }}>Dashboard</h2>
          </div>
          
          <div style={{ padding: '32px' }}>
            {/* Stat Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '24px', 
              marginBottom: '40px' 
            }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E9ECEF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#868E96', fontSize: '0.85rem', marginBottom: '8px' }}>Students enrolled</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#2B3B4E' }}>{totalStudents}</div>
              </div>
              
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E9ECEF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#868E96', fontSize: '0.85rem', marginBottom: '8px' }}>Active payables</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#2B3B4E' }}>{totalPayables}</div>
              </div>
              
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E9ECEF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#868E96', fontSize: '0.85rem', marginBottom: '8px' }}>Total collected</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#2F9E44' }}>{peso(totalCollected)}</div>
              </div>
              
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #E9ECEF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#868E96', fontSize: '0.85rem', marginBottom: '8px' }}>Outstanding balance</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#E03131' }}>{peso(outstanding)}</div>
              </div>
            </div>

            {/* Ledger Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2B3B4E', margin: 0 }}>Collections by payable</h3>
                <span style={{ fontSize: '0.85rem', color: '#6C757D' }}>Updates automatically as payables and payments are added</span>
              </div>
              
              <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F1F3F5', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6C757D', letterSpacing: '0.05em' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Payable</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Price (Typical)</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Deadline</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Collected / Expected</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Progress</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.9rem', color: '#495057' }}>
                    {groupedPayables.map((p: any, idx: number) => {
                      const pct = p.expected > 0 ? Math.round((p.collected / p.expected) * 100) : 0
                      const deadline = getDeadlineInfo(p.deadline)
                      
                      return (
                        <tr key={p.name} style={{ borderTop: idx > 0 ? '1px solid #E9ECEF' : 'none' }}>
                          <td style={{ padding: '16px 24px', fontWeight: 500, color: '#2B3B4E' }}>{p.name}</td>
                          <td style={{ padding: '16px 24px' }}>{peso(p.price)}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ ...deadline.style }}>{deadline.label}</span>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ fontWeight: 500, color: '#2B3B4E' }}>{peso(p.collected)}</span> <span style={{ color: '#ADB5BD' }}>/ {peso(p.expected)}</span>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#E9ECEF', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#2B3B4E', borderRadius: '3px' }}></div>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: '#6C757D', width: '32px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    
                    {groupedPayables.length === 0 && (
                      <tr>
                        <td colspan="5" style={{ padding: '32px', textAlign: 'center', color: '#868E96', fontStyle: 'italic' }}>
                          No payables yet. Assign one to a student from their profile page.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
})
