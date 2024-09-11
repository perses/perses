import { encodeQueryParams, JsonParam, StringParam } from 'use-query-params';
import queryString from 'query-string';
import { FinderQueryParams } from './types';

export function encodeQueryData(data: FinderQueryParams): string {
  return queryString.stringify(
    encodeQueryParams({ explorer: StringParam, data: JsonParam }, { explorer: 'metric', data: { ...data, tab: 2 } })
  );
}
