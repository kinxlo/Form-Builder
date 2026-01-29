import type { FormFieldConfig } from './types'

type UnknownFormValue = string | boolean | File | null | undefined

// Avoid `ReferenceError: File is not defined` during SSR.
const FileCtor = (globalThis as unknown as { File?: typeof File }).File

function isFile(value: unknown): value is File {
  return Boolean(FileCtor) && value instanceof (FileCtor as typeof File)
}

export function normalizeValueForSubmit(value: UnknownFormValue): UnknownFormValue {
  // Keep File/boolean as-is; trim strings for better UX.
  if (typeof value === 'string') return value.trim()
  return value
}

export function isEmptyValue(value: UnknownFormValue): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (isFile(value)) return !value.name
  // boolean true/false counts as filled
  return false
}

export function validateField(params: {
  field: FormFieldConfig
  value: UnknownFormValue
  isRequired: boolean
}): string | undefined {
  const { field, value, isRequired } = params
  const { validation, errorMessages } = field

  // Required validation
  if (isRequired) {
    if (value === null || value === undefined || value === '') {
      return errorMessages.required || `${field.label} is required`
    }
    if (isFile(value) && !value.name) {
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

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < validation.minAge) {
      return (
        errorMessages.minAge || `You must be at least ${validation.minAge} years old`
      )
    }
  }

  // File validation
  if (isFile(value)) {
    // File type validation
    if (validation.fileType) {
      const fileTypeValue = validation.fileType
      const acceptedTypes = Array.isArray(fileTypeValue)
        ? fileTypeValue.map((t) => t.toLowerCase())
        : fileTypeValue.split(',').map((t) => t.trim().toLowerCase())

      const fileExtension = value.name.split('.').pop()?.toLowerCase()
      const fileMimeType = value.type.toLowerCase()

      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return `.${fileExtension}` === type
        }
        if (type.includes('*') || type === 'image' || type === 'pdf') {
          if (type === 'image') return fileMimeType.startsWith('image/')
          if (type === 'pdf') return fileMimeType === 'application/pdf'

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
      return errorMessages.fileSize || `File size must be less than ${maxSizeMB}MB`
    }
  }

  return undefined
}

