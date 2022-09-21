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

import React, { useContext, useMemo } from 'react';
import { QueryString, QueryStringContext } from '@perses-dev/plugin-system';

export interface QueryStringProviderProps {
  queryString: URLSearchParams;
  setQueryString?: (queryString: URLSearchParams) => void;
  children?: React.ReactNode;
}

/**
 * Allows apps to provide their own query string implementations
 */
export function QueryStringProvider(props: QueryStringProviderProps) {
  const { queryString, setQueryString, children } = props;

  const ctx = useMemo(() => ({ queryString, setQueryString }), [queryString, setQueryString]);

  return <QueryStringContext.Provider value={ctx}>{children}</QueryStringContext.Provider>;
}

export function useQueryString(): QueryString {
  const ctx = useContext(QueryStringContext);
  if (ctx === undefined) {
    throw new Error('No QueryStringContext found. Did you forget a Provider?');
  }
  return ctx;
}
