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

import { MenuItem, TextField, TextFieldProps } from '@mui/material';
import { forwardRef, useCallback } from 'react';
import { PluginType } from '../../model';
import { useListPluginMetadata } from '../../runtime';
import { PluginEditorSelection } from '../PluginEditor';

export interface PluginKindSelectProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'children'> {
  pluginTypes: PluginType[];
  value?: PluginEditorSelection;
  onChange?: (s: PluginEditorSelection) => void;
}

/**
 * Displays a MUI Select input for selecting a plugin's kind from a list of all the available plugins of some specific
 * plugin types. (e.g. "Show a list of all the Panel plugins", or "Show a list of all the Variable plugins", or "Show
 * a list of all the TimeSeriesQuery, TraceQuery, and LogQuery plugins").
 * The value of the select is the kind of the plugin, but you can also listen to the `onPluginTypeChange` event to know
 * when the user changes the plugin type (it fires at start for the default value.)
 */
export const PluginKindSelect = forwardRef((props: PluginKindSelectProps, ref) => {
  const { pluginTypes, value: propValue, onChange, ...others } = props;
  const { data, isLoading } = useListPluginMetadata(pluginTypes);

  // Pass an empty value while options are still loading so MUI doesn't complain about us using an "out of range" value
  const value = !propValue || isLoading ? '' : selectionToOptionValue(propValue);

  const handleChange = (event: { target: { value: string } }) => {
    onChange?.(optionValueToSelection(event.target.value));
  };

  const renderValue = useCallback(
    (selected: unknown) => {
      if (selected === '') {
        return '';
      }
      const selectedValue = optionValueToSelection(selected as string);
      return data?.find((v) => v.pluginType === selectedValue.type && v.kind === selectedValue.kind)?.display.name;
    },
    [data]
  );

  // TODO: Does this need a loading indicator of some kind?
  return (
    <TextField
      select
      inputRef={ref}
      {...others}
      value={value}
      onChange={handleChange}
      SelectProps={{ renderValue }}
      data-testid="plugin-kind-select"
    >
      {isLoading && <MenuItem value="">Loading...</MenuItem>}
      {data?.map((metadata) => (
        <MenuItem
          data-testid="option"
          key={metadata.pluginType + metadata.kind}
          value={selectionToOptionValue({ type: metadata.pluginType, kind: metadata.kind })}
        >
          {metadata.display.name}
        </MenuItem>
      ))}
    </TextField>
  );
});
PluginKindSelect.displayName = 'PluginKindSelect';

// Delimiter used to stringify/parse option values
const OPTION_VALUE_DELIMITER = '_____';

/**
 * Given a PluginEditorSelection,
 * returns a string value like `{kind}_____{type}` that can be used as a Select input value.
 * @param selector
 */
function selectionToOptionValue(selector: PluginEditorSelection): string {
  return [selector.kind, selector.type].join(OPTION_VALUE_DELIMITER);
}

/**
 * Given an option value name like `{kind}_____{type}`,
 * returns a PluginEditorSelection to be used by the query data model.
 * @param optionValue
 */
function optionValueToSelection(optionValue: string): PluginEditorSelection {
  const words = optionValue.split(OPTION_VALUE_DELIMITER);
  const kind = words[0];
  const type = words[1] as PluginType | undefined;
  if (kind === undefined || type === undefined) {
    throw new Error('Invalid optionValue string');
  }
  return {
    kind,
    type,
  };
}
