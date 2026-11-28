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

import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import type { FolderItem } from '@perses-dev/client';
import { Table } from '@perses-dev/components';
import type { TableColumnConfig } from '@perses-dev/components';
import FolderOpenIcon from 'mdi-material-ui/FolderOpen';
import FolderOutlineIcon from 'mdi-material-ui/FolderOutline';
import DashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { getDashboardUrl, getFolderUrl } from './folderUtil';

export interface FolderContentProps {
  items: FolderItem[];
  folderName: string;
  projectName: string;
  rootFolder: string;
  folderPath: readonly string[];
}

const createColumns = (
  projectName: string,
  rootFolder: string,
  folderPath: readonly string[],
): Array<TableColumnConfig<FolderItem>> => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      align: 'left',
      width: 350,
      cellDescription: (): string => '',
      cell: ({ row }): ReactElement => {
        const item = row.original;
        const url =
          item.kind === 'Folder'
            ? getFolderUrl(projectName, rootFolder, [...folderPath, item.name])
            : getDashboardUrl(projectName, item.name);
        return (
          <Tooltip title={item.name} placement="right" arrow>
            <Typography
              component={Link}
              to={url}
              variant="body2"
              sx={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                overflow: 'hidden',
                minWidth: 0,
                maxWidth: '100%',
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              {item.kind === 'Folder' ? (
                <FolderOutlineIcon fontSize="small" sx={{ flexShrink: 0 }} />
              ) : (
                <DashboardOutlineIcon fontSize="small" sx={{ flexShrink: 0 }} />
              )}
              <Typography component="span" variant="body2" noWrap sx={{ minWidth: 1, flex: 1 }}>
                {item.name}
              </Typography>
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      id: 'kind',
      accessorKey: 'kind',
      header: 'Type',
      align: 'left',
      width: 150,
      cell: ({ row }): ReactElement => {
        return <Typography variant="body2">{row.original.kind}</Typography>;
      },
    },
  ];
};

//TODO:  npx oxlint src/views/folder/
export const FolderContents = ({
  items,
  folderName,
  folderPath,
  rootFolder,
  projectName,
}: FolderContentProps): ReactElement => {
  const columns = useMemo(
    () => createColumns(projectName, rootFolder, folderPath),
    [projectName, rootFolder, folderPath],
  );

  return (
    <Stack spacing={3} width="100%" sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <FolderOpenIcon
            sx={{
              fontSize: 36,
              color: 'warning.main',
              flexShrink: 0,
            }}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Tooltip title={folderName} placement="top" arrow>
              <Typography variant="h4" component="h1" fontWeight={600} noWrap>
                {folderName}
              </Typography>
            </Tooltip>

            <Typography variant="body2" color="text.secondary">
              Folder contents
            </Typography>
          </Box>
        </Stack>

        <Chip label={`${items.length} items`} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          minWidth: 0,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {items.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" spacing={1} py={8}>
            <FolderOpenIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="subtitle1" component="h2" fontWeight={600}>
              This folder is empty
            </Typography>
            <Typography color="text.secondary">No folders or dashboards to display.</Typography>
          </Stack>
        ) : (
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <Box sx={{ width: '100%', minWidth: 500 }}>
              <Table
                data={items}
                columns={columns}
                getRowId={(row) => `${row.kind}/${row.name}`}
                width="100%"
                height={Math.min(480, 64 + items.length * 52)}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Stack>
  );
};
