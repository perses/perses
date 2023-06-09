import { useOptimalFontSize } from './calculateFontSize';

jest.mock('../context/ChartsThemeProvider', () => ({
  useChartsTheme: jest.fn().mockReturnValue({
    echartsTheme: {
      textStyle: {
        fontSize: '12',
        fontFamily: 'Lato',
      },
    },
  }),
}));

describe('useOptimalFontSize', () => {
  const mockCanvasContext = {
    font: '',
    measureText: jest.fn().mockReturnValue({ width: 100 }),
  };

  beforeEach(() => {
    document.createElement = jest.fn().mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockCanvasContext),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calculates the optimal font size where width is the constraint', () => {
    const result = useOptimalFontSize({
      text: 'Sample Text',
      fontWeight: 400,
      width: 100,
      height: 600,
    });

    expect(result).toBe(12);
    expect(mockCanvasContext.font).toBe('400 12px Lato');
    expect(mockCanvasContext.measureText).toHaveBeenCalledWith('Sample Text');
  });

  it('calculates the optimal font size where height is the constraint', () => {
    const result = useOptimalFontSize({
      text: 'Sample Text',
      fontWeight: 400,
      width: 600,
      height: 48,
    });

    expect(result).toBe(40);
    expect(mockCanvasContext.font).toBe('400 12px Lato');
    expect(mockCanvasContext.measureText).toHaveBeenCalledWith('Sample Text');
  });

  it('should return the maximum size', () => {
    const result = useOptimalFontSize({
      text: 'Sample Text',
      fontWeight: 400,
      width: 200,
      height: 100,
      maxSize: 20,
    });

    expect(result).toBe(20);
  });
});
