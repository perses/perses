// Copyright 2024 The Perses Authors
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

import { Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import EyeIcon from 'mdi-material-ui/EyeOutline';
import EyeOffIcon from 'mdi-material-ui/EyeOffOutline';
import { CellEditor, CellEditorProps } from './CellEditor';

export interface CellEditorContainerProps extends CellEditorProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onDelete: () => void;
}

export function CellEditorContainer({ cell, isCollapsed, onChange, onCollapse, onDelete }: CellEditorContainerProps) {
  function handleHideCell() {
    onChange({ ...cell, hide: !cell.hide });
  }

  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        alignItems="center"
        borderBottom={1}
        borderColor={(theme) => theme.palette.divider}
        justifyContent="space-between"
        gap={4}
      >
        <Stack direction="row" gap={1}>
          <IconButton data-testid={`cell-toggle#${cell.name}`} size="small" onClick={() => onCollapse(!isCollapsed)}>
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </IconButton>
          <Typography variant="overline" component="h4" sx={{ textTransform: 'none' }}>
            CELL:{' '}
            {cell.header ? (
              <span>
                <strong>{cell.header}</strong> ({cell.name})
              </span>
            ) : (
              <strong>{cell.name}</strong>
            )}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          {isCollapsed && (
            <>
              <Tooltip title={cell.hide ? 'Show cell' : 'Hide cell'} placement="top">
                <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={handleHideCell}>
                  {cell.hide ? <EyeOffIcon /> : <EyeIcon />}
                </IconButton>
              </Tooltip>
              <Divider flexItem orientation="vertical" variant="middle" />
            </>
          )}
          <Tooltip title="Remove cell settings" placement="top">
            <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      {!isCollapsed && <CellEditor cell={cell} onChange={onChange} />}
    </Stack>
  );
}
