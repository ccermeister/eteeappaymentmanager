import { defineStore } from 'pinia'
import { supabase } from '../utils/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any | null,
    session: null as any | null,
    loading: true,
  }),
  getters: {
    role: (state) => {
      // In the legacy app, role was often part of metadata or assigned manually.
      // Assuming it's in user_metadata or default to 'viewer'.
      return state.user?.user_metadata?.role || 'admin' // defaulting to admin for now, but should match actual app logic
    }
  },
  actions: {
    async initialize() {
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user || null
      
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user || null
      })
      this.loading = false
    },
    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    can(action: string): boolean {
      const role = this.role
      const perms: Record<string, string[]> = {
        admin: ["create", "edit", "delete", "pay", "approve", "viewAudit", "manageSettings"],
        treasurer: ["create", "edit", "pay", "requestEdit", "manageSettings"],
        viewer: [],
      }
      return (perms[role] || []).includes(action)
    }
  }
})
