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

import { produce } from 'immer';
import { Switch, SwitchProps, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { CalculationSelector, CalculationSelectorProps, DEFAULT_CALCULATION } from '@perses-dev/plugin-system';
import {
  UnitSelector,
  UnitSelectorProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
  OptionsEditorControl,
  ThresholdsEditorProps,
  ThresholdsEditor,
} from '@perses-dev/components';
import { StatChartOptions, StatChartOptionsEditorProps } from './stat-chart-model';

export function StatChartOptionsEditorSettings(props: StatChartOptionsEditorProps) {
  const { onChange, value } = props;

  const handleCalculationChange: CalculationSelectorProps['onChange'] = (newCalculation) => {
    onChange(
      produce(value, (draft: StatChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: UnitSelectorProps['onChange'] = (newUnit) => {
    onChange(
      produce(value, (draft: StatChartOptions) => {
        draft.unit = newUnit;
      })
    );
  };

  const handleSparklineChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    onChange(
      produce(value, (draft: StatChartOptions) => {
        // For now, setting to an empty object when checked, so the stat chart
        // uses the default chart color and line styles. In the future, this
        // will likely be configurable in the UI.
        draft.sparkline = checked ? {} : undefined;
      })
    );
  };

  const handleThresholdsChange: ThresholdsEditorProps['onChange'] = (thresholds) => {
    onChange(
      produce(value, (draft: StatChartOptions) => {
        draft.thresholds = thresholds;
      })
    );
  };

  const handleTextAlignment = (event: React.MouseEvent, alignment: StatChartOptions['textAlignment']) => {
    onChange(
      produce(value, (draft: StatChartOptions) => {
        draft.textAlignment = alignment === 'center' ? 'center' : undefined;
      })
    );
  };

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Misc">
          <OptionsEditorControl
            label="Sparkline"
            control={<Switch checked={!!value.sparkline} onChange={handleSparklineChange} />}
          />
          <UnitSelector value={value.unit} onChange={handleUnitChange} />
          <CalculationSelector value={value.calculation ?? DEFAULT_CALCULATION} onChange={handleCalculationChange} />
        </OptionsEditorGroup>
        <OptionsEditorGroup title="Text">
          <OptionsEditorControl
            label="Alignment"
            control={
              <ToggleButtonGroup
                exclusive
                value={value.textAlignment ?? 'auto'}
                onChange={handleTextAlignment}
                sx={{ height: '36px', marginLeft: 'auto' }}
              >
                <ToggleButton aria-label="absolute" value="auto" sx={{ fontWeight: 500 }}>
                  Auto
                </ToggleButton>
                <ToggleButton aria-label="percent" value="center" sx={{ fontWeight: 500 }}>
                  Center
                </ToggleButton>
              </ToggleButtonGroup>
            }
          />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <ThresholdsEditor disablePercentMode thresholds={value.thresholds} onChange={handleThresholdsChange} />
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
