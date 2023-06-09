/**
 * Calculate an optimal font size given available space
 */

interface CalculateFontSize {
  text: string;
  fontWeight: number;
  width: number;
  height: number;
  lineHeight?: number; // default is 1.2
  maxSize?: number;
}

const DEFAULT_LINE_HEIGHT = 1.2;

export const calculateFontSize = ({ text, fontWeight, width, height, lineHeight, maxSize }: CalculateFontSize) => {
  const context = document.createElement('canvas').getContext('2d');
  if (context === null) {
    throw new Error('Canvas context is null');
  }

  const lineHeightRatio = lineHeight ?? DEFAULT_LINE_HEIGHT;

  // set the font on the canvas context before measuring text
  const fontStyle = `${fontWeight} 12px 'Inter'`;
  context.font = fontStyle;

  const textMetrics: TextMetrics = context.measureText(text);

  // how much bigger than 12px can we make it while staying within our width constraints
  const fontSizeBasedOnWidth = (width / textMetrics.width + 2) * 12;
  const fontSizeBasedOnHeight = height / lineHeightRatio;

  // final fontSize
  const optimalSize = Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth);
  return Math.min(optimalSize, maxSize ?? optimalSize);
};
