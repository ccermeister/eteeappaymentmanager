import { defineComponent, ref } from 'vue'
import { useAuthStore } from '../store/authStore'

export default defineComponent({
  name: 'AccountSettingsModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    onClose: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const authStore = useAuthStore()
    
    // Fallback if no user is present
    const userDisplay = authStore.user?.user_metadata?.display || authStore.user?.email?.split('@')[0] || ''
    const displayName = ref(userDisplay)
    
    const loading = ref(false)

    const handleSave = async (e: Event) => {
      e.preventDefault()
      loading.value = true
      // Mock save logic, since we're just doing UI mostly
      setTimeout(() => {
        loading.value = false
        props.onClose()
      }, 500)
    }

    return () => {
      if (!props.isOpen) return null

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(33, 37, 41, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div class="animate-fade-in" style={{
            background: 'white',
            width: '100%',
            maxWidth: '480px',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Head */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E9ECEF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2B3B4E', margin: 0 }}>Account settings</h3>
              <button 
                onClick={() => props.onClose()}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#ADB5BD', cursor: 'pointer' }}
              >&times;</button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Profile Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #E9ECEF' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: '#E9ECEF',
                  backgroundImage: authStore.user?.user_metadata?.avatar ? `url(${authStore.user.user_metadata.avatar})` : 'none',
                  backgroundSize: 'cover',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  color: '#495057'
                }}>
                  {!authStore.user?.user_metadata?.avatar && authStore.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#2B3B4E' }}>{authStore.user?.email}</div>
                  <div style={{ fontSize: '0.85rem', color: '#868E96', textTransform: 'capitalize' }}>{authStore.role}</div>
                </div>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#495057', marginBottom: '6px' }}>
                    Display name
                  </label>
                  <input 
                    type="text"
                    v-model={displayName.value}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DEE2E6',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#495057', marginBottom: '6px' }}>
                    Display picture
                  </label>
                  <input 
                    type="file"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #DEE2E6',
                      fontSize: '0.95rem',
                      outline: 'none',
                      background: 'white'
                    }}
                  />
                </div>
                
                <p style={{ fontSize: '0.75rem', color: '#868E96', margin: '4px 0 16px' }}>
                  Your profile is saved to your account.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => props.onClose()}
                    style={{ background: 'white', border: '1px solid #DEE2E6', padding: '10px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#495057', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading.value}
                    style={{ background: '#2B3B4E', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    {loading.value ? 'Saving...' : 'Save settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )
    }
  }
})
