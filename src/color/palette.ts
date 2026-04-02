export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function getForegroundColor(backgroundHex: string): string {
  return getRelativeLuminance(backgroundHex) > 0.5 ? "#000000" : "#ffffff";
}

export function getInactiveBackground(hex: string): string {
  const clean = hex.replace("#", "");
  return `#${clean}99`;
}

export function getNextColor(
  palette: string[],
  usedColors: string[],
): string {
  // Find first palette color not currently in use
  for (const color of palette) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  // All used — cycle based on count
  return palette[usedColors.length % palette.length];
}
