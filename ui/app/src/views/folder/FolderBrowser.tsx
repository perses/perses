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

import { FolderContents } from './FolderContents';
import { FolderTree } from './FolderTree';
import { getFolderUrl } from './folderUtil';
import type { ResolvedPath } from './model';

export interface FolderBrowserProps {
  folder: FolderResource;
  projectName: string;
  resolvedPath?: ResolvedPath;
}

export const FolderBrowser = ({ folder, projectName, resolvedPath }: FolderBrowserProps): ReactElement => {
  const [toggled, setToggle] = useState<ReadonlyMap<string, boolean>>(() => new Map());

  const activePaths = new Set<string>();

  const pathSegments: string[] = [];
  for (const item of resolvedPath?.path ?? []) {
    pathSegments.push(item.name);
    activePaths.add(getFolderUrl(projectName, folder.metadata.name, pathSegments));
  }

  const isPathExpanded = (pathUrl: string): boolean => {
    return toggled.get(pathUrl) ?? activePaths.has(pathUrl);
  };

  const toggleFolder = (pathUrl: string): void => {
    setToggle((prev) => {
      const next = new Map(prev);
      const isExpanded = prev.get(pathUrl) ?? activePaths.has(pathUrl);
      next.set(pathUrl, !isExpanded);
      return next;
    });
  };

  const selectedFolder = resolvedPath?.path?.at(-1);
  const items = selectedFolder ? (selectedFolder.items ?? []) : (folder.spec.items ?? []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        flex: 1,
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', md: 280 },
          flexShrink: 0,
          minWidth: 0,
          overflow: 'auto',
          maxHeight: { xs: 240, md: 'none' },
          borderRight: { xs: 0, md: 1 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: 'divider',
          p: 2,
        }}
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
      <Box sx={{ flex: 1, minWidth: 0, p: 2, width: '100%' }}>
        <Typography>Folder Contents</Typography>
        <FolderContents
          items={items}
          folderName={selectedFolder?.name ?? folder.metadata.name}
          rootFolder={folder.metadata.name}
          projectName={projectName}
          folderPath={pathSegments}
        />
      </Box>
    </Box>
  );
};
