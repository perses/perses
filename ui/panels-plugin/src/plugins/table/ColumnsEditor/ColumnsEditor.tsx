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

import { Button, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { flushSync } from 'react-dom';
import { ColumnSettings } from '../table-model';
import { ColumnEditorContainer } from './ColumnEditorContainer';

export interface ColumnsEditorProps {
  columnSettings: ColumnSettings[];
  onChange: (columnOptions: ColumnSettings[]) => void;
}

export function ColumnsEditor({ columnSettings, onChange }: ColumnsEditorProps) {
  const [columns, setColumns] = useState<ColumnSettings[]>(columnSettings);

  const [columnsCollapsed, setColumnsCollapsed] = useState(columns.map(() => true));

  function handleColumnChange(index: number, column: ColumnSettings): void {
    const updatedColumns = [...columns];
    updatedColumns[index] = column;
    setColumns(updatedColumns);
    onChange(updatedColumns);
  }

  function handleColumnAdd(): void {
    const columnName: string = `column_${Object.keys(columns).length}`;
    const updatedColumns = [...columns];
    updatedColumns.push({ name: columnName });
    setColumns(updatedColumns);
    onChange(updatedColumns);
    setColumnsCollapsed((prev) => {
      prev.push(false);
      return [...prev];
    });
  }

  function handleColumnDelete(index: number): void {
    const updatedColumns = [...columns];
    updatedColumns.splice(index, 1);
    setColumns(updatedColumns);
    onChange(updatedColumns);
    setColumnsCollapsed((prev) => {
      prev.splice(index, 1);
      return [...prev];
    });
  }

  function handleColumnCollapseExpand(index: number, collapsed: boolean): void {
    setColumnsCollapsed((prev) => {
      prev[index] = collapsed;
      return [...prev];
    });
  }

  useEffect(() => {
    return monitorForElements({
      // canMonitor({ source }) {
      //   return isTaskData(source.data);
      // },
      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data;
        const targetData = target.data;

        // if (!isTaskData(sourceData) || !isTaskData(targetData)) {
        //   return;
        // }

        const indexOfSource = columnSettings.findIndex((column) => column.name === sourceData.name);
        const indexOfTarget = columnSettings.findIndex((column) => column.name === targetData.name);

        console.log(indexOfSource);
        console.log(indexOfTarget);

        if (indexOfTarget < 0 || indexOfSource < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

        // Using `flushSync` so we can query the DOM straight after this line
        flushSync(() => {
          setColumns(
            reorderWithEdge({
              list: columnSettings,
              startIndex: indexOfSource,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: 'vertical',
            })
          );
        });
        // // Being simple and just querying for the task after the drop.
        // // We could use react context to register the element in a lookup,
        // // and then we could retrieve that element after the drop and use
        // // `triggerPostMoveFlash`. But this gets the job done.
        // const element = document.querySelector(`[data-task-id="${sourceData.taskId}"]`);
        // if (element instanceof HTMLElement) {
        //   triggerPostMoveFlash(element);
        // }
      },
    });
  }, [columnSettings]);

  return (
    <Stack spacing={1}>
      {columns.map((column, i) => (
        <ColumnEditorContainer
          key={i}
          column={column}
          isCollapsed={columnsCollapsed[i] ?? true}
          onChange={(updatedColumn: ColumnSettings) => handleColumnChange(i, updatedColumn)}
          onDelete={() => handleColumnDelete(i)}
          onCollapse={(collapsed) => handleColumnCollapseExpand(i, collapsed)}
        />
      ))}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleColumnAdd}>
        Add Column Settings
      </Button>
    </Stack>
  );
}
