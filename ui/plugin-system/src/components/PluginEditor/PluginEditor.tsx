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

import { Box, FormControl, FormHelperText, InputLabel } from '@mui/material';
import { PluginKindSelect } from '../PluginKindSelect';
import { PluginSpecEditor } from '../PluginSpecEditor';
import { PluginEditorProps, usePluginEditor } from './plugin-editor-api';

/**
 * A combination `PluginKindSelect` and `PluginSpecEditor` component. This is meant for editing the `plugin` property
 * that's common in our JSON specs where a user selects a plugin `kind` and then edits the `spec` via that plugin's
 * editor component. It takes care of transitioning from one plugin kind to another "all at once" so that when the
 * plugin's kind changes, the spec is also changed at the same time so those options editor components don't see a
 * previous plugin's spec state. If you just want this behavior, but in a different UI layout from this, try the
 * `usePluginEditor` hook that powers this component.
 */
export function PluginEditor(props: PluginEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, pluginType, pluginKindLabel, onChange: _, ...others } = props;
  const { pendingKind, isLoading, error, onKindChange, onSpecChange } = usePluginEditor(props);
  return (
    <Box {...others}>
      <FormControl margin="dense" fullWidth={false} disabled={isLoading} error={error !== null} sx={{ mb: 1 }}>
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
