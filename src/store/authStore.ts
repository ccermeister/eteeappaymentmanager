import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const loading = ref(true)

  const role = computed(() => {
    // Basic role logic, assume admin for now if they have an account
    return 'admin'
  })

  const can = (_action: string) => {
    // For now, logged in users can do everything
    return !!user.value
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

  return { user, loading, role, can, initialize, signOut, signIn }
})
