import type { FormSchema } from '~/lib/types/form-schema'

type ParseResult = { schema: FormSchema; mode: 'json' | 'object-literal' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertLooksLikeFormSchema(
  value: unknown,
): asserts value is FormSchema {
  if (!isRecord(value)) throw new Error('Parsed value is not an object')
  if (value.type !== 'object') {
    // Many schemas include `type: 'object'`. If it is absent, we still allow it,
    // but if present and different, treat it as invalid.
    if ('type' in value) {
      throw new Error("Schema must have type: 'object'")
    }
  }
  if (!('properties' in value) || !isRecord(value.properties)) {
    throw new Error('Schema must include a properties object')
  }
}

function extractFirstObjectLiteral(source: string): string | null {
  // Try to locate an assignment first:
  // - export const sampleSchema: FormSchema = { ... }
  // - const schema = { ... }
  // - export default { ... }
  const eqIdx = source.indexOf('=')
  const exportDefaultIdx = source.indexOf('export default')

  const startSearchFrom =
    exportDefaultIdx >= 0 ? exportDefaultIdx : eqIdx >= 0 ? eqIdx : 0

  const openIdx = source.indexOf('{', startSearchFrom)
  if (openIdx < 0) return null

  let i = openIdx
  let depth = 0
  let inString: 'single' | 'double' | 'template' | null = null
  let escape = false

  for (; i < source.length; i++) {
    const ch = source[i]

    if (escape) {
      escape = false
      continue
    }

    if (inString) {
      if (ch === '\\') {
        escape = true
        continue
      }
      if (inString === 'single' && ch === "'") inString = null
      else if (inString === 'double' && ch === '"') inString = null
      else if (inString === 'template' && ch === '`') inString = null
      continue
    }

    if (ch === "'") {
      inString = 'single'
      continue
    }
    if (ch === '"') {
      inString = 'double'
      continue
    }
    if (ch === '`') {
      inString = 'template'
      continue
    }

    if (ch === '{') {
      depth++
      continue
    }
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return source.slice(openIdx, i + 1)
      }
    }
  }

  return null
}

/**
 * Parses user-provided schema text into a `FormSchema`.
 *
 * Supported inputs:
 * - JSON string: `{ "type": "object", "properties": { ... } }`
 * - TS/JS module snippet containing an object literal assignment.
 *
 * Note: the TS/JS path uses `Function(...)` evaluation. Only use with trusted input.
 */
export function parseFormSchemaInput(input: string): ParseResult {
  const raw = input.trim()
  if (!raw) throw new Error('Paste a JSON schema first')

  // 1) Try strict JSON first.
  try {
    const parsed = JSON.parse(raw) as unknown
    assertLooksLikeFormSchema(parsed)
    return { schema: parsed, mode: 'json' }
  } catch {
    // Continue to object-literal parsing.
  }

  // 2) Attempt to extract `{ ... }` from TS/JS source and evaluate.
  const objectLiteral = raw.startsWith('{')
    ? raw
    : extractFirstObjectLiteral(raw)
  if (!objectLiteral) {
    throw new Error(
      'Unable to find a schema object. Paste valid JSON, or a TS snippet that contains `= { ... }`.',
    )
  }

  // NOTE: This evaluates arbitrary JS. This is intentionally used only for local/dev tooling.
  const evaluated = Function(
    '"use strict";\n' +
      '// eslint-disable-next-line no-new-func\n' +
      `return (${objectLiteral});`,
  )() as unknown

  assertLooksLikeFormSchema(evaluated)
  return { schema: evaluated, mode: 'object-literal' }
}
