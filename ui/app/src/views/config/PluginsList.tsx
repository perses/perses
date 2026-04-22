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

import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { NoDataOverlay, useSnackbar } from '@perses-dev/components';
import { useMemo, useState } from 'react';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import type { PluginModuleResource } from '@perses-dev/plugin-system';
import type { ReactElement } from 'react';
import { DATA_GRID_SLOT_PROPS, DATA_GRID_STYLES, GridToolbar, PAGE_SIZE_OPTIONS } from '../../components/datagrid';
import { PersesLoader } from '../../components/PersesLoader';
import { usePlugins } from '../../model/plugin-client';
import { PluginDetailsDialog } from './PluginDetailsDialog';

interface PluginRow {
  id: string;
  name: string;
  version: string;
  pluginCount: number;
  kinds: string[];
  pluginModule: PluginModuleResource;
}

function NoPluginRowOverlay(): ReactElement {
  return <NoDataOverlay resource="plugins" />;
}

export function PluginsList(): ReactElement {
  const [selectedPluginModule, setSelectedPluginModule] = useState<PluginModuleResource | null>(null);
  const { exceptionSnackbar } = useSnackbar();

  const { data: pluginModules, isLoading, error } = usePlugins();

  const rows = useMemo<PluginRow[]>(() => {
    return (pluginModules ?? [])
      .toSorted((a, b) => a.metadata.name.localeCompare(b.metadata.name))
      .map((pluginModule) => ({
        id: `${pluginModule.metadata.name}-${pluginModule.metadata.version}`,
        name: pluginModule.metadata.name,
        version: pluginModule.metadata.version,
        pluginCount: pluginModule.spec.plugins.length,
        kinds: [...new Set(pluginModule.spec.plugins.map((plugin) => plugin.kind))],
        pluginModule,
      }));
  }, [pluginModules]);

  const columns = useMemo<Array<GridColDef<PluginRow>>>(
    () => [
      {
        field: 'name',
        headerName: 'Module',
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }: GridRenderCellParams<PluginRow, string>): ReactElement => (
          <Stack spacing={0.5} sx={{ justifyContent: 'center', height: '100%', py: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Version {row.version}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'pluginCount',
        headerName: 'Plugins',
        width: 120,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'kinds',
        headerName: 'Kinds',
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<PluginRow, string[]>): ReactElement => (
          <Stack direction="row" gap={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', height: '100%', py: 1 }}>
            {row.kinds.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                None
              </Typography>
            ) : (
              row.kinds.map((kind) => <Chip key={kind} label={kind} size="small" variant="outlined" />)
            )}
          </Stack>
        ),
      },
      {
        field: 'actions',
        headerName: 'Details',
        width: 140,
        sortable: false,
        filterable: false,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }: GridRenderCellParams<PluginRow>): ReactElement => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
              width: '100%',
            }}
          >
            <Button size="small" onClick={() => setSelectedPluginModule(row.pluginModule)}>
              Inspect
            </Button>
          </Box>
        ),
      },
    ],
    []
  );

  if (isLoading || pluginModules === undefined) {
    return <PersesLoader />;
  }

  if (error) {
    exceptionSnackbar(error);
  }

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <DataGrid
        autoHeight
        disableRowSelectionOnClick
        getRowHeight={() => 'auto'}
        rows={rows}
        columns={columns}
        slots={{ toolbar: GridToolbar, noRowsOverlay: NoPluginRowOverlay }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        slotProps={DATA_GRID_SLOT_PROPS}
        sx={{
          ...DATA_GRID_STYLES,
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-cell--withRenderer': {
            py: 0.5,
          },
        }}
      />
      <PluginDetailsDialog selectedPluginModule={selectedPluginModule} onClose={() => setSelectedPluginModule(null)} />
    </Box>
  );
}
