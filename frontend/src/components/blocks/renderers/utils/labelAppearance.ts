export function resolveLabelSurfaceSx(backgroundColor?: string): {
  backgroundColor?: string;
  boxShadow?: string;
} {
  const normalizedColor = normalizeHexColor(backgroundColor);

  if (!normalizedColor) {
    return {};
  }

  return {
    backgroundColor: normalizedColor,
    boxShadow: `4px 4px 0 ${darkenHexColor(normalizedColor, 0.14)}`,
  };
}

function normalizeHexColor(value?: string): string | null {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^#([0-9a-fA-F]{6})$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return null;
}

function darkenHexColor(hexColor: string, amount: number): string {
  const clampedAmount = Math.min(Math.max(amount, 0), 1);
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  return `#${[red, green, blue]
    .map((channel) =>
      Math.max(0, Math.round(channel * (1 - clampedAmount)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
