<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../store/authStore'

const props = defineProps<{
  isOpen: boolean
  onClose: () => void
}>()

const authStore = useAuthStore()

const displayName = ref('')
const avatarPreview = ref('')
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const errorMsg = ref('')

const syncFromUser = () => {
  if (authStore.user) {
    displayName.value = authStore.user.user_metadata?.display || authStore.user.email?.split('@')[0] || ''
    avatarPreview.value = authStore.user.user_metadata?.avatar || ''
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    syncFromUser()
    errorMsg.value = ''
    selectedFile.value = null
  }
}, { immediate: true })

watch(() => authStore.user, () => {
  syncFromUser()
})

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (event) => {
      avatarPreview.value = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleSave = async (e: Event) => {
  e.preventDefault()
  loading.value = true
  errorMsg.value = ''
  
  try {
    await authStore.updateProfile(displayName.value.trim(), avatarPreview.value)
    loading.value = false
    props.onClose()
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to update account settings.'
    loading.value = false
  }
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
            width: '56px', height: '56px', borderRadius: '50%', background: '#E9ECEF', flexShrink: 0,
            backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.4rem', color: '#495057'
          }">
            {{ !avatarPreview ? ((displayName || authStore.user?.email || 'U').charAt(0).toUpperCase()) : '' }}
          </div>
          <div>
            <div style="font-size: 1rem; font-weight: 600; color: #2B3B4E;">{{ displayName || authStore.user?.email }}</div>
            <div style="font-size: 0.85rem; color: #868E96;">{{ authStore.user?.email }}</div>
            <div style="font-size: 0.75rem; color: #6C757D; text-transform: capitalize; margin-top: 2px;">Role: <strong>{{ authStore.role }}</strong></div>
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
              required
              placeholder="Enter display name"
              style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #DEE2E6; font-size: 0.95rem; outline: none;"
            />
          </div>
          
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 500; color: #495057; margin-bottom: 6px;">
              Display picture
            </label>
            <input 
              type="file"
              accept="image/*"
              @change="handleFileChange"
              style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #DEE2E6; font-size: 0.9rem; outline: none; background: white;"
            />
          </div>
          
          <p v-if="errorMsg" style="color: #DC3545; font-size: 0.85rem; margin: 0;">
            {{ errorMsg }}
          </p>

          <p style="font-size: 0.75rem; color: #868E96; margin: 4px 0 16px;">
            Changes to your display name or photo will update your profile in the application header and sidebar.
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
              :style="{
                background: '#2B3B4E', border: 'none', color: 'white', padding: '10px 16px',
                borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }"
            >
              {{ loading ? 'Saving...' : 'Save settings' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
