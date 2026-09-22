<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'

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
</script>

<template>
  <div class="login-wrapper">
    <!-- Left Visual Side -->
    <div class="login-visual-side">
      <div style="max-width: 600px; margin: 0 auto; width: 100%;">
        <p style="color: #6C757D; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 16px;">
          ETEEAP Batch 2026-2027
        </p>
        <h1 style="font-size: 3rem; font-weight: 700; color: #212529; line-height: 1.1; margin-bottom: 16px;">
          Student collections<br/>made clear.
        </h1>
        <p style="color: #6C757D; font-size: 1.125rem; margin-bottom: 32px;">
          An initiative made possible by the ETEEAP Officers.
        </p>
        
        <div style="width: 100%; height: 400px; border-radius: 16px; overflow: hidden; background-image: url(/login-bg.jpg); background-size: cover; background-position: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1);"></div>
      </div>
    </div>

    <!-- Right Form Side -->
    <div class="login-form-side">
      <div class="login-card">
        <header style="margin-bottom: 32px;">
          <p style="color: #ADB5BD; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
            ETEEAP OFFICERS
          </p>
          <h2 style="font-size: 1.75rem; font-weight: 600; color: #212529; margin-bottom: 8px;">
            Student collections
          </h2>
          <p style="color: #6C757D; font-size: 0.95rem; line-height: 1.5;">
            Sign in to manage the ETEEAP Batch 2026-2027 payment register.
          </p>
        </header>
        
        <form @submit="handleLogin" style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #495057; margin-bottom: 8px;">
              Email address
            </label>
            <input 
              type="email" 
              v-model="email" 
              required 
              style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #DEE2E6; font-size: 1rem; color: #212529; outline: none; transition: border-color 0.2s; min-height: 44px;"
              @focus="($event.target as HTMLInputElement).style.borderColor = '#343A40'"
              @blur="($event.target as HTMLInputElement).style.borderColor = '#DEE2E6'"
            />
          </div>
          
          <div>
            <label style="display: block; font-size: 0.875rem; font-weight: 600; color: #495057; margin-bottom: 8px;">
              Password
            </label>
            <input 
              type="password" 
              v-model="password" 
              required 
              style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #DEE2E6; font-size: 1rem; color: #212529; outline: none; transition: border-color 0.2s; min-height: 44px;"
              @focus="($event.target as HTMLInputElement).style.borderColor = '#343A40'"
              @blur="($event.target as HTMLInputElement).style.borderColor = '#DEE2E6'"
            />
          </div>
          
          <p v-if="errorMsg" style="color: #DC3545; font-size: 0.875rem; text-align: center;">
            {{ errorMsg }}
          </p>
          
          <button 
            type="submit" 
            :disabled="loading"
            :style="{
              width: '100%', padding: '14px', background: '#343A40', color: 'white', border: 'none',
              borderRadius: '8px', fontSize: '1rem', fontWeight: 600, minHeight: '48px',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '8px'
            }"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        
        <footer style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #F8F9FA; font-size: 0.75rem; color: #ADB5BD;">
          Authorized school staff only
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: #F8F9FA;
}

.login-visual-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 64px;
  justify-content: center;
}

.login-form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 48px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}

@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
  }

  .login-visual-side {
    display: none;
  }

  .login-form-side {
    padding: 24px 16px;
  }

  .login-card {
    padding: 28px 20px;
    border-radius: 10px;
  }
}
</style>
