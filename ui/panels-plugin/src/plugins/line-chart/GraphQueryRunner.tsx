// Copyright 2021 The Perses Authors
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

import {
  AnyGraphQueryDefinition,
  useMemoized,
  useGraphQuery,
} from '@perses-ui/core';
import { createContext, useContext } from 'react';

export type QueryState = ReturnType<typeof useGraphQuery>;

const EMPTY_RESULTS: QueryState[] = [];

// Context provided by the GraphQueryRunner
const GraphQueryContext = createContext<QueryState[] | undefined>(undefined);

export interface GraphQueryRunnerProps {
  queries: AnyGraphQueryDefinition[];
  children: React.ReactNode;
}

/**
 * Component that runs a list of graph queries and then provides the
 * list of results to children via context.
 */
function GraphQueryRunner(props: GraphQueryRunnerProps) {
  const { queries, children } = props;

  if (queries.length === 0) {
    return (
      <GraphQueryContext.Provider value={EMPTY_RESULTS}>
        {children}
      </GraphQueryContext.Provider>
    );
  }

  return (
    <RunGraphQuery queries={queries} index={0} previousResults={EMPTY_RESULTS}>
      {children}
    </RunGraphQuery>
  );
}

export default GraphQueryRunner;

interface RunGraphQueryProps {
  queries: AnyGraphQueryDefinition[];
  index: number;
  previousResults: QueryState[];
  children: React.ReactNode;
}

// Internal component that actually runs a query in the array and adds the
// results of that query to the previous ones
function RunGraphQuery(props: RunGraphQueryProps) {
  const { queries, index, previousResults, children } = props;

  const query = queries[index];
  if (query === undefined) {
    throw new Error(`No query to run at index ${index}`);
  }

  const { data, loading, error } = useGraphQuery(query);
  const results = useMemoized(() => {
    return [...previousResults, { data, loading, error }];
  }, [previousResults, data, loading, error]);

  // If we're the last query in the array...
  if (index === queries.length - 1) {
    // Provide the state for all the running queries via context
    return (
      <GraphQueryContext.Provider value={results}>
        {children}
      </GraphQueryContext.Provider>
    );
  }

  // Otherwise, recursively render to keep unrolling the array
  return (
    <RunGraphQuery
      queries={queries}
      index={index + 1}
      previousResults={results}
    >
      {children}
    </RunGraphQuery>
  );
}

/**
 * Allows chilren of GraphQueryRunner to get the states of all queries that
 * have been run.
 */
export function useRunningGraphQueries(): QueryState[] {
  const context = useContext(GraphQueryContext);
  if (context === undefined) {
    throw new Error(
      'No time series queries found. Did you forget GraphQueryRunner?'
    );
  }
  return context;
}
