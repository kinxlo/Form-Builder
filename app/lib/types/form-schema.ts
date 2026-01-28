/**
 * JSON Schema types for Dynamic Form Builder
 */

// Source type options
export type SourceType = 'text' | 'tel' | 'number' | 'date' | 'file' | 'array'

// Option type for dropdowns/selects
export interface SelectOption {
  label: string
  value: string | boolean
}

// Source data configuration - supports both formats:
// 1. data: { options: [...] }  (nested options)
// 2. data: [...]               (direct array of options)
// 3. data: { dependsOn: "field", options: { value1: [...], value2: [...] } }
export interface SourceData {
  minAge?: number
  accept?: string
  fileType?: string | string[]
  maxSize?: number
  options?: SelectOption[] | Record<string, SelectOption[]>
  dependsOn?: string
}

// x-source configuration
export interface XSource {
  type: SourceType
  data?: SourceData | SelectOption[]
}

// x-required_if configuration
export interface XRequiredIf {
  field: string
  value: string | string[] | boolean
  operator?: 'eq' | 'neq' | 'in' | 'nin'
}

// Conditional requirement (if-then-else)
export interface ConditionalRequirement {
  if: {
    required?: string[]
    properties: Record<string, { const?: string; enum?: string[] }>
  }
  then?: {
    required?: string[]
    properties?: Record<string, unknown>
  }
  else?: {
    required?: string[]
    properties?: Record<string, unknown>
  }
}

// Custom error messages
export interface ErrorMessages {
  required?: string
  pattern?: string
  minLength?: string
  type?: string
  minAge?: string
  fileType?: string
  fileSize?: string
}

// Individual field schema
export interface FieldSchema {
  type: string
  enum?: string[]
  format?: string
  'x-label'?: string
  'x-description'?: string
  'x-order'?: number
  'x-source'?: XSource
  'x-required_if'?: XRequiredIf
  minLength?: number
  maxLength?: number
  pattern?: string
  errorMessage?: ErrorMessages
}

// Main form schema
export interface FormSchema {
  type: 'object'
  title?: string
  description?: string
  properties: Record<string, FieldSchema>
  required?: string[]
  if?: ConditionalRequirement['if']
  then?: ConditionalRequirement['then']
  else?: ConditionalRequirement['else']
  allOf?: ConditionalRequirement[]
}

// Form field configuration (processed from schema)
export interface FormFieldConfig {
  name: string
  label: string
  placeholder?: string
  order: number
  inputType: SourceType
  isRequired: boolean
  conditionalRequired?: XRequiredIf
  validation: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    minAge?: number
    accept?: string
    fileType?: string | string[]
    maxSize?: number
  }
  errorMessages: ErrorMessages
  options?: SelectOption[]
  dependsOn?: string
  dependentOptions?: Record<string, SelectOption[]>
}

// Form values type
export type FormValues = Record<string, string | File | boolean | null>

// Form submission result
export interface FormSubmissionResult {
  success: boolean
  data?: FormValues
  errors?: Record<string, string>
}
