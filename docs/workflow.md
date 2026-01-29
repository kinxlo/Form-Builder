# Workflow

## Where the implementation lives

- Reusable form builder UI:
  - [`app/components/form-builder/FormBuilder.vue`](app/components/form-builder/FormBuilder.vue)
  - [`app/components/form-builder/FormField.vue`](app/components/form-builder/FormField.vue)
- Form-builder logic (composable + helpers):
  - [`useFormBuilder()`](app/lib/form-builder/useFormBuilder.ts:24)
  - [`validation`](app/lib/form-builder/validation.ts:1)
  - [`dependent options`](app/lib/form-builder/dependent-options.ts:1)
  - [`schema facade`](app/lib/form-builder/schema.ts:1)
  - [`types`](app/lib/form-builder/types.ts:1)
- Schema parsing (legacy location, still source of truth): [`app/lib/schema-parser.ts`](app/lib/schema-parser.ts:1)
- Example schema used on the demo page: [`app/lib/sample-schema.ts`](app/lib/sample-schema.ts:1)
- Demo page (includes demo-only sections/grouping): [`app/pages/index.vue`](app/pages/index.vue:1)

## Supported schema features

### Field ordering

Fields are rendered by ascending `x-order`.

### Labels and placeholders

- `x-label` → displayed label
- `x-description` → placeholder

### Input types (`x-source.type`)

The form builder maps `x-source.type` to UI widgets:

- `text` → text input
- `tel` → phone input
- `number` → numeric input (HTML `type="number"`)
- `date` → date picker (supports `minAge` constraint)
- `file` → file upload (supports `accept` + `fileType` constraints)
- `array` → select/dropdown (options in `x-source.data`)

### Validations

All validation runs client-side on submit, and errors are shown inline:

- `required` (schema-level `required`, JSON Schema conditionals, and `x-required_if`)
- `pattern` (supports custom `errorMessage.pattern`)
- `minLength`
- `maxLength`
- `date` + `minAge` (from `x-source.data.minAge`)
- `fileType` (from `x-source.data.fileType`)
- `maxSize` (from `x-source.data.maxSize`, in bytes)

### Conditional requirements

Two mechanisms are supported:

1. `x-required_if` (custom extension)

2. JSON Schema `if/then/else` and `allOf` conditionals

### Dependent dropdowns

For `array` fields, dependent options are supported when the schema provides:

```json
"x-source": {
  "type": "array",
  "data": {
    "dependsOn": "vehicle_make",
    "options": {
      "toyota": [ { "label": "Camry", "value": "camry" } ]
    }
  }
}
```

When the parent field changes, the dependent field is reset.
