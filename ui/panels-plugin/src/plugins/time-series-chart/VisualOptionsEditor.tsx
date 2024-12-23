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
import { Slider, Switch, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { OptionsEditorControl, OptionsEditorGroup, SettingsAutocomplete } from '@perses-dev/components';
import { ReactElement } from 'react';
import {
  DEFAULT_AREA_OPACITY,
  DEFAULT_CONNECT_NULLS,
  DEFAULT_LINE_WIDTH,
  DEFAULT_POINT_RADIUS,
  POINT_SIZE_OFFSET,
  STACK_CONFIG,
  StackOptions,
  STACK_OPTIONS,
  VISUAL_CONFIG,
  TimeSeriesChartVisualOptions,
} from './time-series-chart-model';

export interface VisualOptionsEditorProps {
  value: TimeSeriesChartVisualOptions;
  onChange: (visual: TimeSeriesChartVisualOptions) => void;
}

export function VisualOptionsEditor({ value, onChange }: VisualOptionsEditorProps): ReactElement {
  const handleLineWidthChange = (_: Event, sliderValue: number | number[]): void => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    const symbolSize = newValue !== undefined ? newValue + POINT_SIZE_OFFSET : DEFAULT_POINT_RADIUS;
    onChange(
      produce(value, (draft) => {
        draft.lineWidth = newValue;
        draft.pointRadius = symbolSize;
      })
    );
  };

  const handleAreaOpacityChange = (_: Event, sliderValue: number | number[]): void => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    onChange(
      produce(value, (draft) => {
        draft.areaOpacity = newValue;
      })
    );
  };

  const currentStack: StackOptions = value.stack ?? 'none';
  const stackConfig = STACK_CONFIG[currentStack];

  return (
    <OptionsEditorGroup title="Visual">
      <OptionsEditorControl
        label="Display"
        control={
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={value.display}
            onChange={(__, newValue) => {
              onChange({
                ...value,
                display: newValue,
              });
            }}
          >
            <ToggleButton
              value="line"
              selected={value.display === undefined || value.display === 'line'}
              aria-label="display line series"
            >
              Line
            </ToggleButton>
            <ToggleButton value="bar" aria-label="display bar series">
              Bar
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.lineWidth.label}
        control={
          <Slider
            data-testid={VISUAL_CONFIG.lineWidth.testId}
            value={value.lineWidth ?? DEFAULT_LINE_WIDTH}
            valueLabelDisplay="auto"
            step={VISUAL_CONFIG.lineWidth.step}
            marks
            min={VISUAL_CONFIG.lineWidth.min}
            max={VISUAL_CONFIG.lineWidth.max}
            disabled={value.display === 'bar'}
            onChange={handleLineWidthChange}
          />
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.areaOpacity.label}
        control={
          <Slider
            data-testid={VISUAL_CONFIG.areaOpacity.testId}
            value={value.areaOpacity ?? DEFAULT_AREA_OPACITY}
            valueLabelDisplay="auto"
            step={VISUAL_CONFIG.areaOpacity.step}
            marks
            min={VISUAL_CONFIG.areaOpacity.min}
            max={VISUAL_CONFIG.areaOpacity.max}
            disabled={value.display === 'bar'}
            onChange={handleAreaOpacityChange}
          />
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.stack.label}
        control={
          <SettingsAutocomplete
            value={{
              ...stackConfig,
              id: currentStack,
            }}
            options={STACK_OPTIONS}
            onChange={(__, newValue) => {
              const updatedValue: TimeSeriesChartVisualOptions = {
                ...value,
                stack: newValue.id === 'none' ? undefined : newValue.id, // stack is optional so remove property when 'None' is selected
              };
              // stacked area chart preset to automatically set area under a curve shading
              if (newValue.id === 'all' && !value.areaOpacity) {
                updatedValue.areaOpacity = 0.3;
              }
              onChange(updatedValue);
            }}
            disabled={value === undefined}
            disableClearable
          ></SettingsAutocomplete>
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.connectNulls.label}
        control={
          <Switch
            checked={value.connectNulls ?? DEFAULT_CONNECT_NULLS}
            disabled={value.display === 'bar'}
            onChange={(e) => {
              onChange({
                ...value,
                connectNulls: e.target.checked,
              });
            }}
          />
        }
      />
    </OptionsEditorGroup>
  );
}
