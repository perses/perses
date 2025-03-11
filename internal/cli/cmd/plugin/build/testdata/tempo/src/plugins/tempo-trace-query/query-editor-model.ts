// Copyright 2025 The Perses Authors
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
import { produce } from 'immer';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { TempoTraceQuerySpec } from '../../model/trace-query-model';

export type TraceQueryEditorProps = OptionsEditorProps<TempoTraceQuerySpec>;

/**
 * A hook for managing the `query` state in PrometheusTimeSeriesQuerySpec. Returns the `query` value, along with
 * `onChange` and `onBlur` event handlers to the input. Keeps a local copy of the user's input and only syncs those
 * changes with the overall spec value once the input is blurred to prevent re-running queries in the panel's preview
 * every time the user types.
 */
export function useQueryState(props: TraceQueryEditorProps): {
  query: string;
  handleQueryChange: (e: string) => void;
  handleQueryBlur: () => void;
} {
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
  const handleQueryChange = (e: string): void => {
    setQuery(e);
  };

  // Propagate changes to the query's value when the input is blurred to avoid constantly re-running queries in the
  // PanelPreview
  const handleQueryBlur = (): void => {
    setLastSyncedQuery(query);
    onChange(
      produce(value, (draft) => {
        draft.query = query;
      })
    );
  };

  return { query, handleQueryChange, handleQueryBlur };
}

/**
 * Hook to manage `limit` state to ensure panel preview does not rerender until text input is blurred
 */
export function useLimitState(props: TraceQueryEditorProps): {
  limit: string;
  handleLimitChange: (e: string) => void;
  handleLimitBlur: () => void;
  limitHasError: boolean;
} {
  const { onChange, value } = props;

  // TODO: reusable hook or helper util instead of duplicating from useQueryState
  const [limit, setLimit] = useState(value.limit ? value.limit.toString() : '');
  const [lastSyncedLimit, setLastSyncedLimit] = useState(value.limit);
  if (value.limit !== lastSyncedLimit) {
    setLimit(value.limit ? value.limit.toString() : '');
    setLastSyncedLimit(value.limit);
  }

  // limit must be empty or an integer > 0
  const limitHasError = !(limit === '' || (/^[0-9]+$/.test(limit) && parseInt(limit) > 0));

  // Update our local state as the user types
  const handleLimitChange = (e: string): void => {
    setLimit(e);
  };

  // Propagate changes to the panel preview component when limit TextField is blurred
  const handleLimitBlur = (): void => {
    if (limitHasError) {
      return;
    }

    const limitVal = limit === '' ? undefined : parseInt(limit);
    setLastSyncedLimit(limitVal);
    onChange(
      produce(value, (draft) => {
        draft.limit = limitVal;
      })
    );
  };

  return { limit, handleLimitChange, handleLimitBlur, limitHasError };
}
