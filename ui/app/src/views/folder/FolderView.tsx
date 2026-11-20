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

import { CircularProgress, Typography, Stack } from '@mui/material';
import type { FolderItem } from '@perses-dev/client';
import { useSnackbar } from '@perses-dev/components';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import { useFolderList } from '../../model/folder-client';
import { FolderBrowser } from './FolderBrowser';
import type { ResolvedPath } from './model';
import { NestedPathNotFound } from './NestedPathNotFound';

export const resolveFolderItems = (items: FolderItem[], nestedPath: string): ResolvedPath => {
  const response: ResolvedPath = { path: undefined };
  const foundPath: FolderItem[] = [];

  let breadth = items;
  const hierarchy = nestedPath.split('/');
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
  const { projectName, rootFolder, '*': nestedPath } = useParams();
  const {
    data: folderList,
    isPending,
    isPlaceholderData,
    isError,
    error,
  } = useFolderList({
    project: projectName,
    name: rootFolder,
    metadataOnly: false,
  });
  const { exceptionSnackbar } = useSnackbar();

  useEffect(() => {
    if (!isError) return;
    exceptionSnackbar(error);
  }, [isError, error, exceptionSnackbar]);

  if (isPending || isPlaceholderData) {
    return (
      <Stack width="100%" minHeight="60vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (!projectName || isError) {
    return (
      <Stack width="100%" minHeight="60vh" alignItems="center" justifyContent="center">
        <Typography>Unable to load folder!</Typography>
      </Stack>
    );
  }

  /* an exact match must be looked up  */
  const matchedRootFolder = folderList?.find((f) => f.metadata.name === rootFolder);

  if (!matchedRootFolder) {
    return (
      <Stack width="100%" minHeight="60vh" alignItems="center" justifyContent="center" spacing={1}>
        <Typography variant="h5">Folder not found</Typography>
        <Typography color="text.secondary"> The folder {rootFolder} could not be found!</Typography>
      </Stack>
    );
  }

  /* checking nested pat */
  let resolvedPath: ResolvedPath | undefined = undefined;
  if (nestedPath) {
    if (!matchedRootFolder.spec.items?.length) {
      return <NestedPathNotFound nestedPath={nestedPath} />;
    }

    resolvedPath = resolveFolderItems(matchedRootFolder.spec.items, nestedPath);
    if (!resolvedPath.path) {
      return <NestedPathNotFound nestedPath={nestedPath} />;
    }
  }

  return <FolderBrowser folder={matchedRootFolder} projectName={projectName} resolvedPath={resolvedPath} />;
};

/* export default is necessary for lazy loading */
export default FolderView;
