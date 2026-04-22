import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { HTTPMethodPOST, HTTPHeader, HTTPMethodGET, HTTPMethodPUT, HTTPMethodDELETE } from './http';
import buildURL from './url-builder';
import { fetchJson, FolderResource, DashboardResource, StatusError } from '@perses-dev/core';
import { useActiveUser } from './auth-client';

export interface FolderWithDashboards extends FolderResource {
  dashboards: DashboardResource[];
  spec: any;
}

// change this if Perses uses a different resource name for folders
const folderResource = 'folders';

export function createFolder(owner: string | undefined, entity: FolderResource): Promise<FolderResource> {
  const url = buildURL({ resource: folderResource, project: entity.metadata.project, owner });
  return fetchJson<FolderResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getFolders(owner: string | undefined, project?: string): Promise<FolderWithDashboards[]> {
  const url = buildURL({ resource: folderResource, project, owner });
  return fetchJson<FolderWithDashboards[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export interface FolderListOptions {
  project?: string;
}

export function updateFolder(owner: string | undefined, entity: FolderResource): Promise<FolderResource> {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource: folderResource, name, project, owner });
  return fetchJson<FolderResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteFolder(owner: string | undefined, entity: FolderResource): Promise<Response> {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource: folderResource, name, project, owner });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

export function useFolderList(options: FolderListOptions): UseQueryResult<FolderWithDashboards[], StatusError> {
  const owner = useActiveUser();
  return useQuery<FolderWithDashboards[], StatusError>({
    queryKey: [folderResource, options.project],
    queryFn: () => getFolders(owner, options.project),
    ...options,
  });
}

export function useCreateFolderMutation(
  onSuccess?: (data: FolderResource, variables: FolderResource) => Promise<unknown> | unknown
): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();
  const owner = useActiveUser();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [folderResource],
    mutationFn: (folder) => createFolder(owner, folder),
    onSuccess,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [folderResource] }),
  });
}

export function useUpdateFolderMutation(): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();
  const owner = useActiveUser();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [folderResource],
    mutationFn: (folder: FolderResource) => updateFolder(owner, folder),
    onSuccess: (entity: FolderResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [folderResource, entity.metadata.project] }),
        queryClient.invalidateQueries({ queryKey: [folderResource] }),
      ]);
    },
  });
}

export function useDeleteFolderMutation(): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();
  const owner = useActiveUser();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [folderResource],
    mutationFn: async (entity: FolderResource) => {
      await deleteFolder(owner, entity);
      return entity;
    },
    onSuccess: (entity: FolderResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [folderResource, entity.metadata.project] }),
        queryClient.invalidateQueries({ queryKey: [folderResource] }),
      ]);
    },
  });
}
