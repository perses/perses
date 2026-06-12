// Copyright The Perses Authors
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
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { fetchJson, StatusError } from '@perses-dev/client';
import { DashboardResource } from '@perses-dev/dashboards';
import { useNavHistory } from '../context/DashboardNavHistory';
import { useImportantDashboardSelectors } from '../context/Config';
import { useIsAutoRefreshDashboardsEnabled } from '../context/Config';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import buildURL from './url-builder';

export const resource = 'dashboards';

/**
 * Shape of the SSE event payload sent by the backend watch endpoint.
 */
interface WatchEvent {
  kind: string;
  project: string;
  name: string;
  action: 'create' | 'update' | 'delete';
}

/**
 * Reads an SSE stream from a fetch Response and calls onEvent for every
 * `event: resource` message. Resolves when the stream ends (server closed),
 * rejects on network / parse errors.
 *
 * Implementing SSE over fetch (instead of EventSource) ensures:
 * - The global fetch proxy (auth token refresh on 401) intercepts the request.
 * - We get explicit error visibility instead of silent reconnect loops.
 * - The dev-server proxy forwards the response as a stream (no buffering).
 */
async function readSSEStream(
  response: Response,
  onEvent: (event: WatchEvent) => void,
  signal: AbortSignal
): Promise<void> {
  if (!response.body) throw new Error('SSE response has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEventType = '';
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (trimmed === '') {
          // Empty line signals end-of-event; reset event type.
          currentEventType = '';
        } else if (trimmed.startsWith('event: ')) {
          currentEventType = trimmed.slice(7).trim();
        } else if (trimmed.startsWith('data: ') && currentEventType === 'resource') {
          try {
            const watchEvent = JSON.parse(trimmed.slice(6)) as WatchEvent;
            onEvent(watchEvent);
          } catch {
            console.error('[DashboardWatcher] failed to parse event data:', trimmed.slice(6));
          }
        }
        // Lines starting with ':' are SSE comments (keepalive) — safely ignored.
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Connects to the backend SSE watch endpoint for dashboards and invalidates
 * React Query caches whenever a dashboard is created, updated or deleted.
 *
 * Only active when `frontend.event_watching.auto_refresh_dashboards` is true.
 *
 * Uses fetch (not EventSource) so that:
 * - The global fetch interceptor handles JWT refresh on 401.
 * - Connection errors are visible and trigger a controlled retry.
 * - No silent reconnect loops on auth failures.
 */
export function useDashboardWatcher(): void {
  const queryClient = useQueryClient();
  const isEnabled = useIsAutoRefreshDashboardsEnabled();

  useEffect(() => {
    if (!isEnabled) return;

    const abortController = new AbortController();
    let retryDelay = 1000; // ms, doubles on each error up to 30 s

    const connect = (): void => {
      if (abortController.signal.aborted) return;
      const url = buildURL({ resource: 'watch/dashboards' });
      console.debug('[DashboardWatcher] connecting to', url);

      fetch(url, {
        headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`[DashboardWatcher] HTTP ${response.status}`);
          }
          console.debug('[DashboardWatcher] connected');
          retryDelay = 1000; // reset backoff on successful connection
          await readSSEStream(
            response,
            (event) => {
              console.debug('[DashboardWatcher] event received', event);
              // Invalidate all dashboard queries — project/name filtering is done
              // by React Query's partial-key matching at the consumer level.
              void queryClient.invalidateQueries({ queryKey: [resource] });
            },
            abortController.signal
          );
        })
        .catch((err: Error) => {
          if (abortController.signal.aborted) return; // intentional close
          console.warn(`[DashboardWatcher] connection lost, retrying in ${retryDelay}ms`, err.message);
          setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, 30_000);
            connect();
          }, retryDelay);
        });
    };

    connect();
    return () => {
      abortController.abort();
    };
  }, [isEnabled, queryClient]);
}

type DashboardListOptions = Omit<UseQueryOptions<DashboardResource[], StatusError>, 'queryKey' | 'queryFn'> & {
  project?: string;
  metadataOnly?: boolean;
};

