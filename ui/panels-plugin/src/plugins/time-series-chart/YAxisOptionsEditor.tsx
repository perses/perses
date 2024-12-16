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

import { Switch, TextField } from '@mui/material';
import { OptionsEditorControl, OptionsEditorGroup, FormatControls } from '@perses-dev/components';
import { ReactElement } from 'react';
import { DEFAULT_FORMAT, DEFAULT_Y_AXIS, TimeSeriesChartYAxisOptions, Y_AXIS_CONFIG } from './time-series-chart-model';

export interface YAxisOptionsEditorProps {
  value: TimeSeriesChartYAxisOptions;
  onChange: (yAxis: TimeSeriesChartYAxisOptions) => void;
}

export function YAxisOptionsEditor({ value, onChange }: YAxisOptionsEditorProps): ReactElement {
  return (
    <OptionsEditorGroup title="Y Axis">
      <OptionsEditorControl
        label="Show"
        control={
          <Switch
            checked={value.show ?? DEFAULT_Y_AXIS.show}
            onChange={(e): void => {
              onChange({
                ...value,
                show: e.target.checked,
              });
            }}
          />
        }
      />
      <FormatControls
        value={value.format ?? DEFAULT_FORMAT}
        onChange={(newFormat): void =>
          onChange({
            ...value,
            format: newFormat,
          })
        }
      />
      <OptionsEditorControl
        label={Y_AXIS_CONFIG.label.label}
        control={
          <TextField
            value={value.label ?? ''}
            inputProps={{ 'aria-label': 'enter y axis label' }}
            onChange={(e) =>
              onChange({
                ...value,
                label: e.target.value,
              })
            }
            placeholder="Default"
          />
        }
      />
      <OptionsEditorControl
        label={Y_AXIS_CONFIG.min.label}
        control={
          <TextField
            type="number"
            value={value.min ?? ''}
            onChange={(e) => {
              // ensure empty value resets to undef to allow chart to calculate min
              const newValue = e.target.value ? Number(e.target.value) : undefined;
              onChange({
                ...value,
                min: newValue,
              });
            }}
            placeholder="Default"
          />
        }
      />
      <OptionsEditorControl
        label={Y_AXIS_CONFIG.max.label}
        control={
          <TextField
            type="number"
            value={value.max ?? ''}
            onChange={(e) => {
              // ensure empty value resets to undef to allow chart to calculate max
              const newValue = e.target.value ? Number(e.target.value) : undefined;
              onChange({
                ...value,
                max: newValue,
              });
            }}
            placeholder="Default"
          />
        }
      />
    </OptionsEditorGroup>
  );
}
