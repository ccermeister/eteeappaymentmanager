import { defineComponent, onMounted, computed, ref } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import { useLedgerStore } from '../store/ledgerStore'
import AccountSettingsModal from '../components/AccountSettingsModal'

export default defineComponent({
  name: 'AppLayout',
  setup() {
    const authStore = useAuthStore()
    const ledgerStore = useLedgerStore()
    const router = useRouter()
    const route = useRoute()
    
    const showAccountSettings = ref(false)

    onMounted(() => {
      ledgerStore.fetchLedgerData()
    })

    const handleSignOut = async () => {
      await authStore.signOut()
      router.push('/login')
    }

    const navItems = computed(() => {
      const items = [
        { key: 'Dashboard', path: '/', label: 'Dashboard', icon: '⊞' },
        { key: 'Students', path: '/students', label: 'Students', icon: '⚙' },
        { key: 'Payables', path: '/payables', label: 'Payables', icon: '⊟' },
      ]
      
      if (authStore.can('requestEdit') || authStore.can('approve')) {
        items.push({ key: 'EditRequests', path: '/requests', label: 'Edit requests', icon: '↻' })
      }
      
      if (authStore.can('viewAudit')) {
        items.push({ key: 'AuditLog', path: '/audit', label: 'Audit log', icon: '≡' })
      }
      
      return items
    })

    // Helper to get nice route titles
    const routeTitle = computed(() => {
      if (route.name === 'StudentDetail') return 'Student profile'
      if (route.name === 'EditRequests') return 'Edit requests'
      if (route.name === 'AuditLog') return 'Audit log'
      return String(route.name || 'Dashboard')
    })

    return () => (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: '#F8F9FA' }}>
        {/* Global Topbar */}
        <header style={{ 
          height: '60px', 
          background: 'white', 
          borderBottom: '1px solid #E9ECEF', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2B3B4E' }}>ETEEAP</span>
            <span style={{ color: '#6C757D', fontSize: '0.95rem' }}>Student collections</span>
          </div>
          <div style={{ color: '#6C757D', fontSize: '0.85rem' }}>
            Internal school finance record
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <aside style={{ 
            width: '260px', 
            background: 'white', 
            borderRight: '1px solid #E9ECEF',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '24px', paddingBottom: '16px' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2B3B4E', marginBottom: '2px' }}>ETEEAP</p>
              <p style={{ color: '#6C757D', fontSize: '0.85rem' }}>Ledger</p>
            </div>
            
            <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.value.map(item => {
                const isActive = route.name === item.key || (item.key === 'Students' && route.name === 'StudentDetail')
                return (
                  <RouterLink 
                    key={item.key}
                    to={item.path} 
                    style={{ 
                      padding: '10px 16px', 
                      borderRadius: '6px', 
                      color: isActive ? '#2B3B4E' : '#6C757D', 
                      background: isActive ? '#F1F3F5' : 'transparent',
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.9rem',
                      transition: 'background 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                    {item.label}
                  </RouterLink>
                )
              })}
            </nav>
            
            <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => showAccountSettings.value = true}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: 'white', 
                  border: '1px solid #DEE2E6', 
                  borderRadius: '6px',
                  color: '#495057',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Account settings
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: '#E9ECEF',
                  backgroundImage: authStore.user?.user_metadata?.avatar ? `url(${authStore.user.user_metadata.avatar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  {!authStore.user?.user_metadata?.avatar && authStore.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2B3B4E', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {authStore.user?.user_metadata?.display || authStore.user?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#868E96', textTransform: 'capitalize' }}>
                    {authStore.role}
                  </div>
                </div>
              </div>
              
              <button onClick={handleSignOut} style={{ 
                width: '100%', 
                padding: '8px', 
                background: 'white', 
                border: '1px solid #DEE2E6', 
                borderRadius: '6px',
                color: '#495057',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                Sign out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8F9FA' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <RouterView />
            </div>
          </main>
        </div>
        
        <AccountSettingsModal 
          isOpen={showAccountSettings.value} 
          onClose={() => showAccountSettings.value = false} 
        />
      </div>
    )
  }
})
