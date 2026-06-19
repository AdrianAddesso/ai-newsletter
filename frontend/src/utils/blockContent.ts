/**
 * Safely parses a BlockInstance's JSON content string into a plain object.
 * Returns an empty object on null input or parse failure.
 */
export function parseContent<T extends Record<string, string>>(
  content: string | null,
): Partial<T> {
  if (!content) {
    return {};
  }

  try {
    return JSON.parse(content) as Partial<T>;
  } catch {
    return {};
  }
}

/**
 * Serializes a plain key-value object back into the JSON string stored in BlockInstance.content.
 */
export function serializeContent(values: Record<string, string>): string {
  return JSON.stringify(values);
}

/**
 * Derives MUI-compatible sx typography props from the two stored keys.
 * Safe to spread directly onto a Typography sx prop.
 *
 * @param fontSize - e.g. "1rem" (stored in content)
 * @param typographyStyle - comma-separated "bold", "italic", or "bold,italic"
 */
export function resolveTypographySx(
  fontSize?: string,
  typographyStyle?: string,
  fontFamily?: string,
  fontColor?: string,
): {
  fontSize?: string
  fontWeight?: number
  fontStyle?: string
  fontFamily?: string
  color?: string
} {
  const styles = typographyStyle ? typographyStyle.split(',') : []
  const hasCustomFontFamily = !!fontFamily?.trim()

  return {
    ...(fontSize && { fontSize }),
    ...(!hasCustomFontFamily && styles.includes('bold') && { fontWeight: 700 }),
    ...(!hasCustomFontFamily &&
      styles.includes('italic') && { fontStyle: 'italic' }),
    ...(hasCustomFontFamily && { fontFamily: `"${fontFamily!.trim()}"` }),
    ...(fontColor?.trim() && { color: fontColor.trim() }),
  }
}

export function resolveContentTypographySx(
  values: Partial<Record<string, string>>,
  fieldKey: string,
): {
  fontSize?: string
  fontWeight?: number
  fontStyle?: string
  fontFamily?: string
  color?: string
} {
  return resolveTypographySx(
    values[`${fieldKey}FontSize`] ?? values.fontSize,
    values.typographyStyle,
    values[`${fieldKey}FontFamily`] ?? values.fontFamily,
    values[`${fieldKey}FontColor`] ?? values.fontColor,
  )
}
