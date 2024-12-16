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

import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatChartOptions } from './stat-chart-model';
import { StatChartOptionsEditorSettings } from './StatChartOptionsEditorSettings';

describe('StatChartOptionsEditorSettings', () => {
  const renderStatChartOptionsEditorSettings = (value: StatChartOptions, onChange = jest.fn()): void => {
    render(
      <ChartsProvider chartsTheme={testChartsTheme}>
        <StatChartOptionsEditorSettings value={value} onChange={onChange} />
      </ChartsProvider>
    );
  };

  it('can modify unit', () => {
    const onChange = jest.fn();
    renderStatChartOptionsEditorSettings(
      {
        format: {
          unit: 'minutes',
        },
        calculation: 'last',
      },
      onChange
    );
    const unitSelector = screen.getByRole('combobox', { name: 'Unit' });
    userEvent.click(unitSelector);
    const percentOption = screen.getByRole('option', {
      name: 'Percent (0-100)',
    });
    userEvent.click(percentOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        format: {
          unit: 'percent',
        },
      })
    );
  });

  it('can modify calculation', () => {
    const onChange = jest.fn();
    renderStatChartOptionsEditorSettings(
      {
        format: {
          unit: 'days',
        },
        calculation: 'sum',
      },
      onChange
    );
    const calcSelector = screen.getByRole('combobox', { name: 'Calculation' });
    userEvent.click(calcSelector);
    const firstOption = screen.getByRole('option', {
      name: /First \*/,
    });
    userEvent.click(firstOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        calculation: 'first-number',
      })
    );
  });

  it('can enable a sparkline', () => {
    const onChange = jest.fn();
    renderStatChartOptionsEditorSettings(
      {
        format: {
          unit: 'days',
        },
        calculation: 'sum',
      },
      onChange
    );
    const sparklineSwitch = screen.getByRole('checkbox', { name: 'Sparkline' });
    expect(sparklineSwitch).not.toBeChecked();
    userEvent.click(sparklineSwitch);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sparkline: {},
      })
    );
  });

  it('can disable a sparkline', () => {
    const onChange = jest.fn();
    renderStatChartOptionsEditorSettings(
      {
        format: {
          unit: 'days',
        },
        calculation: 'sum',
        sparkline: {
          color: '#ff0000',
        },
      },
      onChange
    );
    const sparklineSwitch = screen.getByRole('checkbox', { name: 'Sparkline' });
    expect(sparklineSwitch).toBeChecked();
    userEvent.click(sparklineSwitch);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sparkline: undefined,
      })
    );
  });
});
