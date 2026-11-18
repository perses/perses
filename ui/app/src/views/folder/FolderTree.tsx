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

import { Box, Stack, Typography, IconButton, ListItemButton, Tooltip } from '@mui/material';
import type { FolderItem, FolderResource } from '@perses-dev/client';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import FolderOutlineIcon from 'mdi-material-ui/FolderOutline';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { getFolderUrl } from './folderUtil';
import type { ResolvedPath } from './model';

export interface FolderTreeProps {
  folder: FolderResource;
  projectName: string;
  targetPath?: ResolvedPath;
  isPathExpanded: (url: string) => boolean;
  toggleFolder: (url: string) => void;
}

export const renderFolders = (
  items: FolderItem[],
  cursor: FolderItem[],
  depth: number,
  projectName: string,
  rootFolder: string,
  parentPath: readonly string[],
  isPathExpanded: (url: string) => boolean,
  toggleFolder: (url: string) => void,
): ReactNode => {
  return items
    .filter((item) => item.kind === 'Folder')
    .map((item) => {
      const path = [...parentPath, item.name];

      const url = getFolderUrl(projectName, rootFolder, path);

      const included = item.kind === 'Folder' && cursor[0] === item;
      const nextCursor = included ? cursor.slice(1) : [];
      const isSelected = included && cursor.length === 1;

      const isExpanded = isPathExpanded(url);
      const hasChildren = item.items?.some((child) => child.kind === 'Folder') ?? false;

      return (
        <Box key={url}>
          <Stack direction="row" alignItems="center" spacing={0} sx={{ pl: depth * 2, minWidth: 0 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => {
                  toggleFolder(url);
                }}
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            ) : (
              <Box sx={{ width: 34, flexShrink: 0 }} />
            )}
            <Tooltip title={item.name} placement="right" arrow>
              <ListItemButton
                component={Link}
                to={url}
                selected={isSelected}
                aria-current={isSelected ? 'page' : undefined}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 36,
                  px: 0.5,
                  py: 0.5,
                  gap: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <FolderOutlineIcon sx={{ color: included ? 'warning.main' : undefined }} fontSize="small" />
                <Typography noWrap sx={{ color: 'text.primary', minWidth: 0, flex: 1 }} variant="body2">
                  {item.name}
                </Typography>
              </ListItemButton>
            </Tooltip>
          </Stack>
          {isExpanded &&
            renderFolders(
              item.items ?? [],
              nextCursor,
              depth + 1,
              projectName,
              rootFolder,
              path,
              isPathExpanded,
              toggleFolder,
            )}
        </Box>
      );
    });
};

// The sidebar is intentionally scoped to the root folder specified in the URL.
// It provides navigation within that hierarchy, not across all project roots.
// Other root folders remain accessible through the project's folder listing.

export const FolderTree = ({
  folder,
  projectName,
  targetPath,
  isPathExpanded,
  toggleFolder,
}: FolderTreeProps): ReactElement => {
  const cursor = targetPath ? [...(targetPath.path ?? [])] : [];
  const rootUrl = getFolderUrl(projectName, folder.metadata.name);
  const isRootSelected = cursor.length === 0;
  const rootName = folder.spec.display?.name ?? folder.metadata.name;

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={rootName} placement="right" arrow>
          <ListItemButton
            component={Link}
            to={rootUrl}
            selected={isRootSelected}
            aria-current={isRootSelected ? 'page' : undefined}
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 36,
              px: 0.5,
              py: 0.5,
              gap: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-selected': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <FolderOutlineIcon sx={{ color: 'warning.main', flexShrink: 0 }} fontSize="small" />
            <Typography noWrap sx={{ color: 'text.primary', minWidth: 0, flex: 1 }} variant="body2">
              {folder.spec.display?.name ?? folder.metadata.name}
            </Typography>
          </ListItemButton>
        </Tooltip>
      </Stack>
      {renderFolders(
        folder.spec.items ?? [],
        cursor,
        1,
        projectName,
        folder.metadata.name,
        [],
        isPathExpanded,
        toggleFolder,
      )}
    </Box>
  );
};
