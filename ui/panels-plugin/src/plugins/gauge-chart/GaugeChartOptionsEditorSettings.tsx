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

import merge from 'lodash/merge';
import { TextField } from '@mui/material';
import { CalculationSelector, CalculationSelectorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import {
  FormatControls,
  FormatControlsProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
  OptionsEditorControl,
  ThresholdsEditor,
} from '@perses-dev/components';
import { ThresholdOptions } from '@perses-dev/core';
import { ReactElement } from 'react';
import {
  GaugeChartOptions,
  DEFAULT_FORMAT,
  DEFAULT_MAX_PERCENT,
  DEFAULT_MAX_PERCENT_DECIMAL,
  GaugeChartOptionsEditorProps,
} from './gauge-chart-model';

export function GaugeChartOptionsEditorSettings(props: GaugeChartOptionsEditorProps): ReactElement {
  const { onChange, value } = props;

  const handleCalculationChange: CalculationSelectorProps['onChange'] = (newCalculation) => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: FormatControlsProps['onChange'] = (newFormat) => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.format = newFormat;
      })
    );
  };

  // ensures decimalPlaces defaults to correct value
  const format = merge({}, DEFAULT_FORMAT, value.format);

  // max only needs to be set explicitly for units other than percent and percent-decimal
  let maxPlaceholder = 'Enter value';
  if (format.unit === 'percent') {
    maxPlaceholder = DEFAULT_MAX_PERCENT.toString();
  } else if (format.unit === 'percent-decimal') {
    maxPlaceholder = DEFAULT_MAX_PERCENT_DECIMAL.toString();
  }

  const handleThresholdsChange = (thresholds: ThresholdOptions): void => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.thresholds = thresholds;
      })
    );
  };

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Misc">
          <FormatControls value={format} onChange={handleUnitChange} />
          <CalculationSelector value={value.calculation} onChange={handleCalculationChange} />
          <OptionsEditorControl
            label="Max"
            control={
              <TextField
                type="number"
                value={value.max ?? ''}
                onChange={(e) => {
                  // ensure empty value resets to undef to allow chart to calculate max
                  const newValue = e.target.value ? Number(e.target.value) : undefined;
                  onChange(
                    produce(value, (draft: GaugeChartOptions) => {
                      draft.max = newValue;
                    })
                  );
                }}
                placeholder={maxPlaceholder}
              />
            }
          />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <ThresholdsEditor thresholds={value.thresholds} onChange={handleThresholdsChange} />
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
