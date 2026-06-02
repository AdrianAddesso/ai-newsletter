export function resolveRenderableBackgroundImage(
  backgroundImage: string | null | undefined,
  editMode: boolean,
  placeholderImageUrl: string,
): string | null {
  if (backgroundImage === null) {
    return null;
  }

  if (backgroundImage === undefined) {
    return editMode ? placeholderImageUrl : null;
  }

  return backgroundImage;
}

export function buildBackgroundImageSx(
  backgroundImage: string | null,
): {
  backgroundImage?: string;
  backgroundSize?: "cover";
  backgroundRepeat?: "no-repeat";
  backgroundPosition?: "center";
} {
  if (!backgroundImage) {
    return {};
  }

  return {
    backgroundImage: `url("${backgroundImage}")`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };
}
