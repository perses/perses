// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
      lineHeight: 1.2,
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
      lineHeight: 1.2,
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
      lineHeight: 1.2,
    });

    expect(result).toBe(20);
  });
});
