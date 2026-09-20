import { defineComponent } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'

export default defineComponent({
  name: 'Payments',
  setup() {
    const ledgerStore = useLedgerStore()

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)
    }

    return () => (
      <div class="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>Payments Register</h3>
          <button class="btn btn-primary">+ Record Payment</button>
        </div>

        <div class="card glass table-wrapper" style={{ padding: 0 }}>
          {ledgerStore.payments.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No payments recorded yet.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student ID</th>
                  <th>Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {ledgerStore.payments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.studentId}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(payment.amount)}</td>
                    <td><span style={{ fontFamily: 'monospace', opacity: 0.8 }}>{payment.reference || 'N/A'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }
})
