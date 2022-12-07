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

import { Autocomplete, Switch, SwitchProps, TextField } from '@mui/material';
import { DEFAULT_LEGEND, LegendOptions } from '../model';
import { OptionsEditorControl } from '../OptionsEditorLayout';

type LegendPositionConfig = {
  label: string;
};

const LEGEND_POSITIONS = ['bottom', 'right'] as const;

type LegendPositions = typeof LEGEND_POSITIONS[number];

const LEGEND_POSITIONS_CONFIG: Readonly<Record<LegendPositions, LegendPositionConfig>> = {
  bottom: { label: 'Bottom' },
  right: { label: 'Right' },
};

type LegendPositionOption = LegendPositionConfig & { id: LegendOptions['position'] };

const POSITION_OPTIONS: LegendPositionOption[] = Object.entries(LEGEND_POSITIONS_CONFIG).map(([id, config]) => {
  return {
    id: id as LegendOptions['position'],
    ...config,
  };
});

export interface LegendOptionsEditorProps {
  value?: LegendOptions;
  onChange: (legend?: LegendOptions) => void;
}

export function LegendOptionsEditor({ value, onChange }: LegendOptionsEditorProps) {
  const handleLegendShowChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    // legend is hidden when legend obj is undefined
    const legendValue = checked === true ? { position: DEFAULT_LEGEND.position } : undefined;
    onChange(legendValue);
  };

  const handleLegendPositionChange = (_: unknown, newValue: LegendPositionOption) => {
    onChange({
      ...value,
      position: newValue.id,
    });
  };

  const legendConfig = LEGEND_POSITIONS_CONFIG[value?.position ?? DEFAULT_LEGEND.position];

  return (
    <>
      <OptionsEditorControl
        label="Show"
        control={<Switch checked={value !== undefined} onChange={handleLegendShowChange} />}
      />
      <OptionsEditorControl
        label="Position"
        control={
          <Autocomplete
            value={{
              ...legendConfig,
              id: value?.position ?? DEFAULT_LEGEND.position,
            }}
            options={POSITION_OPTIONS}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} />}
            onChange={handleLegendPositionChange}
            disabled={value === undefined}
            disableClearable
          ></Autocomplete>
        }
      />
    </>
  );
}
