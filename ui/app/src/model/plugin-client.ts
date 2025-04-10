import { StatusError, fetchJson } from '@perses-dev/core';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import { UseQueryOptions, UseQueryResult, useQuery } from '@tanstack/react-query';
import buildURL from './url-builder';

const resource = 'plugins';

export function usePlugins(
  options?: UseQueryOptions<PluginModuleResource[], StatusError>
): UseQueryResult<PluginModuleResource[], StatusError> {
  return useQuery<PluginModuleResource[], StatusError>({
    queryKey: ['plugins'],
    queryFn: fetchPlugins,
    ...options,
  });
}

export function fetchPlugins(): Promise<PluginModuleResource[]> {
  const url = buildURL({ resource, apiPrefix: '/api/v1' });
  return fetchJson<PluginModuleResource[]>(url);
}
