import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'

export default defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const email = ref('')
    const password = ref('')
    const errorMsg = ref('')
    const loading = ref(false)

    const handleLogin = async (e: Event) => {
      e.preventDefault()
      loading.value = true
      errorMsg.value = ''
      try {
        await authStore.signIn(email.value, password.value)
        router.push('/')
      } catch (err: any) {
        errorMsg.value = err.message || 'Username or password not recognized.'
      } finally {
        loading.value = false
      }
    }

    return () => (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#F8F9FA' }}>
        {/* Left Visual Side */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '64px',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <p style={{ color: '#6C757D', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
              ETEEAP Batch 2026-2027
            </p>
            <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#212529', lineHeight: 1.1, marginBottom: '16px' }}>
              Student collections<br/>made clear.
            </h1>
            <p style={{ color: '#6C757D', fontSize: '1.125rem', marginBottom: '32px' }}>
              An initiative made possible by the ETEEAP Officers.
            </p>
            
            <div style={{ 
              width: '100%', 
              height: '400px', 
              borderRadius: '16px', 
              overflow: 'hidden',
              backgroundImage: 'url(/login-bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}></div>
          </div>
        </div>

        {/* Right Form Side */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '64px'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '48px', 
            width: '100%', 
            maxWidth: '480px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
          }}>
            <header style={{ marginBottom: '32px' }}>
              <p style={{ color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                ETEEAP OFFICERS
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#212529', marginBottom: '8px' }}>
                Student collections
              </h2>
              <p style={{ color: '#6C757D', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Sign in to manage the ETEEAP Batch 2026-2027 payment register.
              </p>
            </header>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#495057', marginBottom: '8px' }}>
                  Email address
                </label>
                <input 
                  type="email" 
                  v-model={email.value} 
                  required 
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #DEE2E6',
                    fontSize: '1rem',
                    color: '#212529',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#343A40'}
                  onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#DEE2E6'}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#495057', marginBottom: '8px' }}>
                  Password
                </label>
                <input 
                  type="password" 
                  v-model={password.value} 
                  required 
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #DEE2E6',
                    fontSize: '1rem',
                    color: '#212529',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#343A40'}
                  onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#DEE2E6'}
                />
              </div>
              
              {errorMsg.value && (
                <p style={{ color: '#DC3545', fontSize: '0.875rem', textAlign: 'center' }}>
                  {errorMsg.value}
                </p>
              )}
              
              <button 
                type="submit" 
                disabled={loading.value}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#343A40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading.value ? 'not-allowed' : 'pointer',
                  opacity: loading.value ? 0.7 : 1,
                  marginTop: '8px'
                }}
              >
                {loading.value ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            
            <footer style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F8F9FA', fontSize: '0.75rem', color: '#ADB5BD' }}>
              Authorized school staff only
            </footer>
          </div>
        </div>
      </div>
    )
  }
})
