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

import { Box, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import EyeIcon from 'mdi-material-ui/EyeOutline';
import EyeOffIcon from 'mdi-material-ui/EyeOffOutline';
import DragIcon from 'mdi-material-ui/Drag';
import { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { ColumnEditor, ColumnEditorProps } from './ColumnEditor';

type State =
  | {
      type: 'idle';
    }
  | {
      type: 'preview';
      container: HTMLElement;
    }
  | {
      type: 'is-dragging';
    }
  | {
      type: 'is-dragging-over';
      closestEdge: Edge | null;
    };

const idle: State = { type: 'idle' };

export function DropIndicator() {
  return (
    <Stack direction="row" alignItems="center">
      <Box
        sx={{
          content: '""',
          width: 8,
          height: 8,
          boxSizing: 'border-box',
          position: 'absolute',
          backgroundColor: (theme) => theme.palette.background.default,
          border: (theme) => `2px solid ${theme.palette.info.main}`,
          borderRadius: '50%',
        }}
      ></Box>
      <Box
        sx={{
          content: '""',
          height: 2,
          background: (theme) => theme.palette.info.main,
          width: '100%',
        }}
      ></Box>
    </Stack>
  );
}

export interface ColumnEditorContainerProps extends ColumnEditorProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onDelete: () => void;
}

export function ColumnEditorContainer({
  column,
  isCollapsed,
  onChange,
  onCollapse,
  onDelete,
}: ColumnEditorContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  // const [isDragged, setIsDragged] = useState(false);
  const [state, setState] = useState<State>(idle);

  function handleHideColumn() {
    onChange({ ...column, hide: !column.hide });
  }

  // useEffect(() => {
  //   const el = ref.current;
  //   if (!el) {
  //     return;
  //   }
  //
  //   return draggable({
  //     element: el,
  //     onDragStart: () => setIsDragged(true),
  //     onDrop: () => setIsDragged(false),
  //   });
  // }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    return combine(
      draggable({
        element,
        getInitialData() {
          return column as unknown as Record<string, unknown>;
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState(idle);
        },
      }),
      dropTargetForElements({
        element,
        canDrop({ source }) {
          // not allowing dropping on yourself
          if (source.element === element) {
            return false;
          }
          // only allowing tasks to be dropped on me
          // return isTaskData(source.data); TODO
          return true;
        },
        getData({ input }) {
          const data = column as unknown as Record<string, unknown>;
          // const data = getTaskData(task); TODO
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          });
        },
        getIsSticky() {
          return true;
        },
        onDragEnter({ self }) {
          const closestEdge = extractClosestEdge(self.data);
          setState({ type: 'is-dragging-over', closestEdge });
        },
        onDrag({ self }) {
          const closestEdge = extractClosestEdge(self.data);

          // Only need to update react state if nothing has changed.
          // Prevents re-rendering.
          setState((current) => {
            if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
              return current;
            }
            return { type: 'is-dragging-over', closestEdge };
          });
        },
        onDragLeave() {
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      })
    );
  }, [column]);

  return (
    <Stack spacing={1} ref={ref} style={{ opacity: state.type === 'is-dragging' ? 0.5 : 'unset' }}>
      {state.type === 'is-dragging-over' && state.closestEdge ? <DropIndicator /> : null}

      <Stack
        direction="row"
        alignItems="center"
        borderBottom={1}
        borderColor={(theme) => theme.palette.divider}
        justifyContent="space-between"
        gap={4}
      >
        <Stack direction="row" gap={1}>
          <IconButton size="small">
            <DragIcon />
          </IconButton>
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
        </Stack>
      </Stack>
      {!isCollapsed && <ColumnEditor column={column} onChange={onChange} />}
    </Stack>
  );
}
