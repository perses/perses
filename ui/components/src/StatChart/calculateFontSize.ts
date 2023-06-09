/**
 * Calculate an optimal font size given available space
 */

import { useChartsTheme } from '../context/ChartsThemeProvider';

interface CalculateFontSize {
  text: string;
  fontWeight: number;
  width: number;
  height: number;
  lineHeight?: number; // default is 1.2
  maxSize?: number;
}

const DEFAULT_LINE_HEIGHT = 1.2;

let canvasContext: CanvasRenderingContext2D | null;

function useCanvasContext() {
  if (!canvasContext) {
    canvasContext = document.createElement('canvas').getContext('2d');
    if (canvasContext === null) {
      throw new Error('Canvas context is null.');
    }
  }
  return canvasContext;
}

/**
 * Calculates the optimal font size given available space
 */
export function useOptimalFontSize({ text, fontWeight, width, height, lineHeight, maxSize }: CalculateFontSize) {
  const ctx = useCanvasContext();
  const chartsTheme = useChartsTheme();

  const textStyle = chartsTheme.echartsTheme.textStyle;
  const fontSize = Number(textStyle?.fontSize) ?? 12;
  const fontFamily = textStyle?.fontFamily ?? 'Lato';

  // set the font on the canvas context before measuring text
  const fontStyle = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.font = fontStyle;
  const textMetrics: TextMetrics = ctx.measureText(text);

  // calculate the optimal font size given the available width and height
  const fontSizeBasedOnWidth = (width / textMetrics.width) * fontSize;
  const fontSizeBasedOnHeight = height / (lineHeight ?? DEFAULT_LINE_HEIGHT);

  // return the smaller font size
  const finalFontSize = Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth);
  return maxSize ? Math.min(finalFontSize, maxSize) : finalFontSize;
}
