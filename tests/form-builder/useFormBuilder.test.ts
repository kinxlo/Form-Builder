import { describe, expect, it, vi } from 'vitest'
import { useFormBuilder } from '../../app/lib/form-builder/useFormBuilder'
import type { FormSchema } from '../../app/lib/types/form-schema'

describe('useFormBuilder()', () => {
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
})
