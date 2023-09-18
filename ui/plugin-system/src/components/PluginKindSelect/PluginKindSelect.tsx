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
import { forwardRef } from 'react';
import { PluginType } from '../../model';
import { useListPluginMetadata } from '../../runtime';

export interface PluginKindSelectProps extends Omit<TextFieldProps, 'children'> {
  pluginType: PluginType;
}

/**
 * Displays a MUI Select input for selecting a plugin's kind from a list of all the available plugins of a specific
 * plugin type. (e.g. "Show a list of all the Panel plugins" or "Show a list of all the Variable plugins").
 */
export const PluginKindSelect = forwardRef((props: PluginKindSelectProps, ref) => {
  const { pluginType, value: propValue, ...others } = props;
  const { data, isLoading } = useListPluginMetadata(pluginType);

  // Pass an empty value while options are still loading so MUI doesn't complain about us using an "out of range" value
  const value = propValue !== '' && isLoading ? '' : propValue;

  // TODO: Does this need a loading indicator of some kind?
  return (
    <TextField select inputRef={ref} {...others} value={value} data-testid="plugin-kind-select">
      {isLoading && <MenuItem value="">Loading...</MenuItem>}
      {data?.map((metadata) => (
        <MenuItem data-testid="option" key={metadata.kind} value={metadata.kind}>
          {metadata.display.name}
        </MenuItem>
      ))}
    </TextField>
  );
});
PluginKindSelect.displayName = 'PluginKindSelect';
