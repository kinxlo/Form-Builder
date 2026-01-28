<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'theme-mode'

const mode = ref<ThemeMode>('light')

const isDark = computed(() => mode.value === 'dark')

function applyMode(next: ThemeMode) {
  mode.value = next

  // Tailwind dark variant is configured as `.dark`.
  const root = document.documentElement
  root.classList.toggle('dark', next === 'dark')
  root.classList.toggle('light', next === 'light')

  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore
  }
}

function toggle() {
  applyMode(isDark.value ? 'light' : 'dark')
}

onMounted(() => {
  // Prefer persisted mode; otherwise use system preference.
  let initial: ThemeMode | null = null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') initial = stored
  } catch {
    // ignore
  }

  if (!initial) {
    initial = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  applyMode(initial)
})
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    @click="toggle"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <Moon v-if="isDark" class="h-4 w-4" />
    <Sun v-else class="h-4 w-4" />
    <span class="hidden sm:inline">{{ isDark ? 'Dark' : 'Light' }}</span>
  </button>
</template>
