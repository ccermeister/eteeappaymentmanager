import { defineComponent, ref, computed } from 'vue'
import { useLedgerStore } from '../store/ledgerStore'
import { useAuthStore } from '../store/authStore'
import { peso } from '../utils/helpers'
import { RouterLink } from 'vue-router'

export default defineComponent({
  name: 'Students',
  setup() {
    const ledgerStore = useLedgerStore()
    const authStore = useAuthStore()
    const search = ref('')
    
    // Modal state
    const showAddModal = ref(false)
    const submitting = ref(false)
    const form = ref({ name: '', course: '', contact_number: '' })

    const filteredStudents = computed(() => {
      const q = search.value.trim().toLowerCase()
      if (!q) return ledgerStore.students
      return ledgerStore.students.filter(s => 
        s.name.toLowerCase().includes(q) || (s.course && s.course.toLowerCase().includes(q))
      )
    })

    const handleAddStudent = async (e: Event) => {
      e.preventDefault()
      submitting.value = true
      try {
        await ledgerStore.addStudent(form.value.name, form.value.course, form.value.contact_number)
        showAddModal.value = false
        form.value = { name: '', course: '', contact_number: '' }
      } catch (error: any) {
        alert("Failed to add student: " + (error.message || 'Unknown error'))
      } finally {
        submitting.value = false
      }
    }

    return () => (
      <div class="page-container animate-fade-in">
        <header class="page-header">
          <h2 class="page-title">Students</h2>
          {authStore.can('create') && (
            <button class="btn btn-primary" onClick={() => showAddModal.value = true}>
              + Add student
            </button>
          )}
        </header>

        <div class="content-area">
          <div class="toolbar">
            <input 
              type="text" 
              class="search-input"
              v-model={search.value}
              placeholder="Search by name or course..." 
            />
            <span class="record-count">
              {ledgerStore.students.length} students on record
            </span>
          </div>

          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Paid</th>
                  <th>Total due</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.value.length === 0 ? (
                  <tr>
                    <td colspan={5} class="empty-state">
                      No students match yet.
                    </td>
                  </tr>
                ) : filteredStudents.value.map((student: any) => {
                  const due = ledgerStore.studentTotalDue(student.id)
                  const paid = ledgerStore.studentTotalPaid(student.id)
                  const pct = due > 0 ? Math.round((paid / due) * 100) : 0
                  
                  return (
                    <tr key={student.id}>
                      <td>
                        <RouterLink to={`/students/${student.id}`} class="link-primary">
                          {student.name}
                        </RouterLink>
                        <div class="text-subtitle">{student.course}</div>
                      </td>
                      <td>{peso(paid)}</td>
                      <td>{peso(due)}</td>
                      <td>
                        <span class={`status-badge ${due === 0 ? 'status-none' : (paid >= due ? 'status-cleared' : 'status-balance')}`}>
                          {due === 0 ? 'No balance' : (paid >= due ? 'Cleared' : 'Has balance')}
                        </span>
                      </td>
                      <td>
                        {due > 0 ? (
                          <div class="progress-wrapper">
                            <div class="progress-track">
                              <div class={`progress-fill ${paid >= due ? 'cleared' : 'balance'}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                            </div>
                            <span class="progress-pct">{pct}%</span>
                          </div>
                        ) : <span class="text-light">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Student Modal */}
        {showAddModal.value && (
          <div class="modal-overlay">
            <div class="modal-content animate-scale-in">
              <header class="modal-header">
                <h3 class="modal-title">Add student</h3>
                <button class="btn-ghost" onClick={() => showAddModal.value = false}>&times;</button>
              </header>
              
              <form class="modal-body" onSubmit={handleAddStudent}>
                <div class="form-group">
                  <label class="form-label">Full name</label>
                  <input required v-model={form.value.name} type="text" class="form-input" placeholder="e.g. Jane Doe" />
                </div>
                <div class="form-group">
                  <label class="form-label">Course (Program)</label>
                  <input v-model={form.value.course} type="text" class="form-input" placeholder="e.g. BSIT" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact number (optional)</label>
                  <input v-model={form.value.contact_number} type="text" class="form-input" placeholder="e.g. 09123456789" />
                </div>
                
                <div class="modal-actions">
                  <button type="button" class="btn btn-secondary" onClick={() => showAddModal.value = false}>Cancel</button>
                  <button type="submit" class="btn btn-primary" disabled={submitting.value}>
                    {submitting.value ? 'Adding...' : 'Add student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }
})
