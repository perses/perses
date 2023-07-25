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
import { CalculationSelector, CalculationSelectorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import {
  UnitSelector,
  UnitSelectorProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
  SortSelector,
  SortSelectorProps,
  ModeSelector,
  ModeSelectorProps,
  ModeOption,
  SortOption,
} from '@perses-dev/components';
import { CalculationType, UnitOptions, isPercentUnit } from '@perses-dev/core';
import { Button } from '@mui/material';
import {
  BarChartOptions,
  DEFAULT_UNIT,
  BarChartOptionsEditorProps,
  DEFAULT_SORT,
  DEFAULT_MODE,
} from './bar-chart-model';

export function BarChartOptionsEditorSettings(props: BarChartOptionsEditorProps) {
  const { onChange, value } = props;

  const handleCalculationChange: CalculationSelectorProps['onChange'] = (newCalculation: CalculationType) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: UnitSelectorProps['onChange'] = (newUnit: UnitOptions) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.unit = newUnit;
      })
    );
  };

  const handleSortChange: SortSelectorProps['onChange'] = (newSort: SortOption) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.sort = newSort;
      })
    );
  };

  const handleModeChange: ModeSelectorProps['onChange'] = (newMode: ModeOption) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.mode = newMode;
      })
    );
  };

  const handleResetSettings: React.MouseEventHandler<HTMLButtonElement> = () => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.calculation = 'LastNumber';
        draft.unit = DEFAULT_UNIT;
        draft.sort = DEFAULT_SORT;
        draft.mode = DEFAULT_MODE;
      })
    );
  };

  // ensures decimal_places defaults to correct value
  const unit = merge({}, DEFAULT_UNIT, value.unit);

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Misc">
          <UnitSelector value={unit} onChange={handleUnitChange} disabled={value.mode === 'percentage'} />
          <CalculationSelector value={value.calculation} onChange={handleCalculationChange} />
          <SortSelector value={value.sort} onChange={handleSortChange} />
          <ModeSelector value={value.mode} onChange={handleModeChange} disablePercentageMode={isPercentUnit(unit)} />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Reset Settings">
          <Button variant="outlined" color="secondary" onClick={handleResetSettings}>
            Reset To Defaults
          </Button>
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
