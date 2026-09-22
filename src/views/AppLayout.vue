<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { RouterView, RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import { useLedgerStore } from '../store/ledgerStore'
import AccountSettingsModal from '../components/AccountSettingsModal.vue'

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


</script>

<template>
  <div style="display: flex; flex-direction: column; min-height: 100vh; width: 100%; background: #F8F9FA;">
    <!-- Global Topbar -->
    <header style="height: 60px; background: white; border-bottom: 1px solid #E9ECEF; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 10;">
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <span style="font-weight: 700; font-size: 1.1rem; color: #2B3B4E;">ETEEAP</span>
        <span style="color: #6C757D; font-size: 0.95rem;">Student collections</span>
      </div>
      <div style="color: #6C757D; font-size: 0.85rem;">
        Internal school finance record
      </div>
    </header>

    <div style="display: flex; flex: 1;">
      <!-- Sidebar -->
      <aside style="width: 260px; background: white; border-right: 1px solid #E9ECEF; display: flex; flex-direction: column;">
        <div style="padding: 24px; padding-bottom: 16px;">
          <p style="font-weight: 700; font-size: 1.1rem; color: #2B3B4E; margin-bottom: 2px;">ETEEAP</p>
          <p style="color: #6C757D; font-size: 0.85rem;">Ledger</p>
        </div>
        
        <nav style="flex: 1; padding: 0 16px; display: flex; flex-direction: column; gap: 4px;">
          <RouterLink 
            v-for="item in navItems" 
            :key="item.key"
            :to="item.path"
            :style="{
              padding: '10px 16px', borderRadius: '6px',
              color: (route.name === item.key || (item.key === 'Students' && route.name === 'StudentDetail')) ? '#2B3B4E' : '#6C757D',
              background: (route.name === item.key || (item.key === 'Students' && route.name === 'StudentDetail')) ? '#F1F3F5' : 'transparent',
              display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none',
              fontWeight: (route.name === item.key || (item.key === 'Students' && route.name === 'StudentDetail')) ? 600 : 500,
              fontSize: '0.9rem', transition: 'background 0.2s'
            }"
          >
            <span :style="{ fontSize: '1.1rem', opacity: (route.name === item.key || (item.key === 'Students' && route.name === 'StudentDetail')) ? 1 : 0.7 }">{{ item.icon }}</span>
            {{ item.label }}
          </RouterLink>
        </nav>
        
        <div style="padding: 24px 16px; display: flex; flex-direction: column; gap: 16px;">
          <button 
            @click="showAccountSettings = true"
            style="width: 100%; padding: 8px; background: white; border: 1px solid #DEE2E6; border-radius: 6px; color: #495057; font-size: 0.85rem; font-weight: 600; cursor: pointer;"
          >
            Account settings
          </button>
          
          <div style="display: flex; align-items: center; gap: 12px; padding: 8px 4px;">
            <div :style="{
              width: '36px', height: '36px', borderRadius: '50%', background: '#E9ECEF', flexShrink: 0,
              backgroundImage: authStore.user?.user_metadata?.avatar ? `url(${authStore.user.user_metadata.avatar})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: '#495057'
            }">
              {{ !authStore.user?.user_metadata?.avatar ? ((authStore.user?.user_metadata?.display || authStore.user?.email || 'U').charAt(0).toUpperCase()) : '' }}
            </div>
            <div style="overflow: hidden;">
              <div style="font-size: 0.85rem; font-weight: 600; color: #2B3B4E; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                {{ authStore.user?.user_metadata?.display || authStore.user?.email?.split('@')[0] }}
              </div>
              <div style="font-size: 0.75rem; color: #868E96; text-transform: capitalize;">
                {{ authStore.role }}
              </div>
            </div>
          </div>
          
          <button @click="handleSignOut" style="width: 100%; padding: 8px; background: white; border: 1px solid #DEE2E6; border-radius: 6px; color: #495057; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
            Sign out
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #F8F9FA;">
        <div style="flex: 1; overflow-y: auto;">
          <RouterView />
        </div>
      </main>
    </div>
    
    <AccountSettingsModal 
      :is-open="showAccountSettings" 
      :on-close="() => showAccountSettings = false" 
    />
  </div>
</template>
