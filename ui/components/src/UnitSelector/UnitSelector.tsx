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
  UnitConfig,
  isUnitWithDecimalPlaces,
  isUnitWithAbbreviate,
  DECIMAL_PLACES_MIN,
  DECIMAL_PLACES_MAX,
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

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const hasDecimalPlaces = isUnitWithDecimalPlaces(value);
  const hasAbbreviate = isUnitWithAbbreviate(value);

  const handleKindChange = (_: unknown, newValue: AutocompleteKindOption) => {
    onChange({
      kind: newValue.id,
    });
  };

  const handleDecimalChange = (newValue?: number) => {
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
        label="Unit"
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
        label="Decimals"
        control={
          <TextField
            type="number"
            value={value.decimal_places ?? ''}
            onChange={(e) => {
              handleDecimalChange(e.target.value ? Number(e.target.value) : undefined);
            }}
            placeholder="Default"
            inputProps={{ min: DECIMAL_PLACES_MIN, max: DECIMAL_PLACES_MAX }}
          />
        }
      />
    </>
  );
}
