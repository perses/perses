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

import { Box, Typography } from '@mui/material';
import type { FolderResource } from '@perses-dev/client';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import { FolderContents } from './FolderContents';
import { FolderTree } from './FolderTree';
import type { ResolvedPath } from './model';

export interface FolderBrowserProps {
  folder: FolderResource;
  projectName: string;
  resolvedPath?: ResolvedPath;
}

export const FolderBrowser = ({ folder, projectName, resolvedPath }: FolderBrowserProps): ReactElement => {
  const location = useLocation();
  const [treeState, setTreeState] = useState<{ pathName: string; expanded: Set<string> }>(() => ({
    pathName: '',
    expanded: new Set(),
  }));

  const activePaths = new Set<string>();
  let url = `/projects/${encodeURIComponent(projectName)}/folders/${encodeURIComponent(folder.metadata.name)}`;
  for (const item of resolvedPath?.path ?? []) {
    url += `/${encodeURIComponent(item.name)}`;
    activePaths.add(url);
  }

  if (treeState.pathName !== location.pathname) {
    setTreeState((prev) => ({
      pathName: location.pathname,
      expanded: new Set([...prev.expanded, ...activePaths]),
    }));
  }

  const isPathExpanded = (pathUrl: string): boolean => {
    return treeState.expanded.has(pathUrl);
  };

  const toggleFolder = (pathUrl: string): void => {
    setTreeState((prev) => {
      const expanded = new Set(prev.expanded);
      if (expanded.has(pathUrl)) {
        expanded.delete(pathUrl);
      } else {
        expanded.add(pathUrl);
      }
      return { ...prev, expanded };
    });
  };

  const selectedFolder = resolvedPath?.path?.at(-1);
  const items = selectedFolder ? (selectedFolder.items ?? []) : (folder.spec.items ?? []);

  const folderURL = [
    '',
    'projects',
    encodeURIComponent(projectName),
    'folders',
    encodeURIComponent(folder.metadata.name),
    ...(resolvedPath?.path ?? []).map((item) => encodeURIComponent(item.name)),
  ].join('/');

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: 0, flex: 1 }}>
      <Box
        sx={{ width: 280, flexShrink: 0, overflow: 'auto', borderRight: 1, borderColor: 'divider', p: 2, minHeight: 0 }}
      >
        <Typography>Folder Tree</Typography>
        <FolderTree
          isPathExpanded={isPathExpanded}
          toggleFolder={toggleFolder}
          targetPath={resolvedPath}
          projectName={projectName}
          folder={folder}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography>Folder Contents</Typography>
        <FolderContents
          items={items}
          folderName={selectedFolder?.name ?? folder.metadata.name}
          folderUrl={folderURL}
          projectName={projectName}
        />
      </Box>
    </Box>
  );
};
