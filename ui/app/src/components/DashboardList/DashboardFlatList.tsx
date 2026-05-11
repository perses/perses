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

import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { ReactElement, useMemo } from 'react';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import {
  CREATED_AT_COL_DEF,
  DISPLAY_NAME_COL_DEF,
  PROJECT_COL_DEF,
  TAGS_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
  VIEWED_AT_COL_DEF,
} from '../list';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import { DashboardDataGrid, Row } from './DashboardDataGrid';

export interface DashboardFlatListProps {
  dashboardList: Row[];
  handleRenameButtonClick: (project: string, name: string) => () => void;
  handleDuplicateButtonClick: (project: string, name: string) => () => void;
  handleDeleteButtonClick: (project: string, name: string) => () => void;
  isLoading?: boolean;
  hideToolbar?: boolean;
  initialState?: GridInitialStateCommunity;
}

export function DashboardFlatList({
  dashboardList,
  handleRenameButtonClick,
  handleDuplicateButtonClick,
  handleDeleteButtonClick,
  isLoading,
  hideToolbar,
  initialState,
}: DashboardFlatListProps): ReactElement {
  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      PROJECT_COL_DEF,
      DISPLAY_NAME_COL_DEF,
      TAGS_COL_DEF,
      VERSION_COL_DEF,
      CREATED_AT_COL_DEF,
      UPDATED_AT_COL_DEF,
      VIEWED_AT_COL_DEF,
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        flex: 0.5,
        minWidth: 100,
        getActions: (params: GridRowParams<Row>): ReactElement[] => [
          <CRUDGridActionsCellItem
            key={params.id + '-edit'}
            icon={<PencilIcon />}
            label="Edit"
            action="update"
            scope="Dashboard"
            project={params.row.project}
            onClick={handleRenameButtonClick(params.row.project, params.row.name)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope="Dashboard"
            project={params.row.project}
            onClick={handleDuplicateButtonClick(params.row.project, params.row.name)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope="Dashboard"
            project={params.row.project}
            onClick={handleDeleteButtonClick(params.row.project, params.row.name)}
          />,
        ],
      },
    ],
    [handleRenameButtonClick, handleDuplicateButtonClick, handleDeleteButtonClick]
  );

  return (
    <DashboardDataGrid
      rows={dashboardList}
      columns={columns}
      initialState={initialState}
      hideToolbar={hideToolbar}
      isLoading={isLoading}
    />
  );
}
