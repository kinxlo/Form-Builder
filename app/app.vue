<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en',
  },
  titleTemplate: (titleChunk) =>
    titleChunk
      ? `${titleChunk} · Dynamic Form Builder`
      : 'Dynamic Form Builder',
  meta: [
    {
      name: 'description',
      content: 'Schema-driven dynamic forms with Nuxt SSR.',
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
