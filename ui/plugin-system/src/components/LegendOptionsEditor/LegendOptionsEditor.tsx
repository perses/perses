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

import { Switch, SwitchProps } from '@mui/material';
import { DEFAULT_LEGEND, getLegendMode, getLegendPosition, getLegendSize } from '@perses-dev/core';
import { ErrorAlert, OptionsEditorControl, SettingsAutocomplete } from '@perses-dev/components';
import {
  LEGEND_MODE_CONFIG,
  LEGEND_POSITIONS_CONFIG,
  LegendSpecOptions,
  LegendSingleSelectConfig,
  validateLegendSpec,
  LEGEND_VALUE_CONFIG,
  LegendValue,
  LEGEND_SIZE_CONFIG,
} from '../../model';

type LegendPositionOption = LegendSingleSelectConfig & { id: LegendSpecOptions['position'] };

const POSITION_OPTIONS: LegendPositionOption[] = Object.entries(LEGEND_POSITIONS_CONFIG).map(([id, config]) => {
  return {
    id: id as LegendSpecOptions['position'],
    ...config,
  };
});

type LegendModeOption = LegendSingleSelectConfig & { id: Required<LegendSpecOptions>['mode'] };

const MODE_OPTIONS: LegendModeOption[] = Object.entries(LEGEND_MODE_CONFIG).map(([id, config]) => {
  return {
    id: id as Required<LegendSpecOptions>['mode'],
    ...config,
  };
});

type LegendSizeOption = LegendSingleSelectConfig & { id: Required<LegendSpecOptions>['size'] };

const SIZE_OPTIONS: LegendSizeOption[] = Object.entries(LEGEND_SIZE_CONFIG).map(([id, config]) => {
  return {
    id: id as Required<LegendSpecOptions>['size'],
    ...config,
  };
});

type LegendValueOption = LegendSingleSelectConfig & { id: LegendValue };
const VALUE_OPTIONS: LegendValueOption[] = Object.entries(LEGEND_VALUE_CONFIG).map(([id, config]) => {
  return {
    id: id as LegendValue,
    ...config,
  };
});

export interface LegendOptionsEditorProps {
  value?: LegendSpecOptions;
  onChange: (legend?: LegendSpecOptions) => void;
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

  const handleLegendModeChange = (_: unknown, newValue: LegendModeOption) => {
    onChange({
      ...value,
      position: currentPosition,
      mode: newValue.id,
    });
  };

  const handleLegendSizeChange = (_: unknown, newValue: LegendSizeOption) => {
    onChange({
      ...value,
      position: currentPosition,
      size: newValue.id,
    });
  };

  const handleLegendValueChange = (_: unknown, newValue: LegendValueOption[]) => {
    onChange({
      ...value,
      position: currentPosition,
      values: newValue.map((value) => {
        return value.id;
      }),
    });
  };

  const isValidLegend = validateLegendSpec(value);
  const currentPosition = getLegendPosition(value?.position);
  const legendPositionConfig = LEGEND_POSITIONS_CONFIG[currentPosition];

  const currentMode = getLegendMode(value?.mode);
  const legendModeConfig = LEGEND_MODE_CONFIG[currentMode];

  const currentSize = getLegendSize(value?.size);
  const legendSizeConfig = LEGEND_SIZE_CONFIG[currentSize];

  const currentValues = value?.values || [];
  const legendValuesConfig = currentValues.reduce((result, item) => {
    const config = LEGEND_VALUE_CONFIG[item];
    if (config) {
      result.push({ ...config, id: item });
    }
    return result;
  }, [] as LegendValueOption[]);

  return (
    <>
      {!isValidLegend && <ErrorAlert error={{ name: 'invalid-legend', message: 'Invalid legend spec' }} />}
      <OptionsEditorControl
        label="Show"
        control={<Switch checked={value !== undefined} onChange={handleLegendShowChange} />}
      />
      <OptionsEditorControl
        label="Position"
        control={
          <SettingsAutocomplete
            value={{
              ...legendPositionConfig,
              id: currentPosition,
            }}
            options={POSITION_OPTIONS}
            onChange={handleLegendPositionChange}
            disabled={value === undefined}
            disableClearable
          ></SettingsAutocomplete>
        }
      />
      <OptionsEditorControl
        label="Mode"
        control={
          <SettingsAutocomplete
            value={{
              ...legendModeConfig,
              id: currentMode,
            }}
            options={MODE_OPTIONS}
            onChange={handleLegendModeChange}
            disabled={value === undefined}
            disableClearable
          ></SettingsAutocomplete>
        }
      />
      <OptionsEditorControl
        label="Size"
        control={
          <SettingsAutocomplete
            value={{
              ...legendSizeConfig,
              id: currentSize,
            }}
            options={SIZE_OPTIONS}
            onChange={handleLegendSizeChange}
            // TODO: enable sizes for list mode when we normalize the layout of
            // lists to more closely match tables.
            disabled={value === undefined || currentMode !== 'table'}
            disableClearable
          ></SettingsAutocomplete>
        }
      />
      <OptionsEditorControl
        label="Values"
        control={
          // For some reason, the inferred option type doesn't always seem to work
          // quite right when `multiple` is true. Explicitly setting the generics
          // to work around this.
          <SettingsAutocomplete<LegendValueOption, true, true>
            multiple={true}
            disableCloseOnSelect
            disableClearable
            value={legendValuesConfig}
            options={VALUE_OPTIONS}
            onChange={handleLegendValueChange}
            disabled={value === undefined || currentMode !== 'table'}
            limitTags={1}
            ChipProps={{
              size: 'small',
            }}
          />
        }
      />
    </>
  );
}
