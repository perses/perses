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

import { Select, SelectProps, MenuItem } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { useMemo } from 'react';
import { useListDatasources } from '../runtime';

// Props on MUI Select that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface DatasourceSelectProps extends Omit<SelectProps<string>, OmittedMuiProps> {
  value: DatasourceSelector;
  onChange: (next: DatasourceSelector) => void;
  datasourcePluginKind: string;
}

/**
 * Displays a MUI input for selecting a Datasource of a particular kind. Note: The 'value' and `onChange` handler for
 * the input deal with a `DatasourceSelector`.
 */
export function DatasourceSelect(props: DatasourceSelectProps) {
  const { datasourcePluginKind, value, onChange, ...others } = props;
  const { data, isLoading } = useListDatasources(datasourcePluginKind);

  // Convert the datasource list into menu items with name/value strings that the Select input can work with
  const menuItems = useMemo(() => {
    if (data === undefined) return [];
    return data.map((ds) => ({ name: ds.name, value: selectorToOptionValue(ds.selector) }));
  }, [data]);

  // While loading available values, just use an empty string so MUI select doesn't warn about values out of range
  const optionValue = isLoading ? '' : selectorToOptionValue(value);

  // When the user makes a selection, convert the string option value back to a DatasourceSelector
  const handleChange: SelectProps<string>['onChange'] = (e) => {
    const next = optionValueToSelector(e.target.value);
    onChange(next);
  };

  // TODO: Does this need a loading indicator of some kind?
  return (
    <Select {...others} value={optionValue} onChange={handleChange}>
      {menuItems.map((menuItem) => (
        <MenuItem key={menuItem.value} value={menuItem.value}>
          {menuItem.name}
        </MenuItem>
      ))}
    </Select>
  );
}

// Delimiter used to stringify/parse option values
const OPTION_VALUE_DELIMITER = '_____';

// Given a DatasourceSelector, returns a string value like `{kind}_____{name}` that can be used as a Select input value
function selectorToOptionValue(selector: DatasourceSelector): string {
  return [selector.kind, selector.name ?? ''].join(OPTION_VALUE_DELIMITER);
}

// Given an option value name like `{kind}_____{name}`, returns a DatasourceSelector
function optionValueToSelector(optionValue: string): DatasourceSelector {
  const [kind, name] = optionValue.split(OPTION_VALUE_DELIMITER);
  if (kind === undefined || name === undefined) {
    throw new Error('Invalid optionValue string');
  }
  return {
    kind,
    name: name === '' ? undefined : name,
  };
}
