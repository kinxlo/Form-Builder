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
  const equalsSignIndex = source.indexOf('=')
  const exportDefaultKeywordIndex = source.indexOf('export default')

  const startSearchingFromIndex =
    exportDefaultKeywordIndex >= 0
      ? exportDefaultKeywordIndex
      : equalsSignIndex >= 0
        ? equalsSignIndex
        : 0

  const openingBraceIndex = source.indexOf('{', startSearchingFromIndex)
  if (openingBraceIndex < 0) return null

  let currentIndex = openingBraceIndex
  let braceDepth = 0
  let inString: 'single' | 'double' | 'template' | null = null
  let isEscaping = false

  for (; currentIndex < source.length; currentIndex++) {
    const character = source[currentIndex]

    if (isEscaping) {
      isEscaping = false
      continue
    }

    if (inString) {
      if (character === '\\') {
        isEscaping = true
        continue
      }
      if (inString === 'single' && character === "'") inString = null
      else if (inString === 'double' && character === '"') inString = null
      else if (inString === 'template' && character === '`') inString = null
      continue
    }

    if (character === "'") {
      inString = 'single'
      continue
    }
    if (character === '"') {
      inString = 'double'
      continue
    }
    if (character === '`') {
      inString = 'template'
      continue
    }

    if (character === '{') {
      braceDepth++
      continue
    }
    if (character === '}') {
      braceDepth--
      if (braceDepth === 0) {
        return source.slice(openingBraceIndex, currentIndex + 1)
      }
    }
  }

  return null
}

export function parseFormSchemaInput(input: string): ParseResult {
  const trimmedInputString = input.trim()
  if (!trimmedInputString) throw new Error('Paste a JSON schema first')

  // 1) Try strict JSON first.
  try {
    const parsedValue = JSON.parse(trimmedInputString) as unknown
    assertLooksLikeFormSchema(parsedValue)
    return { schema: parsedValue, mode: 'json' }
  } catch {
    // Continue to object-literal parsing.
  }

  // 2) Attempt to extract `{ ... }` from TS/JS source and evaluate.
  const objectLiteralSource = trimmedInputString.startsWith('{')
    ? trimmedInputString
    : extractFirstObjectLiteral(trimmedInputString)
  if (!objectLiteralSource) {
    throw new Error(
      'Unable to find a schema object. Paste valid JSON, or a TS snippet that contains `= { ... }`.',
    )
  }

  // NOTE: This evaluates arbitrary JS. This is intentionally used only for local/dev tooling.
  const evaluatedValue = Function(
    '"use strict";\n' +
      '// eslint-disable-next-line no-new-func\n' +
      `return (${objectLiteralSource});`,
  )() as unknown

  assertLooksLikeFormSchema(evaluatedValue)
  return { schema: evaluatedValue, mode: 'object-literal' }
}
