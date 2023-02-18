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

import { ChartsThemeProvider, testChartsTheme } from '@perses-dev/components';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import produce from 'immer';
import { ThresholdOptions } from '../../model';
import { ThresholdsEditor } from './ThresholdsEditor';

describe('ThresholdsEditor', () => {
  const renderThresholdEditor = (thresholds: ThresholdOptions, onChange = jest.fn()) => {
    render(
      <ChartsThemeProvider chartsTheme={testChartsTheme}>
        <ThresholdsEditor thresholds={thresholds} onChange={onChange} />
      </ChartsThemeProvider>
    );
  };

  const thresholds: ThresholdOptions = {
    steps: [
      {
        color: '#ffc107',
        value: 55,
      },
      {
        color: '#ff9f1c',
        value: 65,
      },
    ],
  };

  const onChange = jest.fn();

  afterEach(() => {
    onChange.mockClear();
  });

  it('should add new threshold', () => {
    renderThresholdEditor(thresholds, onChange);
    const addButton = screen.getByLabelText('add threshold');
    userEvent.click(addButton);
    expect(onChange).toHaveBeenCalledWith(
      produce(thresholds, (draft) => {
        draft.steps?.push({ value: 75, color: '#EE6C6C' });
      })
    );
  });

  it('should add new threshold with default value 10 when threshold.steps is empty', () => {
    const thresholds = {
      steps: [],
    };
    renderThresholdEditor(thresholds, onChange);
    const addButton = screen.getByLabelText('add threshold');
    userEvent.click(addButton);
    expect(onChange).toHaveBeenCalledWith({
      steps: [{ value: 10 }],
    });
  });

  it('should delete threshold', () => {
    renderThresholdEditor(thresholds, onChange);
    const deleteButton = screen.getByLabelText('delete threshold T1');
    userEvent.click(deleteButton);
    expect(onChange).toHaveBeenCalledWith(
      produce(thresholds, (draft) => {
        draft.steps?.splice(0, 1);
      })
    );
  });

  it('should trigger onChange when input blurs', async () => {
    renderThresholdEditor(thresholds, onChange);
    const input = await screen.findByLabelText('T1');
    userEvent.clear(input);
    userEvent.type(input, '25');
    await waitFor(() => {
      input.blur();
      expect(onChange).toHaveBeenCalledWith(
        produce(thresholds, (draft) => {
          if (draft.steps && draft.steps[0]) {
            draft.steps[0].value = 25;
          }
        })
      );
    });
  });

  it('should update threshold T1 color', async () => {
    renderThresholdEditor(thresholds, onChange);
    const openColorPickerButton = screen.getByLabelText('change threshold T1 color');
    userEvent.click(openColorPickerButton);
    await screen.findByTestId('threshold color picker');
    const redColorButton = screen.getByLabelText('change color to #EE6C6C');
    userEvent.click(redColorButton);
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        produce(thresholds, (draft) => {
          if (draft.steps && draft.steps[0]) {
            draft.steps[0].color = '#EE6C6C';
          }
        })
      );
    });
  });

  it('should update default color', async () => {
    renderThresholdEditor(thresholds, onChange);
    const openColorPickerButton = screen.getByLabelText('change threshold default color');
    userEvent.click(openColorPickerButton);
    await screen.findByTestId('threshold color picker');
    const colorInput = screen.getByLabelText('enter hex color');
    userEvent.clear(colorInput);
    userEvent.type(colorInput, '6a44eb');
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[0][0]).toStrictEqual(
        produce(thresholds, (draft) => {
          draft.default_color = '#6a4';
        })
      );
      expect(onChange.mock.calls[1][0]).toStrictEqual(
        produce(thresholds, (draft) => {
          draft.default_color = '#6a44eb';
        })
      );
    });
  });

  it('should update threshold mode', () => {
    renderThresholdEditor(thresholds, onChange);
    const percentageButton = screen.getByLabelText('percentage');
    userEvent.click(percentageButton);
    expect(onChange).toHaveBeenCalledWith(
      produce(thresholds, (draft) => {
        draft.mode = 'percentage';
      })
    );

    const absoluteButton = screen.getByLabelText('absolute');
    userEvent.click(absoluteButton);
    expect(onChange).toHaveBeenCalledWith(
      produce(thresholds, (draft) => {
        draft.mode = undefined;
      })
    );
  });
});
