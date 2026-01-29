// Form-builder schema facade.
//
// The JSON-schema parsing/conditional logic currently lives in `app/lib/schema-parser.ts`.
// This file provides a stable import surface for the form-builder feature.
export {
  getConditionalRequiredFieldNames,
  getDependentOptions,
  isFieldConditionallyRequired,
  parseSchema,
} from '../schema-parser'
