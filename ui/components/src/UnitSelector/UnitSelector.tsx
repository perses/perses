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
import { UnitOptions, UNIT_CONFIG, UnitConfig, isUnitWithDecimalPlaces, isUnitWithAbbreviate } from '../model';
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

const DECIMAL_PLACES_OPTIONS = [
  { label: 'Default', decimal_places: undefined },
  { label: '0', decimal_places: 0 },
  { label: '1', decimal_places: 1 },
  { label: '2', decimal_places: 2 },
  { label: '3', decimal_places: 3 },
  { label: '4', decimal_places: 4 },
];

function getOptionByDecimalPlaces(decimal_places?: number) {
  return DECIMAL_PLACES_OPTIONS.find((o) => o.decimal_places === decimal_places);
}

export function UnitSelector({ value, onChange }: UnitSelectorProps) {
  const hasDecimalPlaces = isUnitWithDecimalPlaces(value);
  const hasAbbreviate = isUnitWithAbbreviate(value);

  const handleKindChange = (_: unknown, newValue: AutocompleteKindOption) => {
    onChange({
      kind: newValue.id,
    });
  };

  const handleDecimalPlacesChange = (_: unknown, { decimal_places }: { decimal_places: number | undefined }) => {
    if (hasDecimalPlaces) {
      onChange({
        ...value,
        decimal_places: decimal_places,
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
          <Autocomplete
            value={getOptionByDecimalPlaces(value.decimal_places)}
            options={DECIMAL_PLACES_OPTIONS}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(option, value) => option.label === value.label}
            renderInput={(params) => <TextField {...params} />}
            onChange={handleDecimalPlacesChange}
            disabled={!hasDecimalPlaces}
            disableClearable
          />
        }
      />
    </>
  );
}
