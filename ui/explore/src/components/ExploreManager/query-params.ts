import queryString from 'query-string';
import { encodeQueryParams, JsonParam, StringParam, useQueryParams } from 'use-query-params';
import { TimeRangeParam } from '@perses-dev/plugin-system';

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
  return queryString.stringify(encodeQueryParams(explorerQueryConfig, { ...query, ...inputs }));
}
