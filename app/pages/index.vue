<script setup lang="ts">
import { computed, ref } from 'vue'
import FormBuilder from '~/components/form-builder/FormBuilder.vue'
import type { FormSchema } from '~/lib/form-builder/types'
import { sampleSchema } from '~/lib/sample-schema'
import { parseFormSchemaInput } from '~/lib/parse-form-schema-input'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'

const schemaInput = ref<string>(JSON.stringify(sampleSchema, null, 2))
const parsedSchema = ref<FormSchema | null>(null)
const parseError = ref<string | null>(null)
const parsedMode = ref<'json' | 'object-literal' | null>(null)

function handleParseClick() {
  parseError.value = null
  try {
    const { schema, mode } = parseFormSchemaInput(schemaInput.value)
    parsedSchema.value = schema
    parsedMode.value = mode
  } catch (err) {
    parsedSchema.value = null
    parsedMode.value = null
    parseError.value = err instanceof Error ? err.message : String(err)
  }
}

function resetToSample() {
  schemaInput.value = JSON.stringify(sampleSchema, null, 2)
  parsedSchema.value = null
  parsedMode.value = null
  parseError.value = null
}

// IMPORTANT: Do not render the dynamic form until the user explicitly clicks Parse.
const schema = computed<FormSchema | null>(() => parsedSchema.value)

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
  <section class="grid lg:grid-cols-2 gap-4">
    <Card class="mb-6 shadow-none h-fit lg:sticky top-45">
      <CardHeader class="border-b">
        <CardTitle class="text-base">Schema input</CardTitle>
        <CardDescription> JSON schema parser </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4 pt-6">
        <div class="space-y-2">
          <label class="text-sm font-bold">Schema Area</label>
          <textarea
            v-model="schemaInput"
            class="min-h-65 w-full rounded-md border bg-background p-3 font-mono text-xs leading-relaxed"
            spellcheck="false"
          />
          <p class="text-xs text-muted-foreground">
            PPaste your JSON schema or TS/JS object here.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button type="button" @click="handleParseClick">Parse</Button>
          <Button type="button" variant="secondary" @click="resetToSample">
            Reset to sample
          </Button>
        </div>

        <p v-if="parseError" class="text-sm text-destructive">
          {{ parseError }}
        </p>
        <p v-else-if="parsedMode" class="text-xs text-muted-foreground">
          Parsed successfully (mode: <code>{{ parsedMode }}</code
          >).
        </p>
      </CardContent>
    </Card>
    <FormBuilder v-if="schema" :schema="schema" :sections="sections" />
  </section>
</template>
