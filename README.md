# Dynamic Form Builder (Nuxt)

Frontend Engineering Assessment: a dynamic form builder that accepts a JSON schema and renders a fully functional form with validations, conditional requirements, and dependent dropdowns.

## Tech stack

- Nuxt 4 + Vue 3
- Tailwind CSS

## Quick start

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Open:

- http://localhost:3000

## Where the implementation lives

- Reusable form builder UI:
  - [`app/components/form-builder/FormBuilder.vue`](app/components/form-builder/FormBuilder.vue)
  - [`app/components/form-builder/FormField.vue`](app/components/form-builder/FormField.vue)
- Form-builder logic (composable + helpers):
  - [`app/lib/form-builder/useFormBuilder.ts`](app/lib/form-builder/useFormBuilder.ts)
  - [`app/lib/form-builder/validation.ts`](app/lib/form-builder/validation.ts)
  - [`app/lib/form-builder/dependent-options.ts`](app/lib/form-builder/dependent-options.ts)
  - [`app/lib/form-builder/schema.ts`](app/lib/form-builder/schema.ts)
  - [`app/lib/form-builder/types.ts`](app/lib/form-builder/types.ts)
- Schema parsing (legacy location, still source of truth): [`app/lib/schema-parser.ts`](app/lib/schema-parser.ts)
- Example schema used on the demo page: [`app/lib/sample-schema.ts`](app/lib/sample-schema.ts)
- Demo page (includes demo-only sections/grouping): [`app/pages/index.vue`](app/pages/index.vue)

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

1) `x-required_if` (custom extension)

Example:

```json
{
  "nin": {
    "type": "string",
    "x-label": "NIN",
    "x-source": { "type": "number" },
    "pattern": "^[0-9]{11}$",
    "x-required_if": { "field": "has_nin", "value": "true", "operator": "eq" },
    "errorMessage": { "pattern": "NIN must be exactly 11 digits" }
  }
}
```

2) JSON Schema `if/then/else` and `allOf` conditionals

If the schema includes `if/then/else` (and/or conditionals inside `allOf`), the builder computes which fields become required based on the current form values.

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

## Submission

On submit:

- The raw values are logged to the browser console.
- A JSON-safe version (files converted to `{ name, size, type }`) is rendered below the form for easy review.

## Approach notes / trade-offs

- This implementation focuses on the subset of JSON Schema used by the assessment and the sample schema (object properties, `required`, `pattern`, `min/maxLength`, and common conditional patterns).
- JSON Schema conditionals are evaluated in a pragmatic way (supports `if.required` presence checks and `if.properties.<field>.const/enum` matching).
- Visibility rules (show/hide fields) are not implemented; only conditional *requiredness* is enforced.
- File uploads are validated by MIME type/extension heuristics via `fileType` and `accept`.
