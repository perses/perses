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

import { QueryDefinition, TimeSeriesQueryDefinition } from '@perses-dev/core';
import { TimeSeriesQueryInput } from './TimeSeriesQueryInput';

export interface TimeSeriesQueryEditorProps {
  queries: QueryDefinition[];
  handleQueryChange: (index: number, queryDef: TimeSeriesQueryDefinition) => void;
  queriesCollapsed: boolean[];
  handleQueryDelete: (index: number) => void;
  handleQueryCollapseExpand: (index: number) => void;
  defaultTimeSeriesQueryKind: string;
}

export function TimeSeriesQueryEditor(props: TimeSeriesQueryEditorProps) {
  const {
    queries,
    handleQueryChange,
    handleQueryCollapseExpand,
    handleQueryDelete,
    queriesCollapsed,
    defaultTimeSeriesQueryKind,
  } = props;

  const hasMoreThanOneQuery = queries.length > 1;
  const queryDefinitions: TimeSeriesQueryDefinition[] = queries.length
    ? queries
    : [
        {
          kind: 'TimeSeriesQuery',
          spec: {
            plugin: {
              kind: defaultTimeSeriesQueryKind,
              spec: {
                query: '',
              },
            },
          },
        },
      ];

  return (
    <>
      {queryDefinitions.map((query: TimeSeriesQueryDefinition, i: number) => (
        <TimeSeriesQueryInput
          key={i}
          index={i}
          query={query}
          onChange={handleQueryChange}
          isCollapsed={!!queriesCollapsed[i]}
          onDelete={hasMoreThanOneQuery ? handleQueryDelete : undefined}
          onCollapseExpand={handleQueryCollapseExpand}
        />
      ))}
    </>
  );
}
