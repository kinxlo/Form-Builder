<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import FormField from './FormField.vue'
import type {
  FormFieldConfig,
  FormSchema,
  FormValues,
  SelectOption,
} from '~/lib/form-builder/types'
import { useFormBuilder } from '~/lib/form-builder/useFormBuilder'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

interface Props {
  schema: FormSchema
  dependentOptionsMap?: Record<string, Record<string, SelectOption[]>>
  /**
   * Optional UI grouping. Keep the core form-builder generic by defining
   * presentation-specific sections at the call site.
   */
  sections?: Array<{
    key: string
    title: string
    filter: (field: FormFieldConfig) => boolean
  }>
}

type Section = NonNullable<Props['sections']>[number]

const props = withDefaults(defineProps<Props>(), {
  dependentOptionsMap: () => ({}),
})

const emit = defineEmits<{
  submit: [data: FormValues]
}>()
const {
  fields,
  values,
  errors,
  isSubmitting,
  submitSuccess,
  lastSubmitted,
  isRequiredForField,
  handleFieldChange,
  handleSubmit,
  getDependentOptions,
  fieldClasses,
} = useFormBuilder({
  schema: () => props.schema,
  dependentOptionsMap: () => props.dependentOptionsMap,
})

// Determine if a field should be shown
function shouldShowField(_field: FormFieldConfig): boolean {
  // For now, show all fields
  // This could be extended to support conditional visibility
  return true
}

function getSectionFields(section: Section | undefined) {
  if (!section) return fields.value
  return fields.value.filter(section.filter)
}

const sectionsToRender = computed(() => {
  if (props.sections && props.sections.length > 0) return props.sections
  return [
    {
      key: 'default',
      title: 'Form',
      filter: () => true,
    },
  ]
})
</script>

<template>
  <div>
    <div>
      <form
        @submit.prevent="handleSubmit((data) => emit('submit', data))"
        novalidate
      >
        <div class="flex flex-col gap-6">
          <fieldset
            v-for="section in sectionsToRender"
            :key="section.key"
            class="rounded-lg border bg-card p-8"
          >
            <legend
              class="px-2 text-sm font-semibold text-primary dark:text-slate-100"
            >
              {{ section.title }}
            </legend>

            <div class="flex flex-col gap-6 pt-2">
              <template
                v-for="field in getSectionFields(section)"
                :key="field.name"
              >
                <div
                  v-if="shouldShowField(field)"
                  :class="fieldClasses(!!errors[field.name])"
                >
                  <FormField
                    :config="field"
                    :model-value="values[field.name] ?? null"
                    :error="errors[field.name]"
                    :is-required="isRequiredForField(field)"
                    :dependent-options="
                      field.dependsOn ? getDependentOptions(field) : undefined
                    "
                    @update:model-value="
                      (value) => handleFieldChange(field.name, value)
                    "
                  />
                </div>
              </template>
            </div>
          </fieldset>

          <p v-if="errors._form" class="text-sm text-destructive text-center">
            {{ errors._form }}
          </p>

          <div
            v-if="submitSuccess"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <p class="text-sm text-green-700 dark:text-green-300 text-center">
              Form submitted successfully! Check the console for the submitted
              data.
            </p>
          </div>

          <Button
            variant="default"
            type="submit"
            class="w-full rounded-full h-12 text-base font-medium"
            :disabled="isSubmitting"
            size="lg"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit</span>
          </Button>

          <Card v-if="lastSubmitted" class="shadow-none">
            <CardHeader class="border-b">
              <CardTitle class="text-base">Submitted data</CardTitle>
              <CardDescription>
                This is the latest payload emitted by the form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre class="text-xs overflow-auto whitespace-pre-wrap">{{
                JSON.stringify(lastSubmitted, null, 2)
              }}</pre>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  </div>
</template>
