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

import { Button } from '@mui/material';
import {
  FormatControls,
  FormatControlsProps,
  ModeOption,
  ModeSelector,
  ModeSelectorProps,
  OptionsEditorColumn,
  OptionsEditorGrid,
  OptionsEditorGroup,
  SortOption,
  SortSelector,
  SortSelectorProps,
} from '@perses-dev/components';
import { CalculationType, DEFAULT_CALCULATION, FormatOptions, isPercentUnit } from '@perses-dev/core';
import { CalculationSelector, CalculationSelectorProps } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import merge from 'lodash/merge';
import { MouseEventHandler, ReactElement } from 'react';
import {
  BarChartOptions,
  BarChartOptionsEditorProps,
  DEFAULT_FORMAT,
  DEFAULT_MODE,
  DEFAULT_SORT,
} from './bar-chart-model';

export function BarChartOptionsEditorSettings(props: BarChartOptionsEditorProps): ReactElement {
  const { onChange, value } = props;

  const handleCalculationChange: CalculationSelectorProps['onChange'] = (newCalculation: CalculationType) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: FormatControlsProps['onChange'] = (newFormat: FormatOptions) => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.format = newFormat;
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

  const handleResetSettings: MouseEventHandler<HTMLButtonElement> = () => {
    onChange(
      produce(value, (draft: BarChartOptions) => {
        draft.calculation = DEFAULT_CALCULATION;
        draft.format = DEFAULT_FORMAT;
        draft.sort = DEFAULT_SORT;
        draft.mode = DEFAULT_MODE;
      })
    );
  };

  // ensures decimalPlaces defaults to correct value
  const format = merge({}, DEFAULT_FORMAT, value.format);

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Misc">
          <FormatControls value={format} onChange={handleUnitChange} disabled={value.mode === 'percentage'} />
          <CalculationSelector value={value.calculation} onChange={handleCalculationChange} />
          <SortSelector value={value.sort} onChange={handleSortChange} />
          <ModeSelector value={value.mode} onChange={handleModeChange} disablePercentageMode={isPercentUnit(format)} />
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
