<script setup lang="ts">
import { computed } from 'vue'
import FormBuilder from '~/components/form-builder/FormBuilder.vue'
import type { FormSchema } from '~/lib/form-builder/types'
import { sampleSchema } from '~/lib/sample-schema'

const fetchedAt = useState<string>('schemaFetchedAt', () =>
  new Date().toISOString(),
)

const {
  data: schemaData,
  pending: schemaPending,
  error: schemaError,
  refresh: refreshSchema,
} = await useFetch<FormSchema>('/sample-schema.json', {
  server: true,
})

const schema = computed<FormSchema>(() => schemaData.value ?? sampleSchema)

const sections = [
  {
    key: 'personal',
    title: 'Personal Information',
    filter: (field: { name: string }) => {
      const vehicleRelated = new Set([
        'purchase_type',
        'proof_of_ownership_url',
        'lease_agreement_url',
        'lessor_company_name',
        'registration_number',
        'engine_number',
        'chassis_number',
        'year_of_manufacture',
      ])
      return (
        !field.name.startsWith('vehicle_') && !vehicleRelated.has(field.name)
      )
    },
  },
  {
    key: 'vehicle',
    title: 'Vehicle Information',
    filter: (field: { name: string }) => {
      if (field.name.startsWith('vehicle_')) return true
      const vehicleRelated = new Set([
        'purchase_type',
        'proof_of_ownership_url',
        'lease_agreement_url',
        'lessor_company_name',
        'registration_number',
        'engine_number',
        'chassis_number',
        'year_of_manufacture',
      ])
      return vehicleRelated.has(field.name)
    },
  },
]
</script>

<template>
  <div>
    <!-- <div class="mb-4 rounded-lg border bg-muted/30 p-3 text-xs">
      <p class="font-medium">SSR demo (server fetch + client hydration)</p>
      <p v-if="schemaPending">
        Loading schema from <code>/sample-schema.json</code>…
      </p>
      <p v-else-if="schemaError" class="text-destructive">
        Failed to load schema.
        <button class="underline" type="button" @click="refreshSchema()">
          Retry
        </button>
      </p>
      <p v-else>
        Schema fetchedAt (SSR payload): <code>{{ fetchedAt }}</code>
      </p>

      <p class="mt-2 text-[11px] text-muted-foreground">
        This is a plain request to a static file
        (<code>/sample-schema.json</code>), but during SSR Nuxt executes it on
        the server and hydrates the result on the client.
      </p>
    </div> -->

    <FormBuilder :schema="schema" :sections="sections" />
  </div>
</template>
