<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import FormField from './FormField.vue'
import type {
  FormFieldConfig,
  FormSchema,
  FormValues,
  SelectOption,
} from '~/lib/types/form-schema'
import {
  getConditionalRequiredFieldNames,
  isFieldConditionallyRequired,
  parseSchema,
} from '~/lib/schema-parser'

interface Props {
  schema: FormSchema
  dependentOptionsMap?: Record<string, Record<string, SelectOption[]>>
}

const props = withDefaults(defineProps<Props>(), {
  dependentOptionsMap: () => ({}),
})

const emit = defineEmits<{
  submit: [data: FormValues]
}>()

// Internal type for form values that handles string | File | null
type InternalFormValues = Record<string, string | File | null>
type FormErrors = Record<string, string>

type SubmitPayload = {
  [key: string]: string | { name: string; size: number; type: string } | null
}

const fields = ref<FormFieldConfig[]>([])
const values = ref<InternalFormValues>({})
const errors = ref<FormErrors>({})
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const lastSubmitted = ref<SubmitPayload | null>(null)

type FieldGroup = 'personal' | 'vehicle'

function getFieldGroup(fieldName: string): FieldGroup {
  // Simple grouping strategy for the sample vehicle registration form.
  // - Any `vehicle_*` field is treated as Vehicle information
  // - Ownership / purchase / leasing fields are treated as Vehicle information
  // - Everything else defaults to Personal information
  if (fieldName.startsWith('vehicle_')) return 'vehicle'

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

  return vehicleRelated.has(fieldName) ? 'vehicle' : 'personal'
}

function getGroupedFields(group: FieldGroup): FormFieldConfig[] {
  return fields.value.filter((f) => getFieldGroup(f.name) === group)
}

watch(
  () => props.schema,
  () => {
    initializeForm()
  },
  // Run during setup (including SSR) to avoid initial empty render -> layout shift.
  { deep: true, immediate: true },
)

function initializeForm() {
  const parsedFields = parseSchema(props.schema)
  fields.value = parsedFields

  // Initialize values
  const initialValues: InternalFormValues = {}
  parsedFields.forEach((field) => {
    initialValues[field.name] = ''
  })
  values.value = initialValues
}

// Update field value
function handleFieldChange(name: string, value: string | File | null) {
  values.value = {
    ...values.value,
    [name]: value,
  }

  // Clear dependent fields when parent changes
  fields.value.forEach((field) => {
    if (field.dependsOn === name) {
      values.value[field.name] = ''
    }
  })

  // Clear error when value changes
  if (errors.value[name]) {
    const newErrors = { ...errors.value }
    delete newErrors[name]
    errors.value = newErrors
  }

  // Reset submit success state on any change
  if (submitSuccess.value) {
    submitSuccess.value = false
  }
}

function normalizeValueForSubmit(
  value: string | File | null,
): string | File | null {
  // Keep File as-is; trim strings for better UX
  if (typeof value === 'string') return value.trim()
  return value
}

function isEmptyValue(value: string | File | null): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (value instanceof File) return !value.name
  return false
}

function isRequiredForField(field: FormFieldConfig): boolean {
  const schemaConditionalRequired = getConditionalRequiredFieldNames(
    props.schema,
    values.value,
  )

  return (
    field.isRequired ||
    schemaConditionalRequired.has(field.name) ||
    isFieldConditionallyRequired(field, values.value)
  )
}

function fieldClasses(hasError: boolean) {
  return hasError
    ? 'rounded-lg border border-destructive/50 bg-destructive/5 p-4'
    : ''
}

// Validate a single field
function validateField(
  field: FormFieldConfig,
  value: string | File | null,
): string | undefined {
  const { validation, errorMessages } = field

  // Check if field is required (base + JSON Schema + x-required_if)
  const isRequired = isRequiredForField(field)

  // Required validation
  if (isRequired) {
    if (value === null || value === undefined || value === '') {
      return errorMessages.required || `${field.label} is required`
    }
    if (value instanceof File && !value.name) {
      return errorMessages.required || `${field.label} is required`
    }
  }

  // Skip other validations if value is empty and not required
  if (isEmptyValue(value)) return undefined

  const stringValue = typeof value === 'string' ? value : ''

  // Pattern validation
  if (validation.pattern && stringValue) {
    if (!validation.pattern.test(stringValue)) {
      return errorMessages.pattern || `${field.label} format is invalid`
    }
  }

  // MinLength validation
  if (validation.minLength && stringValue.length < validation.minLength) {
    return (
      errorMessages.minLength ||
      `${field.label} must be at least ${validation.minLength} characters`
    )
  }

  // MaxLength validation
  if (validation.maxLength && stringValue.length > validation.maxLength) {
    return (
      errorMessages.type ||
      `${field.label} must be no more than ${validation.maxLength} characters`
    )
  }

  // Date validation (minAge)
  if (validation.minAge && stringValue) {
    const birthDate = new Date(stringValue)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    if (age < validation.minAge) {
      return (
        errorMessages.minAge ||
        `You must be at least ${validation.minAge} years old`
      )
    }
  }

  // File validation
  if (value instanceof File) {
    // File type validation
    if (validation.fileType) {
      const fileTypeValue = validation.fileType
      const acceptedTypes = Array.isArray(fileTypeValue)
        ? fileTypeValue.map((t) => t.toLowerCase())
        : fileTypeValue.split(',').map((t) => t.trim().toLowerCase())
      const fileExtension = value.name.split('.').pop()?.toLowerCase()
      const fileMimeType = value.type.toLowerCase()

      const isValidType = acceptedTypes.some((type: string) => {
        if (type.startsWith('.')) {
          return `.${fileExtension}` === type
        }
        if (type.includes('*') || type === 'image' || type === 'pdf') {
          if (type === 'image') {
            return fileMimeType.startsWith('image/')
          }
          if (type === 'pdf') {
            return fileMimeType === 'application/pdf'
          }
          const [category] = type.split('/')
          return fileMimeType.startsWith(`${category}/`)
        }
        return fileMimeType === type
      })

      if (!isValidType) {
        return (
          errorMessages.fileType ||
          `Invalid file type. Accepted: ${Array.isArray(fileTypeValue) ? fileTypeValue.join(', ') : fileTypeValue}`
        )
      }
    }

    // File size validation
    if (validation.maxSize && value.size > validation.maxSize) {
      const maxSizeMB = (validation.maxSize / (1024 * 1024)).toFixed(1)
      return (
        errorMessages.fileSize || `File size must be less than ${maxSizeMB}MB`
      )
    }
  }

  return undefined
}

