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

import { Slider, Stack, Typography } from '@mui/material';
import { VisualOptions, DEFAULT_LINE_WIDTH, DEFAULT_POINT_RADIUS } from './time-series-chart-model';

export interface VisualOptionsEditorProps {
  value: VisualOptions;
  onChange: (visual: VisualOptions) => void;
}

export function VisualOptionsEditor({ value, onChange }: VisualOptionsEditorProps) {
  const handlePointRadiusChange = (_: unknown, sliderValue: number | number[]) => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    onChange({
      ...value,
      point_radius: newValue,
    });
  };

  const handleLineWidthChange = (_: unknown, sliderValue: number | number[]) => {
    const newValue = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    onChange({
      ...value,
      line_width: newValue,
    });
  };

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Typography variant="overline" component="h4">
        Visual
      </Typography>
      <Typography variant="h5">Point Radius</Typography>
      <Slider
        aria-label="Point Radius"
        data-testid="slider-point-radius"
        defaultValue={DEFAULT_POINT_RADIUS}
        valueLabelDisplay="auto"
        step={0.5}
        marks
        min={0}
        max={20}
        onChange={handlePointRadiusChange}
      />
      <Typography variant="h5">Line Width</Typography>
      <Slider
        aria-label="Line Width"
        data-testid="slider-line-width"
        defaultValue={DEFAULT_LINE_WIDTH}
        valueLabelDisplay="auto"
        step={0.5}
        marks
        min={0}
        max={20}
        onChange={handleLineWidthChange}
      />
    </Stack>
  );
}
