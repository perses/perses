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
import { BarChartOptions } from './bar-chart-model';
import { BarChartOptionsEditorSettings } from './BarChartOptionsEditorSettings';

describe('BarChartOptionsEditorSettings', () => {
  const renderBarChartOptionsEditorSettings = (value?: BarChartOptions, onChange = jest.fn()) => {
    render(
      <ChartsProvider chartsTheme={testChartsTheme}>
        <BarChartOptionsEditorSettings
          value={
            value ?? {
              unit: {
                kind: 'Decimal',
              },
              calculation: 'First',
              sort: 'desc',
              mode: 'value',
            }
          }
          onChange={onChange}
        />
      </ChartsProvider>
    );
  };

  it('can modify unit', () => {
    const onChange = jest.fn();
    renderBarChartOptionsEditorSettings(undefined, onChange);
    const unitSelector = screen.getByRole('combobox', { name: 'Unit' });
    userEvent.click(unitSelector);
    const yearOption = screen.getByRole('option', {
      name: 'Years',
    });
    userEvent.click(yearOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        unit: {
          kind: 'Years',
        },
      })
    );
  });

  it('can modify calculation', () => {
    const onChange = jest.fn();
    renderBarChartOptionsEditorSettings(undefined, onChange);
    const calcSelector = screen.getByRole('combobox', { name: 'Calculation' });
    userEvent.click(calcSelector);
    const meanOption = screen.getByRole('option', {
      name: /Average/,
    });
    userEvent.click(meanOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        calculation: 'Mean',
      })
    );
  });

  it('can modify sort order', () => {
    const onChange = jest.fn();
    renderBarChartOptionsEditorSettings(undefined, onChange);
    const sortSelector = screen.getByRole('combobox', { name: 'Sort' });
    userEvent.click(sortSelector);
    const ascendingOption = screen.getByRole('option', {
      name: /Ascending/,
    });
    userEvent.click(ascendingOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'asc',
      })
    );
  });

  it('can modify mode', () => {
    const onChange = jest.fn();
    renderBarChartOptionsEditorSettings(undefined, onChange);
    const modeSelector = screen.getByRole('combobox', { name: 'Mode' });
    userEvent.click(modeSelector);
    const percentageOption = screen.getByRole('option', {
      name: /Percentage/,
    });
    userEvent.click(percentageOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'percentage',
      })
    );
  });

  it('percentage mode is disabled when unit is percent', () => {
    renderBarChartOptionsEditorSettings({
      unit: {
        kind: 'Percent',
      },
      calculation: 'First',
      sort: 'desc',
      mode: 'value',
    });
    const modeSelector = screen.getByRole('combobox', { name: 'Mode' });
    userEvent.click(modeSelector);
    const percentageOption = screen.getByRole('option', {
      name: /Percentage/,
    });
    expect(percentageOption).toHaveAttribute('aria-disabled', 'true');
  });

  it('unit selector is disabled when mode is percentage', () => {
    renderBarChartOptionsEditorSettings({
      unit: {
        kind: 'Decimal',
      },
      calculation: 'First',
      sort: 'desc',
      mode: 'percentage',
    });
    const unitSelector = screen.getByRole('combobox', { name: 'Unit' });
    expect(unitSelector).toBeDisabled;
  });
});
