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

import { Autocomplete, Slider, Switch, TextField } from '@mui/material';
import { OptionsEditorControl, OptionsEditorGroup } from '@perses-dev/components';
import {
  DEFAULT_AREA_OPACITY,
  DEFAULT_CONNECT_NULLS,
  DEFAULT_LINE_WIDTH,
  DEFAULT_POINT_RADIUS,
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

export function VisualOptionsEditor({ value, onChange }: VisualOptionsEditorProps) {
  const handlePointRadiusChange = (_: Event, sliderValue: number | number[]) => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    onChange({
      ...value,
      point_radius: newValue,
    });
  };

  const handleLineWidthChange = (_: Event, sliderValue: number | number[]) => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    onChange({
      ...value,
      line_width: newValue,
    });
  };

  const handleAreaOpacityChange = (_: Event, sliderValue: number | number[]) => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    onChange({
      ...value,
      area_opacity: newValue,
    });
  };

  const currentStack: StackOptions = value.stack ?? 'None';
  const stackConfig = STACK_CONFIG[currentStack];

  return (
    <OptionsEditorGroup title="Visual">
      <OptionsEditorControl
        label={VISUAL_CONFIG.point_radius.label}
        control={
          <Slider
            data-testid={VISUAL_CONFIG.point_radius.testId}
            value={value.point_radius ?? DEFAULT_POINT_RADIUS}
            valueLabelDisplay="auto"
            step={VISUAL_CONFIG.point_radius.step}
            marks
            min={VISUAL_CONFIG.point_radius.min}
            max={VISUAL_CONFIG.point_radius.max}
            onChange={handlePointRadiusChange}
          />
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.line_width.label}
        control={
          <Slider
            data-testid={VISUAL_CONFIG.line_width.testId}
            value={value.line_width ?? DEFAULT_LINE_WIDTH}
            valueLabelDisplay="auto"
            step={VISUAL_CONFIG.line_width.step}
            marks
            min={VISUAL_CONFIG.line_width.min}
            max={VISUAL_CONFIG.line_width.max}
            onChange={handleLineWidthChange}
          />
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.area_opacity.label}
        control={
          <Slider
            data-testid={VISUAL_CONFIG.area_opacity.testId}
            value={value.area_opacity ?? DEFAULT_AREA_OPACITY}
            valueLabelDisplay="auto"
            step={VISUAL_CONFIG.area_opacity.step}
            marks
            min={VISUAL_CONFIG.area_opacity.min}
            max={VISUAL_CONFIG.area_opacity.max}
            onChange={handleAreaOpacityChange}
          />
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.stack.label}
        control={
          <Autocomplete
            value={{
              ...stackConfig,
              id: currentStack,
            }}
            options={STACK_OPTIONS}
            getOptionDisabled={(option) => option.label === 'Percent'} // TODO: enable option after 'Percent' implemented
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} />}
            onChange={(__, newValue) => {
              const updatedValue: TimeSeriesChartVisualOptions = {
                ...value,
                stack: newValue.id === 'None' ? undefined : newValue.id, // stack is optional so remove property when 'None' is selected
              };
              // stacked area chart preset to automatically set area under a curve shading
              if (newValue.id === 'All' && !value.area_opacity) {
                updatedValue.area_opacity = 0.3;
              }
              onChange(updatedValue);
            }}
            disabled={value === undefined}
            disableClearable
          ></Autocomplete>
        }
      />
      <OptionsEditorControl
        label={VISUAL_CONFIG.connect_nulls.label}
        control={
          <Switch
            checked={value.connect_nulls ?? DEFAULT_CONNECT_NULLS}
            onChange={(e) => {
              onChange({
                ...value,
                connect_nulls: e.target.checked,
              });
            }}
          />
        }
      />
    </OptionsEditorGroup>
  );
}
