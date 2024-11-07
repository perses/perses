export const fallbackColor = '#1f77b4';

export function getColorForValue(value: number | string, baseColor: string): string {
  // Validate base color
  if (!baseColor.match(/^#[0-9A-Fa-f]{6}$/)) {
    baseColor = fallbackColor;
  }

  try {
    const [baseH, baseS, baseL] = hexToHSL(baseColor);

    // Ensure numeric values are valid
    if (isNaN(baseH) || isNaN(baseS) || isNaN(baseL)) {
      throw new Error('Invalid HSL values');
    }

    // Create deterministic hash
    const hash = String(value)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const hueStep = 60;
    const lightnessVariation = 15;

    const hueOffset = (hash % 6) * hueStep; // 6 segments of 60° each
    const newH = (baseH + hueOffset) % 360;
    const newL = baseL + (hash % 2 ? lightnessVariation : -lightnessVariation);

    // Keep saturation high for better distinction
    const newS = Math.min(baseS + 10, 90);
    const color = hslToHex(
      Math.abs(newH),
      Math.min(Math.max(newS, 50), 90), // Keep saturation 50-90%
      Math.min(Math.max(newL, 30), 70) // Keep lightness 30-70%
    );

    // Validate generated color
    if (!color.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new Error('Invalid generated color');
    }

    return color;
  } catch (error) {
    return fallbackColor;
  }
}

export function getColorsForValues(uniqueValues: Array<number | string>, themeColors: string[]): string[] {
  // If we have enough theme colors, use them
  if (themeColors.length >= uniqueValues.length) {
    return themeColors.slice(0, uniqueValues.length);
  }

  // Use theme colors first, then generate additional ones
  return uniqueValues.map((value, index) => {
    if (index < themeColors.length) {
      return themeColors[index] || fallbackColor;
    }
    return getColorForValue(value, themeColors[0] || fallbackColor);
  });
}

export function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
