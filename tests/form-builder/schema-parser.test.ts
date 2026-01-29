import { describe, expect, it } from 'vitest'
import {
  getConditionalRequiredFieldNames,
  isFieldConditionallyRequired,
  parseSchema,
} from '../../app/lib/schema-parser'
import type {
  FormSchema,
  FormFieldConfig,
} from '../../app/lib/types/form-schema'

describe('schema-parser', () => {
  it('parseSchema() sorts by x-order (stable)', () => {
    const schema: FormSchema = {
      type: 'object',
      properties: {
        b: { type: 'string', 'x-order': 2, 'x-source': { type: 'text' } },
        a: { type: 'string', 'x-order': 1, 'x-source': { type: 'text' } },
      },
    }

    const fields = parseSchema(schema)
    expect(fields.map((f) => f.name)).toEqual(['a', 'b'])
  })

  it('getConditionalRequiredFieldNames() does not apply else.required while condition is unknown', () => {
    const schema: FormSchema = {
      type: 'object',
      properties: {
        purchase_type: { type: 'string', 'x-source': { type: 'text' } },
        lease_doc: { type: 'string', 'x-source': { type: 'text' } },
        proof_of_ownership: { type: 'string', 'x-source': { type: 'text' } },
      },
      if: {
        required: ['purchase_type'],
        properties: { purchase_type: { const: 'lease' } },
      },
      then: { required: ['lease_doc'] },
      else: { required: ['proof_of_ownership'] },
    }

    // User hasn't filled purchase_type yet -> outcome is 'unknown'
    expect(getConditionalRequiredFieldNames(schema, {})).toEqual(new Set())
  })

  it('getConditionalRequiredFieldNames() applies then/else required after condition becomes known', () => {
    const schema: FormSchema = {
      type: 'object',
      properties: {
        purchase_type: { type: 'string', 'x-source': { type: 'text' } },
        lease_doc: { type: 'string', 'x-source': { type: 'text' } },
        proof_of_ownership: { type: 'string', 'x-source': { type: 'text' } },
      },
      if: {
        required: ['purchase_type'],
        properties: { purchase_type: { const: 'lease' } },
      },
      then: { required: ['lease_doc'] },
      else: { required: ['proof_of_ownership'] },
    }

    expect(
      getConditionalRequiredFieldNames(schema, { purchase_type: 'lease' }),
    ).toEqual(new Set(['lease_doc']))

    expect(
      getConditionalRequiredFieldNames(schema, { purchase_type: 'owned' }),
    ).toEqual(new Set(['proof_of_ownership']))
  })

  it('isFieldConditionallyRequired() supports x-required_if eq', () => {
    const field: FormFieldConfig = {
      name: 'nin',
      label: 'NIN',
      order: 0,
      inputType: 'text',
      isRequired: false,
      conditionalRequired: { field: 'has_nin', value: true, operator: 'eq' },
      validation: {},
      errorMessages: {},
    }

    expect(isFieldConditionallyRequired(field, { has_nin: true })).toBe(true)
    expect(isFieldConditionallyRequired(field, { has_nin: false })).toBe(false)
  })
})
