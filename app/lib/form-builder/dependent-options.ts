import type { FormFieldConfig, SelectOption } from './types'

export function getDependentOptionsForField(params: {
  field: FormFieldConfig
  values: Record<string, unknown>
  dependentOptionsMap?: Record<string, Record<string, SelectOption[]>>
}): SelectOption[] {
  const { field, values, dependentOptionsMap = {} } = params

  if (!field.dependsOn) return []

  const parentRaw = values[field.dependsOn]
  if (typeof parentRaw !== 'string') return []
  const parentValue = parentRaw.trim()
  if (!parentValue) return []

  // First check if options are embedded in the field config
  if (field.dependentOptions && field.dependentOptions[parentValue]) {
    return field.dependentOptions[parentValue]
  }

  // Fall back to external options map
  const fieldOptionsMap = dependentOptionsMap[field.name]
  if (!fieldOptionsMap) return []

  return fieldOptionsMap[parentValue] || []
}
