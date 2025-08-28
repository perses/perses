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
import { forwardRef, ReactElement, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { UnknownSpec } from '@perses-dev/core';
import { PluginKindSelect } from '../PluginKindSelect';
import { PluginSpecEditor } from '../PluginSpecEditor';
import { PluginEditorProps, PluginEditorRef, usePluginEditor } from './plugin-editor-api';

/**
 * A combination `PluginKindSelect` and `PluginSpecEditor` component. This is meant for editing the `plugin` property
 * that's common in our JSON specs where a user selects a plugin `kind` and then edits the `spec` via that plugin's
 * editor component. It takes care of transitioning from one plugin kind to another "all at once" so that when the
 * plugin's kind changes, the spec is also changed at the same time so those options editor components don't see a
 * previous plugin's spec state. If you just want this behavior, but in a different UI layout from this, try the
 * `usePluginEditor` hook that powers this component.
 */

export const PluginEditor = forwardRef<PluginEditorRef, PluginEditorProps>((props, ref): ReactElement => {
  const {
    value,
    calculatedSuggestedStepMs,
    withRunQueryButton = true,
    pluginTypes,
    pluginKindLabel,
    onChange: _,
    isReadonly,
    postExecuteRunQuery: refresh,
    ...others
  } = props;
  const { pendingSelection, isLoading, error, onSelectionChange, onSpecChange } = usePluginEditor(props);

  /* 
     We could technically merge the watchedQuery, watchedOtherSpecs into a single watched-object,
     because at the end of the day, they are all specs.
     However, let's have them separated to keep the code simple and readable.
     Reason: Only Query string field is common between all of them. Other specs may be different
     Example: Legend, and MinSteps
    */
  const [watchedQuery, setWatchQuery] = useState<string>(value.spec['query'] as string);
  const [watchedOtherSpecs, setWatchOtherSpecs] = useState<UnknownSpec>(value.spec);

  const runQueryHandler = useCallback((): void => {
    onSpecChange({ ...value.spec, ...watchedOtherSpecs, query: watchedQuery });
    refresh?.();
  }, [value.spec, onSpecChange, watchedQuery, watchedOtherSpecs, refresh]);

  const queryHandlerSettings = useMemo(() => {
    return withRunQueryButton
      ? {
          runWithOnBlur: false,
          watchQueryChanges: (query: string): void => {
            setWatchQuery(query);
          },
          setWatchOtherSpecs: (otherSpecs: UnknownSpec): void => {
            setWatchOtherSpecs(otherSpecs);
          },
        }
      : undefined;
  }, [withRunQueryButton]);

  useImperativeHandle(ref, () => ({ flushChanges: runQueryHandler }));

  return (
    <Box {...others}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <PluginKindSelect
          fullWidth={false}
          sx={{ minWidth: 120 }}
          margin="dense"
          label={pluginKindLabel}
          pluginTypes={pluginTypes}
          disabled={isLoading}
          value={pendingSelection ? pendingSelection : value.selection}
          slotProps={{ input: { readOnly: isReadonly } }}
          error={!!error}
          helperText={error?.message}
          onChange={onSelectionChange}
        />

        {withRunQueryButton && !isLoading && (
          <Button data-testid="run_query_button" variant="contained" startIcon={<Reload />} onClick={runQueryHandler}>
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
          queryHandlerSettings={queryHandlerSettings}
          calculatedSuggestedStepMs={calculatedSuggestedStepMs}
        />
      </ErrorBoundary>
    </Box>
  );
});

PluginEditor.displayName = 'PluginEditor';
