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

import { useState } from 'react';
import { TextFieldProps } from '@mui/material';
import { produce } from 'immer';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { PrometheusTimeSeriesQuerySpec } from './time-series-query-model';

export type PrometheusTimeSeriesQueryEditorProps = OptionsEditorProps<PrometheusTimeSeriesQuerySpec>;

/**
 * A hook for managing the `query` state in PrometheusTimeSeriesQuerySpec. Returns the `query` value, along with
 * `onChange` and `onBlur` event handlers to the input. Keeps a local copy of the user's input and only syncs those
 * changes with the overall spec value once the input is blurred to prevent re-running queries in the panel's preview
 * every time the user types.
 */
export function useQueryState(props: PrometheusTimeSeriesQueryEditorProps) {
  const { onChange, value } = props;

  // Local copy of the query's value
  const [query, setQuery] = useState(value.query);

  // This is basically "getDerivedStateFromProps" to make sure if spec's value changes external to this component,
  // we render with the latest value
  const [lastSyncedQuery, setLastSyncedQuery] = useState(value.query);
  if (value.query !== lastSyncedQuery) {
    setQuery(value.query);
    setLastSyncedQuery(value.query);
  }

  // Update our local state's copy as the user types
  const handleQueryChange: TextFieldProps['onChange'] = (e) => {
    setQuery(e.target.value);
  };

  // Propagate changes to the query's value when the input is blurred to avoid constantly re-running queries in the
  // PanelPreview
  const handleQueryBlur: TextFieldProps['onBlur'] = () => {
    setLastSyncedQuery(query);
    onChange(
      produce(value, (draft) => {
        draft.query = query;
      })
    );
  };

  return { query, handleQueryChange, handleQueryBlur };
}
