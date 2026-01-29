import { describe, expect, it } from 'vitest'
import {
  normalizeValueForSubmit,
  validateField,
} from '../../app/lib/form-builder/validation'
import type { FormFieldConfig } from '../../app/lib/types/form-schema'

function baseField(overrides: Partial<FormFieldConfig> = {}): FormFieldConfig {
  return {
    name: 'first_name',
    label: 'First Name',
    order: 0,
    inputType: 'text',
    isRequired: false,
    validation: {},
    errorMessages: {},
    ...overrides,
  }
}

describe('form-builder/validation', () => {
  it('normalizeValueForSubmit() trims strings', () => {
    expect(normalizeValueForSubmit('  hello  ')).toBe('hello')
    expect(normalizeValueForSubmit('')).toBe('')
    expect(normalizeValueForSubmit(null)).toBe(null)
  })

  it('validateField() enforces required', () => {
    const field = baseField({ isRequired: true })
    expect(validateField({ field, value: '', isRequired: true })).toBe(
      'First Name is required',
    )
  })

  it('validateField() enforces pattern and minLength', () => {
    const minLengthOnly = baseField({
      validation: { minLength: 3 },
    })
    expect(
      validateField({ field: minLengthOnly, value: 'ab', isRequired: false }),
    ).toBe('First Name must be at least 3 characters')

    const patternOnly = baseField({
      validation: { pattern: /^[0-9]{3}$/ },
      errorMessages: { pattern: 'Must be 3 digits' },
    })
    expect(
      validateField({ field: patternOnly, value: 'abc', isRequired: false }),
    ).toBe('Must be 3 digits')
    expect(
      validateField({ field: patternOnly, value: '123', isRequired: false }),
    ).toBe(undefined)
  })
})
