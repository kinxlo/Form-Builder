// Form-builder schema facade.
//
// The JSON-schema parsing/conditional logic currently lives in `~/lib/schema-parser`.
// This file provides a stable import surface for the form-builder feature.
export {
  getConditionalRequiredFieldNames,
  getDependentOptions,
  isFieldConditionallyRequired,
  parseSchema,
} from '~/lib/schema-parser'
