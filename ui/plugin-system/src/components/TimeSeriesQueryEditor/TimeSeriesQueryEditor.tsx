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

import { Box, BoxProps } from '@mui/material';
import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { produce } from 'immer';
import { PluginEditor, PluginEditorProps } from '../PluginEditor';

// Props on MUI Box that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface TimeSeriesQueryEditorProps extends Omit<BoxProps, OmittedMuiProps> {
  value: TimeSeriesQueryDefinition;
  onChange: (next: TimeSeriesQueryDefinition) => void;
}

/**
 * Displays an editor for TimeSeriesQueryDefinition objects.
 */
export function TimeSeriesQueryEditor(props: TimeSeriesQueryEditorProps) {
  console.log(JSON.stringify(props));
  const { value, onChange, ...others } = props;
  const {
    spec: { plugin },
  } = value;

  const handlePluginChange: PluginEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.spec.plugin = next;
      })
    );
  };

  return (
    <Box {...others}>
      {/* If TimeSeriesQuery plugins ever have common props on the definition, the inputs could go here */}
      <PluginEditor
        pluginType="TimeSeriesQuery"
        pluginKindLabel="Query Type"
        value={plugin}
        onChange={handlePluginChange}
      />
    </Box>
  );
}
