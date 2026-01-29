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

  it('validateField() enforces maxLength (default + custom message)', () => {
    const field = baseField({
      validation: { maxLength: 3 },
    })
    expect(validateField({ field, value: 'abcd', isRequired: false })).toBe(
      'First Name must be no more than 3 characters',
    )

    const fieldWithCustom = baseField({
      validation: { maxLength: 3 },
      errorMessages: { type: 'Too long' },
    })
    expect(
      validateField({
        field: fieldWithCustom,
        value: 'abcd',
        isRequired: false,
      }),
    ).toBe('Too long')
  })

  it('validateField() enforces minAge', () => {
    const field = baseField({
      inputType: 'date',
      validation: { minAge: 18 },
      errorMessages: { minAge: 'Too young' },
    })

    // A recent date should always fail minAge=18.
    expect(
      validateField({ field, value: '2015-01-01', isRequired: false }),
    ).toBe('Too young')
  })

  it('validateField() validates file type + size when File exists (Node stub)', () => {
    class TestFile {
      name: string
      size: number
      type: string
      constructor(name: string, size: number, type: string) {
        this.name = name
        this.size = size
        this.type = type
      }
    }

    const previousFile = (globalThis as any).File
    ;(globalThis as any).File = TestFile
    try {
      const fileField = baseField({
        inputType: 'file',
        validation: { fileType: ['pdf'], maxSize: 1024 },
        errorMessages: { fileType: 'Bad type', fileSize: 'Too big' },
      })

      const badType = new TestFile('photo.jpg', 100, 'image/jpeg') as any
      expect(
        validateField({ field: fileField, value: badType, isRequired: false }),
      ).toBe('Bad type')

      const tooBig = new TestFile('doc.pdf', 5000, 'application/pdf') as any
      expect(
        validateField({ field: fileField, value: tooBig, isRequired: false }),
      ).toBe('Too big')

      const ok = new TestFile('doc.pdf', 100, 'application/pdf') as any
      expect(
        validateField({ field: fileField, value: ok, isRequired: false }),
      ).toBe(undefined)
    } finally {
      ;(globalThis as any).File = previousFile
    }
  })
})
