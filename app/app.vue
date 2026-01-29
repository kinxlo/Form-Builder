<script setup lang="ts">
import { useHead } from '#imports'

// Prevent theme flicker (FOUC) by applying the persisted theme before hydration.
// // ThemeToggle.vue uses the same storage key.
// useHead({
//   script: [
//     {
//       children: `(() => {
//   try {
//     var key = 'theme-mode';
//     var stored = localStorage.getItem(key);
//     var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//     var mode = (stored === 'light' || stored === 'dark') ? stored : (prefersDark ? 'dark' : 'light');
//     var root = document.documentElement;
//     root.classList.toggle('dark', mode === 'dark');
//     root.classList.toggle('light', mode === 'light');
//   } catch (e) {}
// })();`,
//       tagPosition: 'head',
//     },
//   ],
// })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
