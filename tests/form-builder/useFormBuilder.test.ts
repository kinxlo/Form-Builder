import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFormBuilder } from '../../app/lib/form-builder/useFormBuilder'
import type { FormSchema } from '../../app/lib/types/form-schema'

describe('useFormBuilder()', () => {
  // Silence console noise from handleSubmit() (it logs submit payloads and errors).
  // We still assert on state changes instead of relying on console output.
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('initializes values for parsed fields and clears dependent field when parent changes', () => {
    const schema: FormSchema = {
      type: 'object',
      properties: {
        make: {
          type: 'string',
          'x-order': 0,
          'x-source': {
            type: 'array',
            data: [{ label: 'Toyota', value: 'toyota' }],
          },
        },
        model: {
          type: 'string',
          'x-order': 1,
          'x-source': {
            type: 'array',
            data: {
              dependsOn: 'make',
              options: {
                toyota: [{ label: 'Camry', value: 'camry' }],
              },
            },
          },
        },
      },
    }

    const fb = useFormBuilder({ schema: () => schema })

    expect(Object.keys(fb.values.value)).toEqual(['make', 'model'])

    fb.handleFieldChange('make', 'toyota')
    fb.handleFieldChange('model', 'camry')
    expect(fb.values.value.model).toBe('camry')

    // Changing parent resets dependent field
    fb.handleFieldChange('make', 'toyota')
    expect(fb.values.value.model).toBe('')
  })

  it('handleSubmit() blocks when invalid and scrolls to the first error (no throw in Node)', async () => {
    const schema: FormSchema = {
      type: 'object',
      required: ['first_name'],
      properties: {
        first_name: {
          type: 'string',
          'x-order': 0,
          'x-label': 'First Name',
          'x-source': { type: 'text' },
        },
      },
    }

    // Minimal document stub for the scrollIntoView call.
    const scrollIntoView = vi.fn()
    ;(globalThis as any).document = {
      getElementById: () => ({ scrollIntoView }),
    }

    const fb = useFormBuilder({ schema: () => schema })

    const onSubmit = vi.fn()
    await fb.handleSubmit(onSubmit)

    expect(onSubmit).not.toHaveBeenCalled()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(fb.errors.value.first_name).toBe('First Name is required')
  })

  it('handleSubmit() trims strings before calling onSubmit', async () => {
    const schema: FormSchema = {
      type: 'object',
      required: ['first_name'],
      properties: {
        first_name: {
          type: 'string',
          'x-order': 0,
          'x-label': 'First Name',
          'x-source': { type: 'text' },
        },
      },
    }

    const fb = useFormBuilder({ schema: () => schema })
    fb.handleFieldChange('first_name', '  Ada  ')

    const onSubmit = vi.fn()
    await fb.handleSubmit(onSubmit)

    expect(onSubmit).toHaveBeenCalledWith({ first_name: 'Ada' })
    expect(fb.submitSuccess.value).toBe(true)
    expect(fb.lastSubmitted.value).toEqual({ first_name: 'Ada' })
  })

  it('fieldClasses() returns error styles only when hasError=true', () => {
    const schema: FormSchema = {
      type: 'object',
      properties: {
        first_name: {
          type: 'string',
          'x-order': 0,
          'x-label': 'First Name',
          'x-source': { type: 'text' },
        },
      },
    }

    const fb = useFormBuilder({ schema: () => schema })
    expect(fb.fieldClasses(false)).toBe('')
    expect(fb.fieldClasses(true)).toContain('border-destructive')
  })

  it('handleSubmit() converts File values to metadata in lastSubmitted payload (Node stub)', async () => {
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
      const schema: FormSchema = {
        type: 'object',
        required: ['id_doc'],
        properties: {
          id_doc: {
            type: 'string',
            'x-order': 0,
            'x-label': 'ID Document',
            'x-source': { type: 'file' },
          },
        },
      }

      const fb = useFormBuilder({ schema: () => schema })
      const file = new TestFile('doc.pdf', 1234, 'application/pdf') as any
      fb.handleFieldChange('id_doc', file)

      const onSubmit = vi.fn()
      await fb.handleSubmit(onSubmit)

      expect(fb.submitSuccess.value).toBe(true)
      expect(fb.lastSubmitted.value).toEqual({
        id_doc: { name: 'doc.pdf', size: 1234, type: 'application/pdf' },
      })
    } finally {
      ;(globalThis as any).File = previousFile
    }
  })

  it('handleSubmit() sets a form-level error when onSubmit throws', async () => {
    const schema: FormSchema = {
      type: 'object',
      required: ['first_name'],
      properties: {
        first_name: {
          type: 'string',
          'x-order': 0,
          'x-label': 'First Name',
          'x-source': { type: 'text' },
        },
      },
    }

    const fb = useFormBuilder({ schema: () => schema })
    fb.handleFieldChange('first_name', 'Ada')

    const onSubmit = vi.fn(() => {
      throw new Error('boom')
    })
    await fb.handleSubmit(onSubmit)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(fb.submitSuccess.value).toBe(false)
    expect(fb.errors.value._form).toBe(
      'An error occurred while submitting the form. Please try again.',
    )
  })
})
