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

import { render, screen, fireEvent } from '@testing-library/react';
import { TimeSeriesChartVisualOptions, VISUAL_CONFIG } from './time-series-chart-model';
import { VisualOptionsEditor } from './VisualOptionsEditor';

describe('VisualOptionsEditor', () => {
  const renderVisualOptionsEditor = (value: TimeSeriesChartVisualOptions, onChange = jest.fn()): void => {
    render(<VisualOptionsEditor value={value} onChange={onChange} />);
  };

  const getLineWidthSlider = (): HTMLElement => {
    return screen.getByTestId(VISUAL_CONFIG.lineWidth.testId);
  };

  it('can update the line width visual option', () => {
    const onChange = jest.fn();
    renderVisualOptionsEditor({ lineWidth: 3, pointRadius: 2 }, onChange);

    expect(screen.getByText(VISUAL_CONFIG.lineWidth.label)).toBeInTheDocument();

    const sliderInput = getLineWidthSlider();

    // MUI Slider computes the return value based on span elements, mock initial position
    sliderInput.getBoundingClientRect = jest.fn(() => {
      return {
        bottom: 200,
        height: 30,
        left: 20,
        right: 500,
        top: 250,
        width: 550,
        x: 20,
        y: 250,
        toJSON: (): Record<string, unknown> => ({}),
      };
    });
    expect(sliderInput).toBeInTheDocument();

    // to move slider and update visual options
    fireEvent.mouseDown(sliderInput, { clientX: 220, clientY: 100 });
    expect(onChange).toHaveBeenCalledWith({ lineWidth: 1.25, pointRadius: 2.75 });
  });
});
