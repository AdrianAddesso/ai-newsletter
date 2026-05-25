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
): { fontSize?: string; fontWeight?: number; fontStyle?: string; fontFamily?: string } {
  const styles = typographyStyle ? typographyStyle.split(",") : [];

  return {
    ...(fontSize && { fontSize }),
    ...(styles.includes("bold") && { fontWeight: 700 }),
    ...(styles.includes("italic") && { fontStyle: "italic" }),
    ...(fontFamily && { fontFamily }),
  };
}
