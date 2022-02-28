// Copyright 2021 The Perses Authors
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

import { useEffect, useMemo } from 'react';
import { Autocomplete, AutocompleteProps as MuiAutocompleteProps, TextField, TextFieldProps } from '@mui/material';
import { VariableDefinition } from '@perses-dev/core';
import { useVariableOptions, VariableState } from '@perses-dev/plugin-system';

// What kind of AutocompleteProps we're using internally here
type AutocompleteProps = MuiAutocompleteProps<string, boolean, true, false>;

export interface VariableAutocompleteProps {
  definition: VariableDefinition;
  state: VariableState;
  onChange: (value: string | string[]) => void;
  onOptionsChange: (options: string[]) => void;
  TextFieldProps?: TextFieldProps;
}

/**
 * A MUI Autocomplete that displays variable options, loaded from the
 * appropriate plugin.
 */
export function VariableAutocomplete(props: VariableAutocompleteProps) {
  const { definition, state, onChange, onOptionsChange, TextFieldProps } = props;
  const { value, options } = state;

  const allValue = 'all_value' in definition.selection ? definition.selection.all_value : undefined;

  const displayOptions = useMemo(() => {
    let displayOptions = options;

    // During initial loading, options will be undefined, so make sure we have
    // an option for the current value
    if (displayOptions === undefined) {
      displayOptions = Array.isArray(value) ? value : [value];
    }

    // The All option is not actually stored in the options state, so make
    // sure that exists at the start of the options array
    if (allValue !== undefined && displayOptions[0] !== allValue) {
      displayOptions = [allValue, ...displayOptions];
    }

    return displayOptions;
  }, [options, value, allValue]);

  // Load the options from the server and update state whenever that data
  // changes
  const { data, loading, error } = useVariableOptions(definition);
  useEffect(() => {
    if (loading) return;
    onOptionsChange(data);
    // We don't want to fire this event every time we render if the user doesn't wrap onOptionsChange with useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading]);

  const handleChange: AutocompleteProps['onChange'] = (e, nextValue) => {
    onChange(nextValue);
  };

  return (
    <Autocomplete
      options={displayOptions}
      loading={loading}
      value={value}
      multiple={Array.isArray(value)}
      disableClearable
      freeSolo={false}
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="normal"
          label={definition.display.label}
          error={error !== undefined}
          helperText={error?.message ?? ''}
          {...TextFieldProps}
        />
      )}
      getOptionLabel={(option) => (option === allValue ? 'All' : option)}
      ChipProps={{
        color: 'default',
        variant: 'outlined',
      }}
    />
  );
}
