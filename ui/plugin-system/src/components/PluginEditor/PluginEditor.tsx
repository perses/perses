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

import { Box, Button } from '@mui/material';
import Reload from 'mdi-material-ui/Reload';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ReactElement } from 'react';
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
export function PluginEditor(props: PluginEditorProps): ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, withRunQueryButton = true, pluginTypes, pluginKindLabel, onChange: _, isReadonly, ...others } = props;
  const { pendingSelection, isLoading, error, onSelectionChange, onSpecChange } = usePluginEditor(props);

  return (
    <Box {...others}>
      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <PluginKindSelect
          fullWidth={false}
          sx={{ mb: 2, minWidth: 120 }}
          margin="dense"
          label={pluginKindLabel}
          pluginTypes={pluginTypes}
          disabled={isLoading}
          value={pendingSelection ? pendingSelection : value.selection}
          InputProps={{ readOnly: isReadonly }}
          error={!!error}
          helperText={error?.message}
          onChange={onSelectionChange}
        />

        {withRunQueryButton && (
          <Button
            variant="contained"
            sx={{ marginTop: 1.5, marginBottom: 1.5, paddingTop: 0.5, marginLeft: 'auto' }}
            startIcon={<Reload />}
            onClick={() => onSpecChange(value.spec)}
          >
            Run Query
          </Button>
        )}
      </Box>

      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <PluginSpecEditor
          pluginSelection={value.selection}
          value={value.spec}
          onChange={onSpecChange}
          isReadonly={isReadonly}
        />
      </ErrorBoundary>
    </Box>
  );
}
