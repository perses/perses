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
import { Box, Switch, TextField, Autocomplete, SwitchProps } from '@mui/material';
import {
  UnitOptions,
  UNIT_CONFIG,
  DEFAULT_DECIMAL_PLACES,
  UnitConfig,
  isUnitWithDecimalPlaces,
  isUnitWithAbbreviate,
} from '../model';
import { OptionsEditorControl } from '../OptionsEditorLayout';

export interface UnitSelectorProps {
  value: UnitOptions;
  onChange: (unit: UnitOptions) => void;
}

type AutocompleteKindOption = UnitConfig & { id: UnitOptions['kind'] };

const KIND_OPTIONS: AutocompleteKindOption[] = Object.entries(UNIT_CONFIG)
  .map(([id, config]) => {
    return {
      id: id as UnitOptions['kind'],
      ...config,
    };
  })
  .filter((config) => !config.disableSelectorOption);

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4];

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const hasDecimalPlaces = isUnitWithDecimalPlaces(value);
  const hasAbbreviate = isUnitWithAbbreviate(value);

  const handleKindChange = (_: unknown, newValue: AutocompleteKindOption) => {
    onChange({
      kind: newValue.id,
    });
  };

  const handleDecimalChange = (_: unknown, newValue: number) => {
    if (hasDecimalPlaces) {
      onChange({
        ...value,
        decimal_places: newValue,
      });
    }
  };

  const handleAbbreviateChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    if (hasAbbreviate) {
      onChange({
        ...value,
        abbreviate: checked,
      });
    }
  };

  const kindConfig = UNIT_CONFIG[value.kind];

  return (
    <>
      <OptionsEditorControl
        label="Abbreviate"
        control={
          <Switch
            checked={hasAbbreviate ? !!value.abbreviate : false}
            onChange={handleAbbreviateChange}
            disabled={!hasAbbreviate}
          />
        }
      />
      <OptionsEditorControl
        label="Units"
        control={
          <Autocomplete
            value={{ id: value.kind, ...kindConfig }}
            options={KIND_OPTIONS}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            groupBy={(option) => option.group}
            renderInput={(params) => <TextField {...params} />}
            renderOption={(renderOptsProps, option) => {
              // Custom option needed to get some increased left padding to make
              // the items more distinct from the group label.
              return (
                <li {...renderOptsProps}>
                  <Box paddingLeft={(theme) => theme.spacing(1)}>{option.label}</Box>
                </li>
              );
            }}
            onChange={handleKindChange}
            disableClearable
          ></Autocomplete>
        }
      />
      <OptionsEditorControl
        label="Decimal"
        control={
          <Autocomplete
            value={hasDecimalPlaces ? value.decimal_places ?? DEFAULT_DECIMAL_PLACES : 0}
            options={DECIMAL_OPTIONS}
            getOptionLabel={(option) => `${option}`}
            renderInput={(params) => <TextField {...params} />}
            onChange={handleDecimalChange}
            disabled={!hasDecimalPlaces}
            disableClearable
          ></Autocomplete>
        }
      />
    </>
  );
}
