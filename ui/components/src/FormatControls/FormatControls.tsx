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
import {
  FormatOptions,
  UNIT_CONFIG,
  UnitConfig,
  isUnitWithDecimalPlaces,
  isUnitWithShortValues,
  shouldShortenValues,
} from '@perses-dev/core';
import { ReactElement } from 'react';
import { OptionsEditorControl } from '../OptionsEditorLayout';
import { SettingsAutocomplete } from '../SettingsAutocomplete';

export interface FormatControlsProps {
  value: FormatOptions;
  onChange: (unit: FormatOptions) => void;
  disabled?: boolean;
}

type AutocompleteUnitOption = UnitConfig & {
  id: NonNullable<FormatOptions['unit']>;
};

const KIND_OPTIONS: readonly AutocompleteUnitOption[] = Object.entries(UNIT_CONFIG)
  .map<AutocompleteUnitOption>(([id, config]) => {
    return {
      ...config,
      id: id as AutocompleteUnitOption['id'],
      group: config.group || 'Decimal',
    };
  })
  .filter((config) => !config.disableSelectorOption);

const DECIMAL_PLACES_OPTIONS: Array<{ id: string; label: string; decimalPlaces?: number }> = [
  { id: 'default', label: 'Default', decimalPlaces: undefined },
  { id: '0', label: '0', decimalPlaces: 0 },
  { id: '1', label: '1', decimalPlaces: 1 },
  { id: '2', label: '2', decimalPlaces: 2 },
  { id: '3', label: '3', decimalPlaces: 3 },
  { id: '4', label: '4', decimalPlaces: 4 },
];

function getOptionByDecimalPlaces(
  decimalPlaces?: number
): { id: string; label: string; decimalPlaces?: number } | undefined {
  return DECIMAL_PLACES_OPTIONS.find((o) => o.decimalPlaces === decimalPlaces);
}

export function FormatControls({ value, onChange, disabled = false }: FormatControlsProps): ReactElement {
  const hasDecimalPlaces = isUnitWithDecimalPlaces(value);
  const hasShortValues = isUnitWithShortValues(value);

  const handleKindChange = (_: unknown, newValue: AutocompleteUnitOption | null): void => {
    onChange({ unit: newValue?.id || 'decimal' } as FormatOptions); // Fallback to 'decimal' if no unit is selected
  };

  const handleDecimalPlacesChange = ({
    decimalPlaces,
  }: {
    id: string;
    label: string;
    decimalPlaces?: number;
  }): void => {
    if (hasDecimalPlaces) {
      onChange({
        ...value,
        decimalPlaces: decimalPlaces,
      });
    }
  };

  const handleShortValuesChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    if (hasShortValues) {
      onChange({
        ...value,
        shortValues: checked,
      });
    }
  };

  const unitConfig = UNIT_CONFIG[value?.unit || 'decimal'];

  return (
    <>
      <OptionsEditorControl
        label="Short values"
        control={
          <Switch
            checked={hasShortValues ? shouldShortenValues(value.shortValues) : false}
            onChange={handleShortValuesChange}
            disabled={!hasShortValues}
          />
        }
      />
      <OptionsEditorControl
        label="Unit"
        control={
          <SettingsAutocomplete<AutocompleteUnitOption, false, true>
            value={{ id: value?.unit || 'decimal', ...unitConfig }}
            options={KIND_OPTIONS}
            groupBy={(option) => option.group ?? 'Decimal'}
            onChange={handleKindChange}
            disableClearable
            disabled={disabled}
          />
        }
      />
      <OptionsEditorControl
        label="Decimals"
        control={
          <SettingsAutocomplete
            value={getOptionByDecimalPlaces(value.decimalPlaces)}
            options={DECIMAL_PLACES_OPTIONS}
            getOptionLabel={(o) => o.label}
            onChange={(_, value) => handleDecimalPlacesChange(value)}
            disabled={!hasDecimalPlaces}
            disableClearable
          />
        }
      />
    </>
  );
}
