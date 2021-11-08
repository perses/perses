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
  AnyTimeSeriesQueryDefinition,
  useMemoized,
  useTimeSeriesQuery,
} from '@perses-ui/core';
import { createContext, useContext } from 'react';

export type QueryState = ReturnType<typeof useTimeSeriesQuery>;

const EMPTY_RESULTS: QueryState[] = [];

// Context provided by the TimeSeriesQueryRunner
const TimeSeriesQueryContext = createContext<QueryState[] | undefined>(
  undefined
);

export interface TimeSeriesQueryRunnerProps {
  queries: AnyTimeSeriesQueryDefinition[];
  children: React.ReactNode;
}

/**
 * Component that runs a list of time series queries and then provides the
 * list of results to children via context.
 */
function TimeSeriesQueryRunner(props: TimeSeriesQueryRunnerProps) {
  const { queries, children } = props;

  if (queries.length === 0) {
    return (
      <TimeSeriesQueryContext.Provider value={EMPTY_RESULTS}>
        {children}
      </TimeSeriesQueryContext.Provider>
    );
  }

  return (
    <RunTimeSeriesQuery
      queries={queries}
      index={0}
      previousResults={EMPTY_RESULTS}
    >
      {children}
    </RunTimeSeriesQuery>
  );
}

export default TimeSeriesQueryRunner;

interface RunTimeSeriesQueryProps {
  queries: AnyTimeSeriesQueryDefinition[];
  index: number;
  previousResults: QueryState[];
  children: React.ReactNode;
}

// Internal component that actually runs a query in the array and adds the
// results of that query to the previous ones
function RunTimeSeriesQuery(props: RunTimeSeriesQueryProps) {
  const { queries, index, previousResults, children } = props;

  const query = queries[index];
  if (query === undefined) {
    throw new Error(`No query to run at index ${index}`);
  }

  const { data, loading, error } = useTimeSeriesQuery(query);
  const results = useMemoized(() => {
    return [...previousResults, { data, loading, error }];
  }, [previousResults, data, loading, error]);

  // If we're the last query in the array...
  if (index === queries.length - 1) {
    // Provide the state for all the running queries via context
    return (
      <TimeSeriesQueryContext.Provider value={results}>
        {children}
      </TimeSeriesQueryContext.Provider>
    );
  }

  // Otherwise, recursively render to keep unrolling the array
  return (
    <RunTimeSeriesQuery
      queries={queries}
      index={index + 1}
      previousResults={results}
    >
      {children}
    </RunTimeSeriesQuery>
  );
}

/**
 * Allows chilren of TimeSeriesQueryRunner to get the states of all queries that
 * have been run.
 */
export function useRunningTimeSeriesQueries(): QueryState[] {
  const context = useContext(TimeSeriesQueryContext);
  if (context === undefined) {
    throw new Error(
      'No time series queries found. Did you forget TimeSeriesQueryRunner?'
    );
  }
  return context;
}
