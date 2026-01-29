<script setup lang="ts">
import ThemeToggle from '~/components/ThemeToggle.vue'
</script>

<template>
  <div class="min-h-dvh text-foreground">
    <header
      class="border-b bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/40"
    >
      <div
        class="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4 lg:p-6"
      >
        <div class="min-w-0">
          <p class="text-sm text-muted-foreground">Dynamic Form Builder</p>
          <h1 class="truncate text-lg font-semibold">
            Frontend Engineering Assessment
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl p-4 lg:p-6">
      <slot />
    </main>
  </div>
</template>
