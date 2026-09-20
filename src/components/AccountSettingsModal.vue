<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../store/authStore'

const props = defineProps<{
  isOpen: boolean
  onClose: () => void
}>()

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
</script>

<template>
  <div v-if="isOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(33, 37, 41, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;">
    <div class="animate-fade-in" style="background: white; width: 100%; max-width: 480px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column;">
      <!-- Modal Head -->
      <div style="padding: 24px; border-bottom: 1px solid #E9ECEF; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.25rem; font-weight: 600; color: #2B3B4E; margin: 0;">Account settings</h3>
        <button @click="onClose()" style="background: none; border: none; font-size: 1.25rem; color: #ADB5BD; cursor: pointer;">&times;</button>
      </div>

      <div style="padding: 24px;">
        <!-- Profile Preview -->
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #E9ECEF;">
          <div :style="{
            width: '48px', height: '48px', borderRadius: '50%', background: '#E9ECEF',
            backgroundImage: authStore.user?.user_metadata?.avatar ? `url(${authStore.user.user_metadata.avatar})` : 'none',
            backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.25rem', color: '#495057'
          }">
            {{ !authStore.user?.user_metadata?.avatar ? authStore.user?.email?.charAt(0).toUpperCase() : '' }}
          </div>
          <div>
            <div style="font-size: 1rem; font-weight: 600; color: #2B3B4E;">{{ authStore.user?.email }}</div>
            <div style="font-size: 0.85rem; color: #868E96; text-transform: capitalize;">{{ authStore.role }}</div>
          </div>
        </div>

        <form @submit="handleSave" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #495057; margin-bottom: 6px;">
              Display name
            </label>
            <input 
              type="text"
              v-model="displayName"
              style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #DEE2E6; font-size: 0.95rem; outline: none;"
            />
          </div>
          
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #495057; margin-bottom: 6px;">
              Display picture
            </label>
            <input 
              type="file"
              style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #DEE2E6; font-size: 0.95rem; outline: none; background: white;"
            />
          </div>
          
          <p style="font-size: 0.75rem; color: #868E96; margin: 4px 0 16px;">
            Your profile is saved to your account.
          </p>

          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button 
              type="button" 
              @click="onClose()"
              style="background: white; border: 1px solid #DEE2E6; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; color: #495057; cursor: pointer;"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              :disabled="loading"
              style="background: #2B3B4E; border: none; color: white; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; cursor: pointer;"
            >
              {{ loading ? 'Saving...' : 'Save settings' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
