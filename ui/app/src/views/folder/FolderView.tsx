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

import { CircularProgress, Stack } from '@mui/material';
import type { FolderItem } from '@perses-dev/client';
import type { ReactElement } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { useFolder } from '../../model/folder-client';
import { FolderBrowser } from './FolderBrowser';
import { FolderViewException } from './FolderViewException';
import type { ResolvedPath } from './model';
import { PathNotFound } from './PathNotFound';

export const resolveFolderItems = (items: FolderItem[], nestedPath: string): ResolvedPath => {
  const response: ResolvedPath = { path: undefined };
  const foundPath: FolderItem[] = [];

  let breadth = items;
  const hierarchy = nestedPath.split('/').filter(Boolean).map(decodeURIComponent);
  const requestedPathLength = hierarchy.length;
  while (hierarchy.length) {
    const current = hierarchy.shift();
    const found = breadth.find((p) => p.kind === 'Folder' && p.name === current);
    if (!found) {
      break;
    }
    foundPath.push(found);
    if (!found.items?.length) {
      break;
    }
    breadth = found.items;
  }

  if (foundPath.length === requestedPathLength) {
    response.path = foundPath;
  }

  return response;
};

const FolderView = (): ReactElement => {
  const { projectName, rootFolder } = useParams();
  const { pathname } = useLocation();

  /**
   * Preserve encoded slashes (%2F) in folder names so they are not
   * mistaken for hierarchy separators.
   * Split the path before decoding
   * Example: Folder name SRE / Ops
   */

  const encodedNestedPath = pathname.match(/\/projects\/[^/]+\/folders\/[^/]+\/(.*)$/)?.[1] ?? '';

  const {
    data: folder,
    isPending,
    isError,
    isFetching,
    error,
    refetch,
  } = useFolder(projectName ?? '', rootFolder ?? '', {
    enabled: Boolean(projectName && rootFolder),
  });

  if (!projectName || !rootFolder) {
    const destination = projectName ? `/projects/${encodeURIComponent(projectName)}` : '/projects';
    return <Navigate to={destination} replace />;
  }

  if (isPending) {
    return (
      <Stack width="100%" minHeight="60vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (isError || !folder) {
    return (
      <FolderViewException
        error={error}
        isFetching={isFetching}
        projectName={projectName}
        refetch={refetch}
        rootFolder={rootFolder}
      />
    );
  }

  let resolvedPath: ResolvedPath | undefined = undefined;
  if (encodedNestedPath) {
    if (!folder.spec.items?.length) {
      return <PathNotFound path={encodedNestedPath} />;
    }

    resolvedPath = resolveFolderItems(folder.spec.items, encodedNestedPath);
    if (!resolvedPath.path) {
      return <PathNotFound path={encodedNestedPath} />;
    }
  }

  return <FolderBrowser folder={folder} projectName={projectName} resolvedPath={resolvedPath} />;
};

export default FolderView;
