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

import { fetch, fetchJson, FolderResource, StatusError } from '@perses-dev/core';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';

export const resource: string = 'folders' as const;

type FolderListOptions = Omit<UseQueryOptions<FolderResource[], StatusError>, 'queryKey' | 'queryFn'> & {
  /**
   * Name prefix to filter the list of folders.
   */
  name?: string;
  /**
   * Project to filter the list of folders.
   */
  project?: string;
  metadataOnly?: boolean;
};

/**
 * Returns the list of folders, optionally filtered by project, name prefix, or metadata-only mode.
 */
export function useFolderList(options: FolderListOptions): UseQueryResult<FolderResource[], StatusError> {
  const { project, metadataOnly, name, ...restOptions } = options;
  return useQuery<FolderResource[], StatusError>({
    queryKey: [resource, project, name, metadataOnly],
    queryFn: () => {
      return getFolders(options.project, options.metadataOnly, name);
    },
    ...restOptions,
  });
}

/**
 * Returns a mutation that creates a folder and invalidates the folder list cache.
 */
export function useCreateFolderMutation(): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [resource],
    mutationFn: (folder) => {
      return createFolder(folder);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

/**
 * Returns a mutation that updates a folder and invalidates the folder list cache.
 */
export function useUpdateFolderMutation(): UseMutationResult<FolderResource, Error, FolderResource> {
  const queryClient = useQueryClient();

  return useMutation<FolderResource, Error, FolderResource>({
    mutationKey: [resource],
    mutationFn: (folder) => {
      return updateFolder(folder);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

/**
 * Returns a mutation that deletes a folder and invalidates the folder list cache.
 */
export function useDeleteFolderMutation(): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [resource],
    mutationFn: async (entity: FolderResource) => {
      await deleteFolder(entity);
      return entity;
    },
    onSuccess: (entity: FolderResource) => {
      queryClient.removeQueries({ queryKey: [resource, entity.metadata.project, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

function createFolder(entity: FolderResource): Promise<FolderResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project });
  return fetchJson<FolderResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getFolders(project?: string, metadataOnly: boolean = false, name?: string): Promise<FolderResource[]> {
  const queryParams = new URLSearchParams();
  if (metadataOnly) {
    queryParams.set('metadata_only', 'true');
  }
  if (name) {
    queryParams.set('name', name);
  }
  const url = buildURL({ resource: resource, project: project, queryParams: queryParams });
  return fetchJson<FolderResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}
function updateFolder(entity: FolderResource): Promise<FolderResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<FolderResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function deleteFolder(entity: FolderResource): Promise<Response> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