// Validate all fields
function validateForm(): boolean {
  const newErrors: FormErrors = {}
  let isValid = true

  fields.value.forEach((field) => {
    const error = validateField(field, values.value[field.name] ?? null)
    if (error) {
      newErrors[field.name] = error
      isValid = false
    }
  })

  errors.value = newErrors
  return isValid
}

// Handle form submission
async function handleSubmit() {
  if (!validateForm()) {
    // Scroll to first error
    const firstErrorField = Object.keys(errors.value)[0]
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  isSubmitting.value = true
  submitSuccess.value = false

  try {
    // Normalize values before submit (trim strings)
    const normalized: Record<string, string | File | null> = {}
    for (const [key, val] of Object.entries(values.value)) {
      normalized[key] = normalizeValueForSubmit(val)
    }

    // Build a JSON-safe payload for on-page display (Files become metadata)
    const payload: SubmitPayload = {}
    for (const [key, val] of Object.entries(normalized)) {
      if (val instanceof File) {
        payload[key] = { name: val.name, size: val.size, type: val.type }
      } else {
        payload[key] = val
      }
    }

    // Log the data to console
    console.log('Form submitted with data:', normalized)
    console.log('Form submitted (json-safe):', payload)

    // Emit the submit event
    emit('submit', normalized as FormValues)

    lastSubmitted.value = payload

    submitSuccess.value = true
  } catch (error) {
    console.error('Form submission error:', error)
    errors.value = {
      _form: 'An error occurred while submitting the form. Please try again.',
    }
  } finally {
    isSubmitting.value = false
  }
}

// Get options for dependent dropdowns - checks both external map and embedded options
function getDependentOptionsForField(field: FormFieldConfig): SelectOption[] {
  if (!field.dependsOn) return []

  const parentRaw = values.value[field.dependsOn]
  if (typeof parentRaw !== 'string') return []
  const parentValue = parentRaw.trim()
  if (!parentValue) return []

  // First check if options are embedded in the field config
  if (field.dependentOptions && field.dependentOptions[parentValue]) {
    return field.dependentOptions[parentValue]
  }

  // Fall back to external options map
  const fieldOptionsMap = props.dependentOptionsMap[field.name]
  if (!fieldOptionsMap) return []

  return fieldOptionsMap[parentValue] || []
}

// Determine if a field should be shown
function shouldShowField(_field: FormFieldConfig): boolean {
  // For now, show all fields
  // This could be extended to support conditional visibility
  return true
}
</script>

<template>
  <div class="rounded-lg bg-card text-card-foreground ">
    <div>
      <form @submit.prevent="handleSubmit" novalidate>
        <div class="flex flex-col gap-6">
          <fieldset class="rounded-lg border bg-card p-8">
            <legend
              class="px-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Personal Information
            </legend>

            <div class="flex flex-col gap-4 pt-2">
              <template
                v-for="field in getGroupedFields('personal')"
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
                      field.dependsOn
                        ? getDependentOptionsForField(field)
                        : undefined
                    "
                    @update:model-value="
                      (value) => handleFieldChange(field.name, value)
                    "
                  />
                </div>
              </template>
            </div>
          </fieldset>

          <fieldset class="rounded-lg border bg-card p-8">
            <legend
              class="px-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Vehicle Information
            </legend>

            <div class="flex flex-col gap-4 pt-2">
              <template
                v-for="field in getGroupedFields('vehicle')"
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
                      field.dependsOn
                        ? getDependentOptionsForField(field)
                        : undefined
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

          <div v-if="lastSubmitted" class="rounded-lg border bg-muted/30 p-4">
            <p class="text-sm font-medium mb-2">Submitted data</p>
            <pre class="text-xs overflow-auto whitespace-pre-wrap">{{
              JSON.stringify(lastSubmitted, null, 2)
            }}</pre>
          </div>

          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 py-2 w-full"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
