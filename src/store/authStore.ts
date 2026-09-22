import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const loading = ref(true)

  const role = computed(() => {
    if (!user.value) return null
    // If the email contains 'admin', they are an admin. Otherwise, they are a treasurer.
    if (user.value.email?.toLowerCase().includes('admin')) {
      return 'admin'
    }
    return 'treasurer'
  })

  const can = (action: string) => {
    if (!user.value) return false
    const currentRole = role.value
    
    if (currentRole === 'admin') {
      // Admins can do everything except request edits (since they can delete directly)
      return ['delete', 'approve', 'viewAudit', 'create', 'pay', 'edit'].includes(action)
    }
    
    if (currentRole === 'treasurer') {
      // Treasurers can manage records but must request edits for payments
      return ['create', 'pay', 'edit', 'requestEdit'].includes(action)
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
