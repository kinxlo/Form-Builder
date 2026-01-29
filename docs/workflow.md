# Workflow

## Where the implementation lives

- Reusable form builder UI:
- Reusable form builder UI:
  - [`app/components/form-builder/FormBuilder.vue`](app/components/form-builder/FormBuilder.vue:1)
  - [`app/components/form-builder/FormField.vue`](app/components/form-builder/FormField.vue:1)
- Form-builder logic (composable + helpers):
  - [`useFormBuilder()`](app/lib/form-builder/useFormBuilder.ts:24) CORE Business Logic
  - [`validation`](app/lib/form-builder/validation.ts:1)
  - [`dependent options`](app/lib/form-builder/dependent-options.ts:1)
  - [`schema facade`](app/lib/form-builder/schema.ts:1)
  - [`types`](app/lib/form-builder/types.ts:1)
- Schema parsing (legacy location, still source of truth): [`app/lib/schema-parser.ts`](app/lib/schema-parser.ts:1) CORE Business Logic (OLD)
- Example schema provided: [`app/lib/sample-schema.ts`](app/lib/sample-schema.ts:1)
- Demo page (includes demo-only sections/grouping): [`app/pages/index.vue`](app/pages/index.vue:1)

## Data flow (schema textarea → rendered form)

### Step-by-step

1. **User edits the schema textarea** on the demo page.
   - The textarea is bound via `v-model` to `schemaInput` in [`app/pages/index.vue`](app/pages/index.vue:16).

2. **User clicks “Parse”**.
   - The click handler [`handleParseClick()`](app/pages/index.vue:21) runs.

3. **Schema parsing (string → `FormSchema`)**.
   - [`handleParseClick()`](app/pages/index.vue:21) calls [`parseFormSchemaInput()`](app/lib/parse-form-schema-input.ts:91).
   - [`parseFormSchemaInput()`](app/lib/parse-form-schema-input.ts:91) tries:
     - `JSON.parse(...)` (strict JSON) and validates shape via `assertLooksLikeFormSchema(...)`.
     - If JSON parsing fails: extracts a `{ ... }` object literal and evaluates it with `Function(...)`.
   - Output: `{ schema, mode }` where `schema` is a validated `FormSchema`.

4. **Parsed schema becomes reactive state**.
   - [`handleParseClick()`](app/pages/index.vue:21) stores the parsed result into `parsedSchema`.
   - `schema` is a `computed` wrapper over `parsedSchema` (so it can be `null` until Parse is clicked) in [`app/pages/index.vue`](app/pages/index.vue:42).

5. **Rendering is unblocked**.
   - The template uses `<FormBuilder v-if="schema" :schema="schema" ... />` in [`app/pages/index.vue`](app/pages/index.vue:122).
   - Once `schema !== null`, Vue mounts [`app/components/form-builder/FormBuilder.vue`](app/components/form-builder/FormBuilder.vue:1).

6. **Schema → `FormFieldConfig[]` (core form-building step)**.
   - `FormBuilder` initializes its composable by calling [`useFormBuilder()`](app/lib/form-builder/useFormBuilder.ts:24).
   - Inside [`useFormBuilder()`](app/lib/form-builder/useFormBuilder.ts:24), a `watch(..., { immediate: true })` runs and calls `initializeForm()` in [`app/lib/form-builder/useFormBuilder.ts`](app/lib/form-builder/useFormBuilder.ts:43).
   - [`initializeForm()`](app/lib/form-builder/useFormBuilder.ts:43) calls [`parseSchema()`](app/lib/schema-parser.ts:39) (imported via the facade at [`app/lib/form-builder/schema.ts`](app/lib/form-builder/schema.ts:5)).
   - [`parseSchema()`](app/lib/schema-parser.ts:39) iterates `schema.properties` and converts each field via `parseFieldSchema(...)` in [`app/lib/schema-parser.ts`](app/lib/schema-parser.ts:211), producing a normalized `FormFieldConfig`.
   - The resulting fields are sorted (stable) by `x-order` in [`parseSchema()`](app/lib/schema-parser.ts:39).

7. **Field configs become UI**.
   - `fields.value` (from [`useFormBuilder()`](app/lib/form-builder/useFormBuilder.ts:24)) is consumed by `FormBuilder`, which renders per-field UI through [`app/components/form-builder/FormField.vue`](app/components/form-builder/FormField.vue:1).

8. **User input updates form state**.
   - When a user types/selects/uploads, `FormBuilder/FormField` call [`handleFieldChange()`](app/lib/form-builder/useFormBuilder.ts:77) to update `values`.
   - If the changed field is a dependency parent, dependent child fields are cleared in [`handleFieldChange()`](app/lib/form-builder/useFormBuilder.ts:77).

9. **Dependent dropdown options (if applicable)**.
   - Field option lists are read through [`getDependentOptions()`](app/lib/form-builder/useFormBuilder.ts:175), which delegates to [`getDependentOptionsForField()`](app/lib/form-builder/dependent-options.ts:1).
   - The schema-derived `dependsOn` + `dependentOptions` map are produced during `parseFieldSchema(...)` in [`app/lib/schema-parser.ts`](app/lib/schema-parser.ts:211).

10. **Submit → validation → payload**.

- On submit, [`handleSubmit()`](app/lib/form-builder/useFormBuilder.ts:124) runs:
  - Calls `validateForm()` in [`app/lib/form-builder/useFormBuilder.ts`](app/lib/form-builder/useFormBuilder.ts:103).
  - Per-field validation uses [`validateField()`](app/lib/form-builder/validation.ts:1).
  - “Required?” is computed by combining:
    - JSON Schema conditionals via [`getConditionalRequiredFieldNames()`](app/lib/schema-parser.ts:133)
    - custom `x-required_if` via [`isFieldConditionallyRequired()`](app/lib/schema-parser.ts:353)
    - schema-level `required` from `parseSchema(...)` → `field.isRequired`
  - Values are normalized via `normalizeValueForSubmit(...)` in [`app/lib/form-builder/validation.ts`](app/lib/form-builder/validation.ts:1).
  - Files are converted to metadata for display (`{ name, size, type }`) inside [`handleSubmit()`](app/lib/form-builder/useFormBuilder.ts:124).

### Diagram

```mermaid
flowchart TD
  A[Schema textarea\n(v-model: schemaInput)] -->|click Parse| B[handleParseClick()\napp/pages/index.vue]
  B --> C[parseFormSchemaInput(input)\napp/lib/parse-form-schema-input.ts]
  C -->|JSON.parse ok| D[FormSchema]
  C -->|object literal eval| D[FormSchema]
  D --> E[parsedSchema (ref) + schema (computed)]
  E -->|v-if schema| F[<FormBuilder :schema=...>]
  F --> G[useFormBuilder({ schema })\napp/lib/form-builder/useFormBuilder.ts]
  G --> H[initializeForm()]
  H --> I[parseSchema(schema)\napp/lib/schema-parser.ts]
  I --> J[FormFieldConfig[]\n(sorted by x-order)]
  J --> K[FormBuilder renders fields]
  K --> L[FormField components]\n
  L -->|on change| M[handleFieldChange(name, value)]
  M --> N[values + errors update]\n
  L -->|options| O[getDependentOptions() -> getDependentOptionsForField()]\n
  K -->|submit| P[handleSubmit()]
  P --> Q[validateForm() -> validateField()]
  P --> R[normalizeValueForSubmit() + json-safe payload]
```

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
