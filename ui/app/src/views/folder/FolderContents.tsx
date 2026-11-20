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

import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { FolderItem } from '@perses-dev/client';
import { Table } from '@perses-dev/components';
import type { TableColumnConfig } from '@perses-dev/components';
import FolderOpenIcon from 'mdi-material-ui/FolderOpen';
import FolderOutlineIcon from 'mdi-material-ui/FolderOutline';
import DashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export interface FolderContentProps {
  items: FolderItem[];
  folderName: string;
  folderUrl: string;
  projectName: string;
}

export const FolderContents = ({ items, folderName, folderUrl, projectName }: FolderContentProps): ReactElement => {
  const columns: Array<TableColumnConfig<FolderItem>> = [
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
            ? `${folderUrl}/${encodeURIComponent(item.name)}`
            : `/projects/${encodeURIComponent(projectName)}/dashboards/${encodeURIComponent(item.name)}`;
        return (
          <Typography
            component={Link}
            to={url}
            variant="body2"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.primary', textDecoration: 'none' }}
          >
            {item.kind === 'Folder' ? (
              <FolderOutlineIcon fontSize="small" />
            ) : (
              <DashboardOutlineIcon fontSize="small" />
            )}
            {item.name}
          </Typography>
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

  return (
    <Stack spacing={3} width="100%">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <FolderOpenIcon sx={{ fontSize: 36, color: 'warning.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {folderName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Folder contents
            </Typography>
          </Box>
        </Stack>

        <Chip label={`${items.length} items`} size="small" variant="outlined" />
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {items.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" spacing={1} py={8}>
            <FolderOpenIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="h6">This folder is empty</Typography>
            <Typography color="text.secondary">No folders or dashboards to display.</Typography>
          </Stack>
        ) : (
          <Table
            data={items}
            columns={columns}
            getRowId={(row) => `${row.kind}/${row.name}`}
            width="100%"
            height={Math.min(480, 64 + items.length * 52)}
          />
        )}
      </Paper>
    </Stack>
  );
};
