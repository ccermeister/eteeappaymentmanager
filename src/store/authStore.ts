import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const loading = ref(true)

  const role = computed(() => {
    if (!user.value) return null
    const email = user.value.email?.toLowerCase() || ''
    const uid = user.value.id || ''
    if (uid === 'eb5e85ab-5fb8-482a-b165-7c57bf8f3444' || email === 'viewer@eteeap.com' || email.includes('viewer') || user.value.user_metadata?.role === 'viewer') {
      return 'viewer'
    }
    if (email.includes('admin') || user.value.user_metadata?.role === 'admin') {
      return 'admin'
    }
    return 'treasurer'
  })

  const can = (action: string) => {
    if (!user.value) return false
    const currentRole = role.value
    
    if (currentRole === 'admin') {
      // Admins can do everything except request edits (since they can delete directly)
      return ['delete', 'approve', 'viewAudit', 'create', 'pay', 'edit', 'view'].includes(action)
    }
    
    if (currentRole === 'viewer') {
      // Viewers can ONLY view — cannot create, edit, pay, delete, or request edits
      return ['view'].includes(action)
    }
    
    if (currentRole === 'treasurer') {
      // Treasurers can manage records but must request edits for payments
      return ['create', 'pay', 'edit', 'requestEdit', 'view'].includes(action)
    }
    
    return false
  }

  const initialize = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null
    
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
    
    loading.value = false
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    user.value = data.session?.user || null
  }

  const updateProfile = async (displayName: string, avatarUrl?: string) => {
    const userMetadata: Record<string, any> = {
      ...user.value?.user_metadata,
      display: displayName
    }
    if (avatarUrl !== undefined && avatarUrl !== '') {
      userMetadata.avatar = avatarUrl
    }

    const { data, error } = await supabase.auth.updateUser({
      data: userMetadata
    })
    if (error) throw error
    if (data.user) {
      user.value = data.user
    }
  }

  return { user, loading, role, can, initialize, signOut, signIn, updateProfile }
})
