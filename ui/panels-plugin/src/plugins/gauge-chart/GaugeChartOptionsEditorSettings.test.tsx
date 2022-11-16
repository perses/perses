// Copyright 2022 The Perses Authors
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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GaugeChartOptions } from './gauge-chart-model';
import { GaugeChartOptionsEditorSettings } from './GaugeChartOptionsEditorSettings';

const MOCK_QUERY = {
  kind: 'TimeSeriesQuery',
  spec: {
    plugin: {
      kind: 'PrometheusTimeSeriesQuery',
      spec: {
        query: '',
      },
    },
  },
} as const;

describe('GaugeChartOptionsEditorSettings', () => {
  const renderGaugeChartOptionsEditorSettings = (value: GaugeChartOptions, onChange = jest.fn()) => {
    render(<GaugeChartOptionsEditorSettings value={value} onChange={onChange} />);
  };

  it('can modify unit', () => {
    const onChange = jest.fn();
    renderGaugeChartOptionsEditorSettings(
      {
        unit: {
          kind: 'Decimal',
        },
        calculation: 'First',
        query: MOCK_QUERY,
      },
      onChange
    );
    const unitSelector = screen.getByRole('combobox', { name: 'Units' });
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
    renderGaugeChartOptionsEditorSettings(
      {
        unit: {
          kind: 'Days',
        },
        calculation: 'First',
        query: MOCK_QUERY,
      },
      onChange
    );
    const calcSelector = screen.getByRole('combobox', { name: 'Calculation' });
    userEvent.click(calcSelector);
    const meanOption = screen.getByRole('option', {
      name: 'Mean',
    });
    userEvent.click(meanOption);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        calculation: 'Mean',
      })
    );
  });
});