/**
 * Used to create a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useCreateDashboardMutation(
  onSuccess?: (data: DashboardResource, variables: DashboardResource) => Promise<unknown> | unknown
): UseMutationResult<DashboardResource, StatusError, DashboardResource> {
  const queryClient = useQueryClient();

  return useMutation<DashboardResource, StatusError, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      return createDashboard(dashboard);
    },
    onSuccess: onSuccess,
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

/**
 * Used to get a dashboard in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboard(project: string, name: string): UseQueryResult<DashboardResource, StatusError> {
  return useQuery<DashboardResource, StatusError>({
    queryKey: [resource, project, name],
    queryFn: () => {
      return getDashboard(project, name);
    },
  });
}

/**
 * Used to get dashboards in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboardList(options: DashboardListOptions): UseQueryResult<DashboardResource[], StatusError> {
  return useQuery<DashboardResource[], StatusError>({
    queryKey: [resource, options.project, options.metadataOnly],
    queryFn: () => {
      return getDashboards(options.project, options.metadataOnly);
    },
    ...options,
  });
}

export interface DatedDashboards {
  dashboard: DashboardResource;
  date: string;
}

/**
 * Used to get dashboards seen recently by the user.
 * Will automatically be refreshed when cache is invalidated or history modified
 */
export function useRecentDashboardList(
  project?: string,
  maxSize?: number
): {
  isLoading: false | true;
  data: DatedDashboards[];
} {
  const { data, isLoading } = useDashboardList({ project: project, metadataOnly: true });
  const history = useNavHistory();

  const result = useMemo(() => {
    // Wrapping dashboard with their last seen date from nav history context
    const result: DatedDashboards[] = [];

    // Iterating with history first to keep history order in the result
    (history ?? []).forEach((historyItem) => {
      const dashboard = (data ?? []).find(
        (dashboard) =>
          historyItem.project === dashboard.metadata.project && historyItem.name === dashboard.metadata.name
      );
      if (dashboard) {
        result.push({ dashboard: dashboard, date: historyItem.date });
      }
    });

    if (maxSize) {
      return result.slice(0, maxSize);
    }

    return result;
  }, [data, history, maxSize]);

  return { data: result, isLoading: isLoading };
}

/**
 * Used to get important dashboards.
 * Will automatically be refreshed when cache is invalidated or history modified
 */
export function useImportantDashboardList(project?: string): {
  isLoading: false | true;
  data: DashboardResource[];
  error: StatusError | null;
} {
  const { data: dashboards, isLoading, error } = useDashboardList({ project: project, metadataOnly: true });
  const importantDashboardSelectors = useImportantDashboardSelectors();

  const importantDashboards = useMemo(() => {
    const result: DashboardResource[] = [];
    importantDashboardSelectors.forEach((selector) => {
      const dashboard = (dashboards ?? []).find(
        (dashboard) => selector.project === dashboard.metadata.project && selector.dashboard === dashboard.metadata.name
      );
      if (dashboard) {
        result.push(dashboard);
      }
    });
    return result;
  }, [dashboards, importantDashboardSelectors]);
  return { data: importantDashboards, isLoading: isLoading, error };
}

/**
 * Used to update a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useUpdateDashboardMutation(): UseMutationResult<DashboardResource, Error, DashboardResource> {
  const queryClient = useQueryClient();

  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      return updateDashboard(dashboard);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

/**
 * Used to delete a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useDeleteDashboardMutation(): UseMutationResult<DashboardResource, Error, DashboardResource> {
  const queryClient = useQueryClient();
  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (entity: DashboardResource) => {
      return deleteDashboard(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (dashboard) => {
      queryClient.removeQueries({ queryKey: [resource, dashboard.metadata.project, dashboard.metadata.name] });
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function createDashboard(entity: DashboardResource): Promise<DashboardResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getDashboard(project: string, name: string): Promise<DashboardResource> {
  const url = buildURL({ resource: resource, project: project, name: name });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getDashboards(project?: string, metadataOnly: boolean = false): Promise<DashboardResource[]> {
  const queryParams = new URLSearchParams();
  if (metadataOnly) {
    queryParams.set('metadata_only', 'true');
  }
  const url = buildURL({ resource: resource, project: project, queryParams: queryParams });
  return fetchJson<DashboardResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateDashboard(entity: DashboardResource): Promise<DashboardResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteDashboard(entity: DashboardResource): Promise<Response> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
