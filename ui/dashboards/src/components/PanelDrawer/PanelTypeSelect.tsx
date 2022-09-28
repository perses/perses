// Copyright 2022 The Perses Authors
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
import { useListPluginMetadata } from '@perses-dev/plugin-system';

export type PanelTypeSelectProps = Omit<SelectProps<string>, 'children'>;

/**
 * Displays a MUI Select input for selecing a Panel type. Queries the plugin system to get the list of all panel types.
 */
export function PanelTypeSelect(props: PanelTypeSelectProps) {
  const { value: propValue, ...others } = props;
  const { data, isLoading } = useListPluginMetadata('Panel');

  // Pass an empty value while options are still loading so MUI doesn't complain about us using an "out of range" value
  const value = propValue !== '' && isLoading ? '' : propValue;

  // TODO: Does this need a loading indicator of some kind?
  return (
    <Select {...others} value={value}>
      {data?.map((metadata) => (
        <MenuItem key={metadata.kind} value={metadata.kind}>
          {metadata.display.name}
        </MenuItem>
      ))}
    </Select>
  );
}
