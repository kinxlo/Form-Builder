import { ref, watch } from 'vue'
import type {
  FormFieldConfig,
  FormSchema,
  FormValues,
  SelectOption,
} from './types'
import { normalizeValueForSubmit, validateField } from './validation'
import { getDependentOptionsForField } from './dependent-options'
import {
  getConditionalRequiredFieldNames,
  isFieldConditionallyRequired,
  parseSchema,
} from './schema'

// Internal type for form values that handles string | File | null.
export type InternalFormValues = Record<string, string | File | null>
export type FormErrors = Record<string, string>

export type SubmitPayload = {
  [key: string]: string | { name: string; size: number; type: string } | null
}

export function useFormBuilder(params: {
  schema: () => FormSchema
  dependentOptionsMap?: () => Record<string, Record<string, SelectOption[]>>
}) {
  const fields = ref<FormFieldConfig[]>([])
  const values = ref<InternalFormValues>({})
  const errors = ref<FormErrors>({})
  const isSubmitting = ref(false)
  const submitSuccess = ref(false)
  const lastSubmitted = ref<SubmitPayload | null>(null)

  const dependentOptionsMap = params.dependentOptionsMap ?? (() => ({}))

  // Avoid `ReferenceError: File is not defined` in SSR/Node environments.
  const FileCtor = (globalThis as unknown as { File?: typeof File }).File
  function isFile(value: unknown): value is File {
    return Boolean(FileCtor) && value instanceof (FileCtor as typeof File)
  }

  function initializeForm() {
    const parsedFields = parseSchema(params.schema())
    fields.value = parsedFields

    // Initialize values
    const initialValues: InternalFormValues = {}
    parsedFields.forEach((field) => {
      initialValues[field.name] = ''
    })
    values.value = initialValues
  }

  watch(
    params.schema,
    () => {
      initializeForm()
    },
    // Run during setup (including SSR) to avoid initial empty render -> layout shift.
    { deep: true, immediate: true },
  )

  function isRequiredForField(field: FormFieldConfig): boolean {
    const schemaConditionalRequired = getConditionalRequiredFieldNames(
      params.schema(),
      values.value,
    )

    return (
      field.isRequired ||
      schemaConditionalRequired.has(field.name) ||
      isFieldConditionallyRequired(field, values.value)
    )
  }

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

  function validateForm(): boolean {
    const newErrors: FormErrors = {}
    let isValid = true

    fields.value.forEach((field) => {
      const error = validateField({
        field,
        value: values.value[field.name] ?? null,
        isRequired: isRequiredForField(field),
      })

      if (error) {
        newErrors[field.name] = error
        isValid = false
      }
    })

    errors.value = newErrors
    return isValid
  }

  async function handleSubmit(
    onSubmit: (values: FormValues) => void | Promise<void>,
  ) {
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
        normalized[key] = normalizeValueForSubmit(val) as string | File | null
      }

      // Build a JSON-safe payload for on-page display (Files become metadata)
      const payload: SubmitPayload = {}
      for (const [key, val] of Object.entries(normalized)) {
        if (isFile(val)) {
          payload[key] = { name: val.name, size: val.size, type: val.type }
        } else {
          payload[key] = val
        }
      }

      // Log the data to console
      console.log('Form submitted with data:', normalized)
      console.log('Form submitted (json-safe):', payload)

      await onSubmit(normalized as FormValues)

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

  function getDependentOptions(field: FormFieldConfig): SelectOption[] {
    return getDependentOptionsForField({
      field,
      values: values.value,
      dependentOptionsMap: dependentOptionsMap(),
    })
  }

  function fieldClasses(hasError: boolean) {
    return hasError
      ? 'rounded-lg border border-destructive/50 bg-destructive/5 p-4'
      : ''
  }

  return {
    fields,
    values,
    errors,
    isSubmitting,
    submitSuccess,
    lastSubmitted,
    initializeForm,
    isRequiredForField,
    handleFieldChange,
    handleSubmit,
    getDependentOptions,
    fieldClasses,
  }
}
