import { describe, expect, it } from 'vitest'
import { getDependentOptionsForField } from '../../app/lib/form-builder/dependent-options'
import type { FormFieldConfig } from '../../app/lib/types/form-schema'

describe('form-builder/dependent-options', () => {
  it('returns [] when field has no dependsOn or parent value is empty', () => {
    const field = { name: 'model', label: 'Model', order: 0 } as FormFieldConfig
    expect(
      getDependentOptionsForField({ field, values: { make: 'toyota' } }),
    ).toEqual([])
  })

  it('prefers dependentOptions embedded in field config', () => {
    const field = {
      name: 'model',
      label: 'Model',
      order: 0,
      dependsOn: 'make',
      dependentOptions: {
        toyota: [{ label: 'Camry', value: 'camry' }],
      },
    } as FormFieldConfig

    expect(
      getDependentOptionsForField({ field, values: { make: 'toyota' } }),
    ).toEqual([{ label: 'Camry', value: 'camry' }])
  })

  it('falls back to external dependentOptionsMap', () => {
    const field = {
      name: 'model',
      label: 'Model',
      order: 0,
      dependsOn: 'make',
    } as FormFieldConfig

    expect(
      getDependentOptionsForField({
        field,
        values: { make: 'toyota' },
        dependentOptionsMap: {
          model: {
            toyota: [{ label: 'RAV4', value: 'rav4' }],
          },
        },
      }),
    ).toEqual([{ label: 'RAV4', value: 'rav4' }])
  })
})
