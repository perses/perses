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
import { DragAndDropElement, DragButton } from '@perses-dev/components';
import { ReactElement } from 'react';
import { ColumnEditor, ColumnEditorProps } from './ColumnEditor';

export interface ColumnEditorContainerProps extends ColumnEditorProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ColumnEditorContainer({
  column,
  isCollapsed,
  onChange,
  onCollapse,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ColumnEditorContainerProps): ReactElement {
  function handleHideColumn(): void {
    onChange({ ...column, hide: !column.hide });
  }

  return (
    <DragAndDropElement data={column as unknown as Record<string, unknown>}>
      <Stack
        direction="row"
        alignItems="center"
        borderBottom={1}
        borderColor={(theme) => theme.palette.divider}
        justifyContent="space-between"
        gap={4}
      >
        <Stack direction="row" gap={1}>
          <IconButton
            data-testid={`column-toggle#${column.name}`}
            size="small"
            onClick={() => onCollapse(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </IconButton>
          <Typography variant="overline" component="h4" sx={{ textTransform: 'none' }}>
            COLUMN:
            {column.header ? (
              <span>
                <strong>{column.header}</strong> ({column.name})
              </span>
            ) : (
              <strong>{column.name}</strong>
            )}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          {isCollapsed && (
            <>
              <Tooltip title={column.hide ? 'Show column' : 'Hide column'} placement="top">
                <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={handleHideColumn}>
                  {column.hide ? <EyeOffIcon /> : <EyeIcon />}
                </IconButton>
              </Tooltip>
              <Divider flexItem orientation="vertical" variant="middle" />
            </>
          )}
          <Tooltip title="Remove column settings" placement="top">
            <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reorder column settings" placement="top">
            <DragButton
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              menuSx={{
                '.MuiPaper-root': { backgroundColor: (theme) => theme.palette.background.lighter },
              }}
            />
          </Tooltip>
        </Stack>
      </Stack>
      {!isCollapsed && <ColumnEditor column={column} onChange={onChange} />}
    </DragAndDropElement>
  );
}
