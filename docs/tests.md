# Tests

This repo uses Vitest for unit tests and v8 coverage.

## Commands

Run tests:

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

Run with coverage (HTML report output to `./coverage/`):

```bash
pnpm test:coverage
```

## What I tested (criteria covered)

Unit tests live under [`tests/`](tests/) and focus on the form-builder _logic_ (schema parsing, validation, dependent options, and the `useFormBuilder` composable).

### Validation ([`app/lib/form-builder/validation.ts`](app/lib/form-builder/validation.ts:1))

- `normalizeValueForSubmit()` trims strings.
- `validateField()`:
  - required
  - minLength
  - pattern (incl. custom `errorMessages.pattern`)

### Dependent dropdown options ([`app/lib/form-builder/dependent-options.ts`](app/lib/form-builder/dependent-options.ts:1))

- Returns `[]` when there is no `dependsOn` or the parent value is empty.
- Prefers `field.dependentOptions` embedded in the field config.
- Falls back to the external `dependentOptionsMap`.

### Schema parsing + conditional requiredness ([`app/lib/schema-parser.ts`](app/lib/schema-parser.ts:1))

- `parseSchema()` sorts fields by `x-order`.
- JSON Schema `if/then/else` required fields:
  - does **not** apply `else.required` while the condition is still _unknown_ (e.g. user hasn’t filled the `if.required` fields yet).
  - applies `then.required` / `else.required` once the condition becomes known.
- `x-required_if` conditional required (basic `eq` path).

### Composable behavior ([`useFormBuilder()`](app/lib/form-builder/useFormBuilder.ts:24))

- Initializes `values` based on parsed schema fields.
- Resets dependent fields when a parent field changes.
- `handleSubmit()`:
  - blocks submission when invalid and attempts to scroll to the first error
  - trims string values before calling `onSubmit`
  - sets `submitSuccess` and `lastSubmitted` on success
