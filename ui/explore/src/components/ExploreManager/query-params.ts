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

import { encodeQueryParams, JsonParam, StringParam, useQueryParams } from 'use-query-params';
import { TimeRangeParam } from '@perses-dev/plugin-system';
import { stringify } from 'qs';

export const explorerQueryConfig = {
  refresh: TimeRangeParam,
  start: TimeRangeParam,
  end: TimeRangeParam,
  explorer: StringParam,
  data: JsonParam,
};

interface ExplorerQueryData {
  refresh?: Date;
  start?: Date;
  end?: Date;
  explorer?: string;
  data?: Record<string, unknown>;
}

// Provide a query string for the explorer page using the given inputs, but also including any existing query params
export function useExplorerQueryParams(inputs: ExplorerQueryData): string {
  const [query] = useQueryParams(explorerQueryConfig, { updateType: 'replaceIn' });
  return stringify(encodeQueryParams(explorerQueryConfig, { ...query, ...inputs }));
}
