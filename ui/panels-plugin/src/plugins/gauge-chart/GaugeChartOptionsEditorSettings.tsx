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

import { merge } from 'lodash-es';
import { CalculationSelector, CalculationSelectorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { DEFAULT_CALCULATION } from '@perses-dev/plugin-system';
import {
  UnitSelector,
  UnitSelectorProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
} from '@perses-dev/components';
import { GaugeChartOptionsEditorProps } from './GaugeChartOptionsEditor';
import { GaugeChartOptions, DEFAULT_UNIT } from './gauge-chart-model';

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

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Misc">
          <UnitSelector value={unit} onChange={handleUnitChange} />
          <CalculationSelector value={value.calculation ?? DEFAULT_CALCULATION} onChange={handleCalculationChange} />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
