<script setup lang="ts">
import FormBuilder from '~/components/form-builder/FormBuilder.vue'
import { sampleSchema } from '~/lib/sample-schema'
</script>

<template>
  <div>
    <FormBuilder :schema="sampleSchema" />
  </div>
</template>
