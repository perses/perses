import { useQuery, UseQueryOptions } from 'react-query';
import { fetchJson, GlobalDatasourceModel } from '@perses-ui/core';
import buildURL from './url-builder';

const resource = 'globaldatasources';

type GlobalDatasourceListOptions = Omit<UseQueryOptions<GlobalDatasourceModel[], Error>, 'queryKey' | 'queryFn'>;

export function useGlobalDatasourceQuery(options?: GlobalDatasourceListOptions) {
  return useQuery<GlobalDatasourceModel[], Error>(
    resource,
    () => {
      const url = buildURL({ resource });
      return fetchJson<GlobalDatasourceModel[]>(url);
    },
    options
  );
}
