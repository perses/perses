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

import { Switch, SwitchProps, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { DEFAULT_LEGEND, getLegendMode, getLegendPosition, getLegendSize } from '@perses-dev/core';
import { ErrorAlert, OptionsEditorControl, OptionsEditorGroup, SettingsAutocomplete } from '@perses-dev/components';
import { ReactElement, useMemo } from 'react';
import {
  LEGEND_MODE_CONFIG,
  LEGEND_POSITIONS_CONFIG,
  LegendSpecOptions,
  LegendSingleSelectConfig,
  validateLegendSpec,
  LEGEND_VALUE_CONFIG,
  LegendValue,
  LEGEND_SIZE_CONFIG,
  comparisonLegends,
  ComparisonValues,
} from '../../model';

type LegendPositionOption = LegendSingleSelectConfig & { id: LegendSpecOptions['position'] };

const POSITION_OPTIONS: LegendPositionOption[] = Object.entries(LEGEND_POSITIONS_CONFIG).map(([id, config]) => {
  return {
    id: id as LegendSpecOptions['position'],
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

type LegendValueOption = LegendSingleSelectConfig & { id: LegendValue | ComparisonValues };

export interface LegendOptionsEditorProps {
  value?: LegendSpecOptions;
  onChange: (legend?: LegendSpecOptions) => void;
  showValuesEditor?: boolean;
  calculation?: 'aggregation' | 'comparison';
}

export function LegendOptionsEditor({
  value,
  onChange,
  showValuesEditor = true,
  calculation = 'aggregation',
}: LegendOptionsEditorProps): ReactElement {
  const handleLegendShowChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    // legend is hidden when legend obj is undefined
    const legendValue = checked === true ? { position: DEFAULT_LEGEND.position } : undefined;
    onChange(legendValue);
  };

  const handleLegendPositionChange = (_: unknown, newValue: LegendPositionOption): void => {
    onChange({
      ...value,
      position: newValue.id,
    });
  };

  const handleLegendSizeChange = (_: unknown, newValue: LegendSizeOption): void => {
    onChange({
      ...value,
      position: currentPosition,
      size: newValue.id,
    });
  };

  const handleLegendValueChange = (_: unknown, newValue: LegendValueOption[]): void => {
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

  const currentSize = getLegendSize(value?.size);
  const legendSizeConfig = LEGEND_SIZE_CONFIG[currentSize];

  const legendValuesConfig = useMemo(() => {
    const currentValues = value?.values;
    if (!currentValues?.length) return [];

    if (calculation === 'aggregation') {
      return currentValues.reduce((result, item) => {
        const config = LEGEND_VALUE_CONFIG[item as LegendValue];
        if (config) {
          result.push({ ...config, id: item });
        }
        return result;
      }, [] as LegendValueOption[]);
    }

    return currentValues.map((id) => {
      const { label, description } = comparisonLegends[id as ComparisonValues];
      return {
        id,
        label,
        description,
      };
    });
  }, [calculation, value?.values]);

  const valueOptions = useMemo(() => {
    if (calculation === 'aggregation') {
      return Object.entries(LEGEND_VALUE_CONFIG || {}).map(([id, config]) => {
        return {
          id: id as LegendValue,
          ...config,
        };
      });
    }

    return Object.entries(comparisonLegends).map(([id, config]) => ({
      id: id as ComparisonValues,
      ...config,
    }));
  }, [calculation]);

  return (
    <OptionsEditorGroup title="Legend">
      {!isValidLegend && <ErrorAlert error={{ name: 'invalid-legend', message: 'Invalid legend spec' }} />}
      <OptionsEditorControl label="Show" control={<Switch checked={!!value} onChange={handleLegendShowChange} />} />
      {value && (
        <>
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
                disableClearable
              />
            }
          />
          <OptionsEditorControl
            label="Mode"
            control={
              <ToggleButtonGroup
                color="primary"
                exclusive
                value={currentMode}
                aria-label="Mode"
                onChange={(__, newValue) => {
                  onChange({
                    ...value,
                    position: currentPosition,
                    mode: newValue,
                  });
                }}
              >
                {Object.entries(LEGEND_MODE_CONFIG).map(([modeId, config]) => (
                  <ToggleButton
                    key={modeId}
                    value={modeId}
                    selected={currentMode === modeId}
                    aria-label={`display ${modeId} mode`}
                  >
                    {config.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            }
          />
          {currentMode === 'table' && (
            <>
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
                    disableClearable
                  />
                }
              />
              {showValuesEditor && (
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
                      options={valueOptions}
                      onChange={handleLegendValueChange}
                      limitTags={1}
                      ChipProps={{
                        size: 'small',
                      }}
                    />
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </OptionsEditorGroup>
  );
}
