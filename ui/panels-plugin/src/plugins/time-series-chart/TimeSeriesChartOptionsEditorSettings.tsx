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

import { MenuItem, Select, SelectProps, Switch } from '@mui/material';
import { produce } from 'immer';
import {
  UnitSelector,
  UnitSelectorProps,
  OptionsEditorGroup,
  OptionsEditorGrid,
  OptionsEditorColumn,
  OptionsEditorControl,
} from '@perses-dev/components';
import { TimeSeriesChartOptionsEditorProps } from './TimeSeriesChartOptionsEditor';
import {
  TimeSeriesChartOptions,
  DEFAULT_LEGEND,
  LEGEND_POSITIONS,
  LegendPosition,
  DEFAULT_UNIT,
  DEFAULT_VISUAL,
} from './time-series-chart-model';
import { VisualOptionsEditor, VisualOptionsEditorProps } from './VisualOptionsEditor';

export function TimeSeriesChartOptionsEditorSettings(props: TimeSeriesChartOptionsEditorProps) {
  const { onChange, value } = props;

  const handleUnitChange: UnitSelectorProps['onChange'] = (newUnit) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.unit = newUnit;
      })
    );
  };

  const handleVisualChange: VisualOptionsEditorProps['onChange'] = (newVisual) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.visual = newVisual;
      })
    );
  };

  // TODO: separate legend editor component
  const handleLegendShowChange = (show: boolean) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        draft.legend = show ? DEFAULT_LEGEND : undefined;
      })
    );
  };

  const handleLegendPositionChange: SelectProps<LegendPosition>['onChange'] = (e) => {
    onChange(
      produce(value, (draft: TimeSeriesChartOptions) => {
        // TODO: type cast should not be necessary
        if (draft.legend) {
          draft.legend.position = e.target.value as LegendPosition;
        }
      })
    );
  };

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Legend">
          <OptionsEditorControl
            label="Show"
            control={
              <Switch
                checked={value.legend !== undefined}
                onChange={(e) => {
                  handleLegendShowChange(e.target.checked);
                }}
              />
            }
          />
          <OptionsEditorControl
            label="Position"
            control={
              <Select
                sx={{ maxWidth: 100 }}
                value={value.legend && value.legend.position ? value.legend.position : DEFAULT_LEGEND.position}
                onChange={handleLegendPositionChange}
              >
                {LEGEND_POSITIONS.map((position) => (
                  // TODO: add LEGEND_CONFIG with display names to capitalize position values
                  <MenuItem key={position} value={position}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            }
          />
        </OptionsEditorGroup>
        <VisualOptionsEditor value={value.visual ?? DEFAULT_VISUAL} onChange={handleVisualChange} />
      </OptionsEditorColumn>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Y Axis">
          <UnitSelector value={value.unit ?? DEFAULT_UNIT} onChange={handleUnitChange} />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
