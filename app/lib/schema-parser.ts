import type {
  FormSchema,
  FieldSchema,
  FormFieldConfig,
  SelectOption,
  ConditionalRequirement,
  SourceData,
  XSource,
} from './types/form-schema'

type UnknownFormValue = string | boolean | File | null | undefined

// Avoid `ReferenceError: File is not defined` during SSR.
const FileCtor = (globalThis as unknown as { File?: typeof File }).File

/**
 * Helper to check if data is an array of SelectOption
 */
function isSelectOptionArray(data: unknown): data is SelectOption[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    'label' in data[0] &&
    'value' in data[0]
  )
}

/**
 * Helper to check if data is SourceData object
 */
function isSourceData(data: unknown): data is SourceData {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

/**
 * Parse a JSON schema into form field configurations
 */
export function parseSchema(schema: FormSchema): FormFieldConfig[] {
  const fields: Array<{ idx: number; field: FormFieldConfig }> = []
  const { properties, required = [] } = schema

  // Extract conditional requirements from if-then-else and allOf
  const conditionalRequirements = extractConditionalRequirements(schema)

  let idx = 0
  for (const [name, fieldSchema] of Object.entries(properties)) {
    const config = parseFieldSchema(
      name,
      fieldSchema,
      required.includes(name),
      conditionalRequirements,
    )

    fields.push({ idx, field: config })
    idx++
  }

  // Sort by x-order (stable)
  return fields
    .sort((a, b) => {
      const byOrder = a.field.order - b.field.order
      if (byOrder !== 0) return byOrder
      return a.idx - b.idx
    })
    .map((x) => x.field)
}

function isFilled(value: UnknownFormValue): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (FileCtor && value instanceof (FileCtor as typeof File))
    return Boolean(value.name)
  // boolean true/false counts as filled
  return true
}

function matchesConstOrEnum(
  value: UnknownFormValue,
  condition: { const?: string; enum?: string[] },
): boolean {
  if (condition.const !== undefined) {
    return String(value) === String(condition.const)
  }
  if (Array.isArray(condition.enum)) {
    return condition.enum.some((v) => String(v) === String(value))
  }
  // If no explicit matcher, treat as pass-through
  return true
}

function evaluateIfCondition(
  ifSchema: ConditionalRequirement['if'],
  formValues: Record<string, unknown>,
): 'match' | 'no-match' | 'unknown' {
  const requiredFields = ifSchema.required ?? []

  // If the schema says a field must be present for the conditional to apply,
  // but the user hasn't filled it yet, treat the conditional as "unknown".
  // This prevents `else.required` from triggering before the user has interacted.
  for (const fieldName of requiredFields) {
    if (!isFilled(formValues[fieldName] as UnknownFormValue)) return 'unknown'
  }

  // Const/enum checks for any provided properties
  for (const [fieldName, condition] of Object.entries(
    ifSchema.properties ?? {},
  )) {
    const value = formValues[fieldName] as UnknownFormValue
    if (!matchesConstOrEnum(value, condition)) return 'no-match'
  }

  return 'match'
}

/**
 * Computes extra required fields from JSON Schema conditionals (if/then/else and allOf).
 *
 * This is separate from `x-required_if` because some schemas only express conditional
 * requirements through JSON Schema.
 */
export function getConditionalRequiredFieldNames(
  schema: FormSchema,
  formValues: Record<string, unknown>,
): Set<string> {
  const required = new Set<string>()

  const evaluate = (conditional: ConditionalRequirement) => {
    const outcome = evaluateIfCondition(conditional.if, formValues)

    // Avoid applying `else.required` when the condition can't be evaluated yet.
    if (outcome === 'unknown') return

    const target = outcome === 'match' ? conditional.then : conditional.else
    for (const fieldName of target?.required ?? []) {
      required.add(fieldName)
    }
  }

  if (schema.if && (schema.then || schema.else)) {
    evaluate({ if: schema.if, then: schema.then, else: schema.else })
  }

  for (const conditional of schema.allOf ?? []) {
    if (conditional.if) evaluate(conditional)
  }

  return required
}

/**
 * Extract conditional requirements from schema
 */
function extractConditionalRequirements(
  schema: FormSchema,
): Map<string, ConditionalRequirement> {
  const requirements = new Map<string, ConditionalRequirement>()

  // Handle top-level if-then-else
  if (schema.if && schema.then) {
    const conditionField = Object.keys(schema.if.properties)[0] as string
    requirements.set(conditionField, {
      if: schema.if,
      then: schema.then,
      else: schema.else,
    })
  }

  // Handle allOf conditionals
  if (schema.allOf) {
    for (const conditional of schema.allOf) {
      if (conditional.if?.properties) {
        const conditionField = Object.keys(
          conditional.if.properties,
        )[0] as string
        requirements.set(conditionField, conditional)
      }
    }
  }

  return requirements
}

/**
 * Parse individual field schema into FormFieldConfig
 */
