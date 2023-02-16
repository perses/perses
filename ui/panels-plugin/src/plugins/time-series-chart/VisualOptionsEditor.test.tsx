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
import userEvent from '@testing-library/user-event';
import { DEFAULT_VISUAL, VisualOptions, VISUAL_CONFIG } from './time-series-chart-model';
import { VisualOptionsEditor } from './VisualOptionsEditor';

describe('VisualOptionsEditor', () => {
  const renderVisualOptionsEditor = (value: VisualOptions, onChange = jest.fn()) => {
    render(<VisualOptionsEditor value={value} onChange={onChange} />);
  };

  const getLineWidthSlider = () => {
    return screen.getByTestId(VISUAL_CONFIG.line_width.testId);
  };

  const getAreaShadingSwitch = () => {
    return screen.getByRole('checkbox', { name: VISUAL_CONFIG.area_shading.label });
  };

  it('can update the line width visual option', () => {
    const onChange = jest.fn();
    renderVisualOptionsEditor({ line_width: 3, point_radius: 2 }, onChange);

    expect(screen.getByText(VISUAL_CONFIG.line_width.label)).toBeInTheDocument();

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
        toJSON: () => ({}),
      };
    });
    expect(sliderInput).toBeInTheDocument();

    // to move slider and update visual options
    fireEvent.mouseDown(sliderInput, { clientX: 220, clientY: 100 });
    expect(onChange).toHaveBeenCalledWith({ line_width: 1.25, point_radius: 2 });
  });

  it('can change area shading by clicking', () => {
    const onChange = jest.fn();
    renderVisualOptionsEditor(DEFAULT_VISUAL, onChange);

    userEvent.click(getAreaShadingSwitch());

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_VISUAL, area_shading: !DEFAULT_VISUAL.area_shading });
  });
});
