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

import { Box, FormControl, FormHelperText, InputLabel } from '@mui/material';
import { PluginKindSelect } from '../PluginKindSelect';
import { PluginSpecEditor } from '../PluginSpecEditor';
import { PluginEditorProps, usePluginEditor } from './plugin-editor-api';

/**
 * A combination PluginKindSelect and PluginSpecEditor component, meant for editing the common pattern in our specs of
 * a `plugin` property with a `Definition` object attached to it.
 */
export function PluginEditor(props: PluginEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, pluginType, pluginKindLabel, onChange: _, ...others } = props;
  const { pendingKind, isLoading, error, onKindChange, onSpecChange } = usePluginEditor(props);

  return (
    <Box {...others}>
      <FormControl margin="dense" fullWidth={false} disabled={isLoading} error={error !== null}>
        {/* TODO: How to ensure ids are unique? */}
        <InputLabel id="plugin-kind-label">{pluginKindLabel}</InputLabel>
        <PluginKindSelect
          labelId="plugin-kind-label"
          label={pluginKindLabel}
          pluginType={pluginType}
          value={pendingKind !== '' ? pendingKind : value.kind}
          onChange={onKindChange}
        />
        <FormHelperText>{error?.message ?? ''}</FormHelperText>
      </FormControl>

      <PluginSpecEditor pluginType={pluginType} pluginKind={value.kind} value={value.spec} onChange={onSpecChange} />
    </Box>
  );
}
