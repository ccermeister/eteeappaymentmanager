import { defineComponent } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso, getDeadlineInfo } from '../utils/helpers'

export default defineComponent({
  name: 'Payables',
  setup() {
    const ledgerStore = useLedgerStore()
    const authStore = useAuthStore()

    const totalExpectedForPayable = (payable_id: string) => {
      const payable = ledgerStore.payables.find(p => p.id === payable_id)
      if (!payable) return 0
      return payable.amount * ledgerStore.students.length
    }

    const totalCollectedForPayable = (payable_id: string) => {
      return ledgerStore.payments
        .filter(p => p.payable_id === payable_id && !p.deleted)
        .reduce((s, p) => s + Number(p.amount), 0)
    }

    return () => (
      <div class="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <header style={{ 
          background: 'white', 
          padding: '24px 32px',
          borderBottom: '1px solid #E9ECEF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#2B3B4E' }}>All Payables</h2>
        </header>

        <div style={{ padding: '32px' }}>
          <p style={{ color: '#6C757D', fontSize: '0.85rem', marginBottom: '16px' }}>
            Master list of all payables assigned to students. To assign a new payable, visit the student's profile.
          </p>

          {ledgerStore.payables.length === 0 ? (
            <p style={{ color: '#868E96', fontSize: '0.9rem' }}>
              No payables assigned yet. Go to a student's profile to assign one.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {ledgerStore.payables.map((p: any) => {
                const expected = p.amount
                const collected = totalCollectedForPayable(p.id)
                const deadline = getDeadlineInfo(p.deadline)
                const student = ledgerStore.students.find(s => s.id === p.profile_ledger_id)
                
                return (
                  <div key={p.id} style={{ 
                    background: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #E9ECEF', 
                    padding: '24px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2B3B4E', margin: 0 }}>{p.name}</h4>
                        <div style={{ color: '#6C757D', fontSize: '0.8rem', marginTop: '4px' }}>
                          Assigned to: <span style={{ fontWeight: 600, color: '#2B3B4E' }}>{student ? student.name : 'Unknown'}</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#2B3B4E' }}>{peso(p.amount)}</span>
                    </div>
                    
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ ...deadline.style, background: '#F8F9FA', padding: '4px 8px', borderRadius: '4px' }}>
                        {deadline.label}
                      </span>
                    </div>
                    
                    <div style={{ color: '#6C757D', fontSize: '0.85rem' }}>
                      Collected: <span style={{ fontWeight: 600, color: '#2B3B4E' }}>{peso(collected)}</span> of {peso(expected)} expected
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      {authStore.can('edit') && <button style={{ 
                        flex: 1, 
                        background: 'transparent', 
                        border: '1px solid #DEE2E6', 
                        padding: '6px', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        color: '#495057'
                      }}>Edit</button>}
                      {authStore.can('delete') && <button onClick={() => ledgerStore.deletePayable(p.id)} style={{ 
                        background: '#FFF5F5', 
                        border: '1px solid #FFC9C9', 
                        color: '#E03131', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer'
                      }}>Delete</button>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
})
