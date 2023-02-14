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

import { merge } from 'lodash-es';
import { TextField } from '@mui/material';
import {
  CalculationSelector,
  CalculationSelectorProps,
  ThresholdOptions,
  ThresholdsEditor,
} from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { DEFAULT_CALCULATION } from '@perses-dev/plugin-system';
import {
  UnitSelector,
  UnitSelectorProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
  OptionsEditorControl,
} from '@perses-dev/components';
import {
  GaugeChartOptions,
  DEFAULT_UNIT,
  DEFAULT_MAX_PERCENT,
  DEFAULT_MAX_PERCENT_DECIMAL,
  GaugeChartOptionsEditorProps,
} from './gauge-chart-model';

export function GaugeChartOptionsEditorSettings(props: GaugeChartOptionsEditorProps) {
  const { onChange, value } = props;

  const handleCalculationChange: CalculationSelectorProps['onChange'] = (newCalculation) => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: UnitSelectorProps['onChange'] = (newUnit) => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.unit = newUnit;
      })
    );
  };

  // ensures decimal_places defaults to correct value
  const unit = merge({}, DEFAULT_UNIT, value.unit);

  // max only needs to be set explicitly for units other than Percent and PercentDecimal
  let maxPlaceholder = 'Enter value';
  if (unit.kind === 'Percent') {
    maxPlaceholder = DEFAULT_MAX_PERCENT.toString();
  } else if (unit.kind === 'PercentDecimal') {
    maxPlaceholder = DEFAULT_MAX_PERCENT_DECIMAL.toString();
  }

  const handleThresholdsChange = (thresholds: ThresholdOptions) => {
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
          <UnitSelector value={unit} onChange={handleUnitChange} />
          <CalculationSelector value={value.calculation ?? DEFAULT_CALCULATION} onChange={handleCalculationChange} />
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