function parseFieldSchema(
  name: string,
  schema: FieldSchema,
  isRequired: boolean,
  conditionalRequirements: Map<string, ConditionalRequirement>,
): FormFieldConfig {
  const source = schema['x-source']
  const inputType = source?.type || inferInputType(schema)

  const orderRaw = (schema as unknown as { 'x-order'?: unknown })['x-order']
  const order =
    typeof orderRaw === 'number'
      ? orderRaw
      : Number.isFinite(Number(orderRaw))
        ? Number(orderRaw)
        : 999

  // Parse options for dropdown/select fields
  let options: SelectOption[] | undefined
  let dependsOn: string | undefined
  let dependentOptions: Record<string, SelectOption[]> | undefined

  if (inputType === 'array' && source?.data) {
    const data = source.data

    // Case 1: data is directly an array of options
    if (isSelectOptionArray(data)) {
      options = data.map((opt) => ({
        label: opt.label,
        value: String(opt.value),
      }))
    }
    // Case 2: data is an object with options or dependsOn
    else if (isSourceData(data)) {
      // Check for dependsOn (dependent dropdown)
      if (data.dependsOn) {
        dependsOn = data.dependsOn

        // Options might be embedded in the same data object
        if (
          data.options &&
          typeof data.options === 'object' &&
          !Array.isArray(data.options)
        ) {
          dependentOptions = {}
          for (const [key, opts] of Object.entries(data.options)) {
            if (Array.isArray(opts)) {
              dependentOptions[key] = opts.map((opt) => ({
                label: opt.label,
                value: String(opt.value),
              }))
            }
          }
        }
      }
      // Check for regular options array
      else if (data.options && Array.isArray(data.options)) {
        options = data.options.map((opt) => ({
          label: opt.label,
          value: String(opt.value),
        }))
      }
    }
  }

  // Check if this field is conditionally required by another field
  const conditionalRequired = schema['x-required_if']

  // Build validation config
  const validation: FormFieldConfig['validation'] = {
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    pattern: schema.pattern ? new RegExp(schema.pattern) : undefined,
  }

  // Add source-specific validation
  if (source?.data && isSourceData(source.data)) {
    const sourceData = source.data
    if (sourceData.minAge) {
      validation.minAge = sourceData.minAge
    }
    if (sourceData.accept) {
      validation.accept = sourceData.accept
    }
    if (sourceData.fileType) {
      validation.fileType = sourceData.fileType
    }
    if (sourceData.maxSize) {
      validation.maxSize = sourceData.maxSize
    }
  }

  return {
    name,
    label: schema['x-label'] || formatLabel(name),
    placeholder: schema['x-description'],
    order,
    inputType,
    isRequired,
    conditionalRequired,
    validation,
    errorMessages: schema.errorMessage || {},
    options,
    dependsOn,
    dependentOptions,
  }
}

/**
 * Infer input type from schema when x-source is not provided
 */
function inferInputType(schema: FieldSchema): 'text' | 'number' | 'date' {
  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number'
    case 'string':
      if (schema.format === 'date') return 'date'
      return 'text'
    default:
      return 'text'
  }
}

/**
 * Format field name into human-readable label
 */
function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/**
 * Check if a field should be required based on x-required_if condition
 */
export function isFieldConditionallyRequired(
  field: FormFieldConfig,
  formValues: Record<string, unknown>,
): boolean {
  if (!field.conditionalRequired) return field.isRequired

  const {
    field: dependentField,
    value: requiredValue,
    operator = 'eq',
  } = field.conditionalRequired
  const currentValue = formValues[dependentField]

  // Handle different operators
  switch (operator) {
    case 'eq':
      if (Array.isArray(requiredValue)) {
        return requiredValue.some(
          (v) => v === currentValue || String(v) === String(currentValue),
        )
      }
      return (
        currentValue === requiredValue ||
        String(currentValue) === String(requiredValue)
      )

    case 'neq':
      if (Array.isArray(requiredValue)) {
        return !requiredValue.some(
          (v) => v === currentValue || String(v) === String(currentValue),
        )
      }
      return (
        currentValue !== requiredValue &&
        String(currentValue) !== String(requiredValue)
      )

    case 'in':
      if (Array.isArray(requiredValue)) {
        return requiredValue.some(
          (v) => v === currentValue || String(v) === String(currentValue),
        )
      }
      return currentValue === requiredValue

    case 'nin':
      if (Array.isArray(requiredValue)) {
        return !requiredValue.some(
          (v) => v === currentValue || String(v) === String(currentValue),
        )
      }
      return currentValue !== requiredValue

    default:
      // Default to equality check
      if (Array.isArray(requiredValue)) {
        return requiredValue.some(
          (v) => v === currentValue || String(v) === String(currentValue),
        )
      }
      return (
        currentValue === requiredValue ||
        String(currentValue) === String(requiredValue)
      )
  }
}

/**
 * Get options for a dependent dropdown based on parent field value
 */
export function getDependentOptions(
  field: FormFieldConfig,
  parentValue: string | undefined,
  optionsMap: Record<string, SelectOption[]>,
): SelectOption[] {
  if (!field.dependsOn || !parentValue) return []
  return optionsMap[parentValue] || []
}
